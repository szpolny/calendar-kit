<script lang="ts">
	import Moon from '~icons/lucide/moon';
	import Sun from '~icons/lucide/sun';

	// The inline script in app.html sets data-theme before first paint: the saved choice, else the device setting
	let { storageKey, colors }: { storageKey: string; colors: { light: string; dark: string } } = $props();

	function toggle() {
		const root = document.documentElement;
		const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
		root.dataset.theme = theme;
		for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = colors[theme];
		try {
			localStorage.setItem(storageKey, theme);
		} catch {
			// storage unavailable; the choice lasts for this visit
		}
	}
</script>

<button
	class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-subtle text-muted hover:bg-[color-mix(in_srgb,var(--color-fg)_12%,var(--color-subtle))] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
	onclick={toggle}
	title="Toggle light/dark theme"
	aria-label="Toggle light/dark theme"
>
	<Moon class="dark:hidden" width="17" height="17" aria-hidden="true" />
	<Sun class="hidden dark:block" width="17" height="17" aria-hidden="true" />
</button>
