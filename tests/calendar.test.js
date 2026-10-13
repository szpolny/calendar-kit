import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localDate, addDays, weekStart, fmtRange, zonedToUtc } from '../dist/dates.js';
import { escapeText, fold, nextDay, utcStamp } from '../dist/ics.js';

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
