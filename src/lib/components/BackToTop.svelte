<script lang="ts">
	import ArrowUp from '~icons/lucide/arrow-up';

	let scrollY = $state(0);
	let innerHeight = $state(0);

	// Appears once the viewer is a screen and a half down the page.
	const visible = $derived(scrollY > innerHeight * 1.5);

	function scrollToTop() {
		const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
	}
</script>

<svelte:window bind:scrollY bind:innerHeight />

<button
	class={[
		'fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-panel text-fg shadow-card transition-[opacity,translate] duration-200 hover:bg-subtle sm:right-6 sm:bottom-6',
		visible ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
	]}
	onclick={scrollToTop}
	aria-label="Scroll to top"
	title="Scroll to top"
	tabindex={visible ? 0 : -1}
>
	<ArrowUp width="20" height="20" aria-hidden="true" />
</button>
