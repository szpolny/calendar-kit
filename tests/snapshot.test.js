import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSnapshotCache, fetchSnapshot } from '../dist/snapshot.js';

test('concurrent requests share a refresh and independent caches do not share data', async () => {
	let calls = 0;
	let release;
	const pending = new Promise((resolve) => { release = resolve; });
	const get = createSnapshotCache({ ttlMs: 1000, load: async () => { calls++; return pending; } });
	const a = get(), b = get();
	release({ events: ['race'] });
	assert.deepEqual(await a, { events: ['race'] });
	assert.strictEqual(await a, await b);
	await get();
	assert.equal(calls, 1);
	const other = createSnapshotCache({ ttlMs: 1000, load: async () => ({ events: ['show'] }) });
	assert.deepEqual(await other(), { events: ['show'] });
});

test('failed refresh retains last good data and throttles retries', async (t) => {
	t.mock.timers.enable({ apis: ['Date'], now: 10000 });
	let calls = 0;
	const errors = [];
	const get = createSnapshotCache({ ttlMs: 1000, onError: (e) => errors.push(e), load: async (previous) => {
		calls++;
		if (previous) throw new Error('offline');
		return { events: [1] };
	} });
	const original = await get();
	t.mock.timers.tick(1001);
	assert.strictEqual(await get(), original);
	assert.strictEqual(await get(), original);
	assert.equal(calls, 2);
	assert.equal(errors.length, 1);
});

test('initial failure is unavailable, and the next request can recover', async () => {
	let fail = true;
	const get = createSnapshotCache({ ttlMs: 1000, load: async () => {
		if (fail) throw new Error('offline');
		return [];
	} });
	await assert.rejects(get(), /Schedule unavailable/);
	fail = false;
	assert.deepEqual(await get(), []);
});

test('background refresh serves old data while production waits for fresh data', async (t) => {
	t.mock.timers.enable({ apis: ['Date'], now: 10000 });
	for (const backgroundRefresh of [true, false]) {
		let release;
		let calls = 0;
		const get = createSnapshotCache({ ttlMs: 1000, backgroundRefresh, load: async () => {
			if (++calls === 1) return 'old';
			return new Promise((resolve) => { release = resolve; });
		} });
		assert.equal(await get(), 'old');
		t.mock.timers.tick(1001);
		const refresh = get();
		await Promise.resolve();
		if (backgroundRefresh) assert.equal(await refresh, 'old');
		release('new');
		if (!backgroundRefresh) assert.equal(await refresh, 'new');
	}
});

test('snapshot transport rejects unsuccessful responses', async (t) => {
	t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
	await assert.rejects(fetchSnapshot('https://example.com/schedule.json'), /HTTP 503/);
});
