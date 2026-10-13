/** Saved preferences, or null when there are none or storage is blocked. Validate every field before use. */
export function readPrefs(key: string): Record<string, unknown> | null {
	try {
		const prefs: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
		return prefs && typeof prefs === 'object' && !Array.isArray(prefs) ? (prefs as Record<string, unknown>) : null;
	} catch {
		return null;
	}
}

export function writePrefs(key: string, prefs: object): void {
	try {
		localStorage.setItem(key, JSON.stringify(prefs));
	} catch {
		// storage unavailable; the choice lasts for this visit
	}
}
