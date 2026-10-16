<script lang="ts" generics="Id extends string">
	import type { Snippet } from 'svelte';
	import Search from '~icons/lucide/search';

	type Layout = 'grid' | 'list';

	interface Props {
		selected: Id[];
		/**
		 * Groups in display order; their ids also set the order of `selected`. `more` lists ids
		 * folded behind a "+N more" toggle until the group is expanded, unless they are selected.
		 */
		groups: { name: string; ids: Id[]; more?: Id[] }[];
		/** `short` is matched by the search field alongside `name` */
		items: Record<Id, { name: string; color: string; short?: string }>;
		/** the item's mark, in the current text colour; in the list layout it is the whole toggle */
		logo: Snippet<[id: Id, layout: Layout]>;
		/** 'grid' for the mobile sheet, 'list' for the narrow desktop sidebar */
		layout?: Layout;
		/** plural noun for the search field, e.g. 'series'; no field when omitted */
		searchNoun?: string;
	}

	let { selected = $bindable(), groups, items, logo, layout = 'grid', searchNoun }: Props = $props();

	let query = $state('');
	let expanded = $state<string[]>([]);
	/** Folded items toggled here stay visible, so switching one off doesn't whisk it away. */
	let touched = $state<Id[]>([]);

	const order = $derived(groups.flatMap((g) => g.ids));
	const needle = $derived(query.trim().toLowerCase());

	const visible = $derived(
		groups
			.map((g) => {
				const more = g.more ?? [];
				// Folding a single item saves nothing over the toggle that would replace it.
				const folded = !needle && more.length > 1 && !expanded.includes(g.name);
				const ids = needle
					? g.ids.filter((id) => [g.name, id, items[id].name, items[id].short ?? ''].some((s) => s.toLowerCase().includes(needle)))
					: folded
						? g.ids.filter((id) => !more.includes(id) || selected.includes(id) || touched.includes(id))
						: g.ids;
				return { ...g, shown: ids, hidden: folded ? g.ids.length - ids.length : 0, expandable: !needle && more.length > 1 };
			})
			.filter((g) => g.shown.length > 0)
	);

	function toggle(id: Id) {
		if (!touched.includes(id)) touched.push(id);
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : order.filter((s) => s === id || selected.includes(s));
	}

	function toggleGroup(ids: Id[]) {
		selected = ids.every((id) => selected.includes(id))
			? selected.filter((id) => !ids.includes(id))
			: order.filter((id) => selected.includes(id) || ids.includes(id));
	}

	function toggleExpanded(name: string) {
		expanded = expanded.includes(name) ? expanded.filter((n) => n !== name) : [...expanded, name];
	}
</script>

{#if searchNoun}
	<div class="relative">
		<Search class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" width="15" height="15" aria-hidden="true" />
		<input
			bind:value={query}
			onkeydown={(e) => e.key === 'Escape' && query && (e.preventDefault(), (query = ''))}
			class="w-full rounded-[10px] border border-line bg-bg py-2 pr-2.5 pl-9 text-base outline-none placeholder:text-muted focus:border-muted sm:text-sm"
			type="search"
			placeholder="Search {searchNoun}"
			autocomplete="off"
			spellcheck="false"
			aria-label="Search {searchNoun}"
		/>
	</div>
{/if}

{#each visible as { name, ids, shown, hidden, expandable } (name)}
	{@const count = ids.filter((id) => selected.includes(id)).length}
	<!-- While searching, the heading acts on the matches only. -->
	{@const targets = needle ? shown : ids}
	<section class={['flex flex-col', layout === 'grid' ? 'gap-2' : 'gap-1']}>
		<!-- The heading doubles as the group toggle, so there is no separate "select all" per group. -->
		<button
			class="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-0.5 text-xs font-semibold tracking-[0.06em] text-muted uppercase hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			title="{targets.every((id) => selected.includes(id)) ? 'Hide' : 'Show'} all {needle ? 'matching ' : ''}{name}"
			aria-pressed={targets.every((id) => selected.includes(id))}
			onclick={() => toggleGroup(targets)}
		>
			<span>{name}</span>
			<span class="font-medium tracking-normal tabular-nums normal-case opacity-75">{count}/{ids.length}</span>
		</button>
		<div class={layout === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-col gap-0.5'}>
			{#each shown as id (id)}
				{@const on = selected.includes(id)}
				<button
					class={[
						'flex cursor-pointer items-center transition-[color,opacity,background-color] duration-[120ms]',
						layout === 'grid'
							? [
									'h-11 gap-2.5 rounded-xl border px-3',
									on
										? 'border-[color-mix(in_srgb,var(--c)_45%,var(--color-line))] bg-[color-mix(in_srgb,var(--c)_12%,var(--color-panel))] text-fg'
										: 'border-line bg-bg text-muted'
								]
							: // In the sidebar the logo is the toggle: item colour when on, faded grey when off.
								['h-8 rounded-lg px-2 hover:bg-subtle', on ? 'text-(--c)' : 'text-muted opacity-35 hover:opacity-80']
					]}
					style:--c={items[id].color}
					aria-pressed={on}
					title={items[id].name}
					onclick={() => toggle(id)}
					ondblclick={() => (selected = [id])}
				>
					{#if layout === 'grid'}
						<span class={['box-border size-2.5 shrink-0 rounded-full border-[1.5px] border-(--c)', on && 'bg-(--c)']}></span>
					{/if}
					<span class="flex min-w-0 flex-1 items-center">{@render logo(id, layout)}</span>
				</button>
			{/each}
		</div>
		{#if expandable && (hidden > 0 || expanded.includes(name))}
			<button
				class={[
					'cursor-pointer self-start rounded-md px-1 py-0.5 text-xs font-[550] text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
					layout === 'list' && 'ml-1'
				]}
				aria-expanded={hidden === 0}
				onclick={() => toggleExpanded(name)}
			>
				{hidden > 0 ? `+${hidden} more` : 'Show fewer'}
			</button>
		{/if}
	</section>
{:else}
	<p class="px-1 py-6 text-center text-sm text-muted">No {searchNoun ?? 'items'} match “{query.trim()}”.</p>
{/each}
