export interface SnapshotCacheOptions<T> {
	load: (previous: T | undefined) => Promise<T>;
	ttlMs: number;
	/** Enable only on hosts that keep background work alive after a response. */
	backgroundRefresh?: boolean;
	onError?: (error: unknown) => void;
}

/** An isolated last-good cache; concurrent readers share one refresh. */
export function createSnapshotCache<T>(options: SnapshotCacheOptions<T>): () => Promise<T> {
	let cached: T | undefined;
	let attemptedAt = 0;
	let inflight: Promise<void> | undefined;

	function refresh(): Promise<void> {
		inflight ??= Promise.resolve()
			.then(() => options.load(cached))
			.then((value) => { cached = value; })
			.catch((error: unknown) => { options.onError?.(error); })
			.finally(() => {
				attemptedAt = Date.now();
				inflight = undefined;
			});
		return inflight;
	}

	return async () => {
		const stale = Date.now() - attemptedAt > options.ttlMs;
		if (cached === undefined || (stale && !options.backgroundRefresh)) await refresh();
		else if (stale) void refresh();
		if (cached === undefined) throw new Error('Schedule unavailable');
		return cached;
	};
}

export async function fetchSnapshot<T>(url: string): Promise<T> {
	const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	return res.json();
}

export interface SourceStatus {
	/** human-readable origin, shown in the UI */
	source: string;
	ok: boolean;
	error?: string;
	/** when the data now served was fetched; kept from the last good run while a source fails */
	fetchedAt?: string;
}

export interface LoadSourcesOptions<S, T> {
	load: (source: S) => Promise<T[]>;
	/** the source's items in the last good snapshot */
	fallback: (source: S) => T[];
	/** statuses from the last good snapshot */
	previous?: SourceStatus[];
}

/**
 * Load every source in parallel. A source that throws keeps serving its last good
 * items and is reported as failing, so one broken site never empties the schedule.
 */
export function loadSources<S extends { label: string }, T>(
	sources: S[],
	{ load, fallback, previous }: LoadSourcesOptions<S, T>
): Promise<{ source: S; items: T[]; status: SourceStatus }[]> {
	return Promise.all(
		sources.map(async (source) => {
			try {
				const items = await load(source);
				return { source, items, status: { source: source.label, ok: true, fetchedAt: new Date().toISOString() } };
			} catch (e) {
				const error = e instanceof Error ? e.message : String(e);
				console.error(`[schedule] ${source.label} failed:`, error);
				const fetchedAt = previous?.find((s) => s.source === source.label)?.fetchedAt;
				return { source, items: fallback(source), status: { source: source.label, ok: false, error, fetchedAt } };
			}
		})
	);
}
