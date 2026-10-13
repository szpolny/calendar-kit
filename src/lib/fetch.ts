const USER_AGENT = 'Mozilla/5.0 (compatible)';

const ATTEMPTS = 3;

/** Fetch with a per-attempt timeout, retrying timeouts, network errors and 5xx/429. */
export async function fetchText(url: string, timeoutMs = 20_000, userAgent = USER_AGENT): Promise<string> {
	for (let attempt = 1; ; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { 'user-agent': userAgent, accept: '*/*' },
				signal: AbortSignal.timeout(timeoutMs)
			});
			if (!res.ok) throw new HttpError(url, res.status);
			return await res.text();
		} catch (e) {
			const retryable = !(e instanceof HttpError) || e.status >= 500 || e.status === 429;
			if (!retryable || attempt >= ATTEMPTS) throw e;
			await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
		}
	}
}

export class HttpError extends Error {
	constructor(
		readonly url: string,
		readonly status: number
	) {
		super(`HTTP ${status} for ${url}`);
	}
}

export async function fetchJson<T>(url: string): Promise<T> {
	return JSON.parse(await fetchText(url));
}

/** Run `fn` over `items` with bounded concurrency, preserving order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const out = new Array<R>(items.length);
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const i = next++;
			out[i] = await fn(items[i]);
		}
	});
	await Promise.all(workers);
	return out;
}


export async function fetchOptional(url: string): Promise<string | null> {
	try {
		return await fetchText(url);
	} catch (e) {
		if (e instanceof HttpError && e.status === 404) return null;
		throw e;
	}
}
