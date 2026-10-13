export const DAY_MS = 86_400_000;
const FORMATTERS = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = `${locale}:${JSON.stringify(options)}`;
	let value = FORMATTERS.get(key);
	if (!value) {
		value = new Intl.DateTimeFormat(locale, options);
		FORMATTERS.set(key, value);
	}
	return value;
}

export function localDate(iso: string, timeZone: string): string {
	// en-CA formats as YYYY-MM-DD
	return formatter('en-CA', { timeZone }).format(new Date(iso));
}

export function addDays(date: string, days: number): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function weekStart(date: string): string {
	const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
	return addDays(date, -((dow + 6) % 7));
}

export function fmtDate(date: string, opts: Intl.DateTimeFormatOptions): string {
	return formatter('en-GB', { ...opts, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

export function fmtTime(iso: string, timeZone: string): string {
	return formatter('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(new Date(iso));
}

export function fmtDay(iso: string, timeZone: string): string {
	return formatter('en-GB', { weekday: 'short', timeZone }).format(new Date(iso));
}

export function fmtRange(from: string, to: string): string {
	if (from === to) return fmtDate(from, { day: 'numeric', month: 'short' });
	const sameMonth = from.slice(0, 7) === to.slice(0, 7);
	const a = fmtDate(from, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
	return `${a} – ${fmtDate(to, { day: 'numeric', month: 'short' })}`;
}

export function countdown(iso: string, now: number): string {
	const mins = Math.max(1, Math.round((Date.parse(iso) - now) / 60_000));
	const d = Math.floor(mins / 1440);
	const h = Math.floor((mins % 1440) / 60);
	const m = mins % 60;
	if (d >= 2) return `${d} days`;
	if (d === 1) return `1d ${h}h`;
	return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function zoneName(iso: string, timeZone: string): string {
	return (
		formatter('en-US', { timeZone, timeZoneName: 'short' })
			.formatToParts(new Date(iso))
			.find((p) => p.type === 'timeZoneName')?.value ?? ''
	);
}

export function addMinutes(iso: string, minutes: number): string {
	return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

export function zonedToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	timeZone: string
): string {
	const guess = Date.UTC(year, month - 1, day, hour, minute);
	// Offset of the zone at (approximately) that instant; iterate once to settle DST edges.
	let utc = guess - tzOffsetMs(guess, timeZone);
	utc = guess - tzOffsetMs(utc, timeZone);
	return new Date(utc).toISOString();
}

function tzOffsetMs(instant: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	}).formatToParts(new Date(instant));
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
	const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
	return asUtc - Math.floor(instant / 1000) * 1000;
}
