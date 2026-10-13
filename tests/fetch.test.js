import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchText, fetchOptional, HttpError, mapLimit } from '../dist/fetch.js';

test('HTTP errors preserve identity and optional sources only swallow 404', async (t) => {
	let calls = 0;
	t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('', { status: 404 }); });
	assert.equal(await fetchOptional('https://example.com/missing'), null);
	await assert.rejects(fetchText('https://example.com/missing'), (e) => e instanceof HttpError && e.status === 404);
	assert.equal(calls, 2);
	t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 403 }));
	await assert.rejects(fetchOptional('https://example.com/private'), /HTTP 403/);
});

test('fetch supports a caller-specific user agent', async (t) => {
	t.mock.method(globalThis, 'fetch', async (_url, options) => {
		assert.equal(options.headers['user-agent'], 'Calendar test');
		return new Response('ok');
	});
	assert.equal(await fetchText('https://example.com', 1000, 'Calendar test'), 'ok');
});

test('bounded concurrency preserves input order', async () => {
	let active = 0, peak = 0;
	const result = await mapLimit([3, 1, 2, 4], 2, async (n) => {
		peak = Math.max(peak, ++active);
		await Promise.resolve();
		active--;
		return n * 2;
	});
	assert.deepEqual(result, [6, 2, 4, 8]);
	assert.equal(peak, 2);
});
