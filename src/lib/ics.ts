export function escapeText(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold to 75 octets per RFC 5545 §3.1 without splitting UTF-8 sequences. */
export function fold(line: string): string {
	const enc = new TextEncoder();
	if (enc.encode(line).length <= 75) return line;
	const out: string[] = [];
	let current = '';
	let bytes = 0;
	for (const ch of line) {
		const len = enc.encode(ch).length;
		const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
		if (bytes + len > limit) {
			out.push(current);
			current = '';
			bytes = 0;
		}
		current += ch;
		bytes += len;
	}
	out.push(current);
	return out.join('\r\n ');
}

export const utcStamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export const dateStamp = (date: string) => date.replace(/-/g, '');

export function nextDay(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}


export interface CalendarEvent {
	/** stable across refreshes, so calendar apps update the event in place */
	uid: string;
	summary: string;
	/** ISO instants, or YYYY-MM-DD dates (end inclusive) when allDay */
	start: string;
	end: string;
	allDay: boolean;
	description?: string;
	location?: string;
	url?: string;
	category?: string;
}

export interface CalendarOptions {
	/** e.g. -//Outlap//Motorsport Calendar//EN */
	prodId: string;
	name: string;
	description: string;
	/** minutes before timed events; omitted or 0 = no alarm */
	alarm?: number;
}

/** A published, hourly-refreshed calendar feed. */
export function buildCalendar(events: CalendarEvent[], opts: CalendarOptions): string {
	const now = utcStamp(new Date().toISOString());
	const alarm =
		opts.alarm && opts.alarm > 0
			? ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', `TRIGGER:-PT${Math.round(opts.alarm)}M`, 'END:VALARM']
			: [];
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${opts.prodId}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		`X-WR-CALNAME:${escapeText(opts.name)}`,
		`X-WR-CALDESC:${escapeText(opts.description)}`,
		'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
		'X-PUBLISHED-TTL:PT1H'
	];
	for (const e of events) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:${e.uid}`,
			`DTSTAMP:${now}`,
			...(e.allDay
				? [`DTSTART;VALUE=DATE:${dateStamp(e.start)}`, `DTEND;VALUE=DATE:${dateStamp(nextDay(e.end))}`]
				: [`DTSTART:${utcStamp(e.start)}`, `DTEND:${utcStamp(e.end)}`]),
			`SUMMARY:${escapeText(e.summary)}`,
			...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
			...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
			...(e.url ? [`URL:${e.url}`] : []),
			...(e.category ? [`CATEGORIES:${escapeText(e.category)}`] : []),
			// All-day entries don't block time and have no meaningful start to remind about.
			...(e.allDay ? ['TRANSP:TRANSPARENT'] : alarm),
			'END:VEVENT'
		);
	}
	lines.push('END:VCALENDAR');
	return lines.map(fold).join('\r\n') + '\r\n';
}
