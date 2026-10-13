<script lang="ts" generics="Id extends string">
	import type { Snippet } from 'svelte';

	type Layout = 'grid' | 'list';

	interface Props {
		selected: Id[];
		/** groups in display order; their ids also set the order of `selected` */
		groups: { name: string; ids: Id[] }[];
		items: Record<Id, { name: string; color: string }>;
		/** the item's mark, in the current text colour; in the list layout it is the whole toggle */
		logo: Snippet<[id: Id, layout: Layout]>;
		/** 'grid' for the mobile sheet, 'list' for the narrow desktop sidebar */
		layout?: Layout;
	}

	let { selected = $bindable(), groups, items, logo, layout = 'grid' }: Props = $props();

	const order = $derived(groups.flatMap((g) => g.ids));

	function toggle(id: Id) {
		selected = selected.includes(id) ? selected.filter((s) => s !== id) : order.filter((s) => s === id || selected.includes(s));
	}

	function toggleGroup(ids: Id[]) {
		selected = ids.every((id) => selected.includes(id))
			? selected.filter((id) => !ids.includes(id))
			: order.filter((id) => selected.includes(id) || ids.includes(id));
	}
</script>

{#each groups as { name, ids } (name)}
	{@const count = ids.filter((id) => selected.includes(id)).length}
	<section class={['flex flex-col', layout === 'grid' ? 'gap-2' : 'gap-1']}>
		<!-- The heading doubles as the group toggle, so there is no separate "select all" per group. -->
		<button
			class="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1 py-0.5 text-xs font-semibold tracking-[0.06em] text-muted uppercase hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			title="{count === ids.length ? 'Hide' : 'Show'} all {name}"
			aria-pressed={count === ids.length}
			onclick={() => toggleGroup(ids)}
		>
			<span>{name}</span>
			<span class="font-medium tracking-normal tabular-nums normal-case opacity-75">{count}/{ids.length}</span>
		</button>
		<div class={layout === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'flex flex-col gap-0.5'}>
			{#each ids as id (id)}
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
	</section>
{/each}
