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

