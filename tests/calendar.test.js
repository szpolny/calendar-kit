import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localDate, addDays, weekStart, fmtRange, zonedToUtc, endMs } from '../dist/dates.js';
import { escapeText, fold, nextDay, utcStamp, buildCalendar } from '../dist/ics.js';
import { slugify, decodeEntities } from '../dist/text.js';

test('dates cross month, year and daylight-saving boundaries without shifting date-only values', () => {
	assert.equal(addDays('2024-02-28', 1), '2024-02-29');
	assert.equal(nextDay('2026-12-31'), '2027-01-01');
	assert.equal(weekStart('2027-01-03'), '2026-12-28');
	assert.equal(localDate('2026-10-13T00:30:00Z', 'America/New_York'), '2026-10-12');
	assert.equal(zonedToUtc(2026, 3, 7, 19, 30, 'America/New_York'), '2026-03-08T00:30:00.000Z');
	assert.equal(zonedToUtc(2026, 3, 8, 19, 30, 'America/New_York'), '2026-03-08T23:30:00.000Z');
	assert.equal(fmtRange('2026-10-30', '2026-11-01'), '30 Oct – 1 Nov');
});

test('ICS escapes text and folds by UTF-8 bytes without losing Unicode', () => {
	assert.equal(escapeText('A, B; C\\D\nE'), 'A\\, B\\; C\\\\D\\nE');
	const line = `SUMMARY:${'🏁 Łódź 東京 '.repeat(30)}`;
	const folded = fold(line);
	assert.equal(folded.replace(/\r\n /g, ''), line);
	for (const part of folded.split('\r\n')) assert.ok(Buffer.byteLength(part) <= 75);
	assert.equal(utcStamp('2026-10-13T19:30:00.000Z'), '20261013T193000Z');
});

test('calendar feeds mark all-day entries transparent and only remind about timed ones', () => {
	const ics = buildCalendar(
		[
			{ uid: 'a@x', summary: 'Timed, one', start: '2026-10-13T19:30:00.000Z', end: '2026-10-13T21:30:00.000Z', allDay: false, location: 'Łódź' },
			{ uid: 'b@x', summary: 'All day', start: '2026-10-30', end: '2026-11-01', allDay: true }
		],
		{ prodId: '-//Test//EN', name: 'Test', description: 'Shows, refreshed', alarm: 15 }
	);
	assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
	assert.match(ics, /X-WR-CALDESC:Shows\\, refreshed\r\n/);
	assert.match(ics, /DTSTART:20261013T193000Z\r\nDTEND:20261013T213000Z\r\nSUMMARY:Timed\\, one\r\nLOCATION:Łódź/);
	assert.match(ics, /DTSTART;VALUE=DATE:20261030\r\nDTEND;VALUE=DATE:20261102/);
	assert.equal(ics.match(/TRIGGER:-PT15M/g)?.length, 1);
	assert.equal(ics.match(/TRANSP:TRANSPARENT/g)?.length, 1);
});

test('end instants, slugs and entity decoding', () => {
	assert.equal(endMs({ allDay: true, end: '2026-11-01' }), Date.parse('2026-11-02T00:00:00Z'));
	assert.equal(endMs({ allDay: false, end: '2026-11-01T12:00:00Z' }), Date.parse('2026-11-01T12:00:00Z'));
	assert.equal(slugify('Gran Premio de España 2026!'), 'gran-premio-de-espana-2026');
	assert.equal(decodeEntities(' AT&amp;T &#8211; Ciudad&nbsp;de\n  México &#x2019; '), 'AT&T – Ciudad de México ’');
});
