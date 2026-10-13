<script lang="ts" generics="Id extends string">
	import type { Snippet } from 'svelte';
	import SelectionList from './SelectionList.svelte';

	interface Props {
		open: boolean;
		selected: Id[];
		title: string;
		groups: { name: string; ids: Id[] }[];
		items: Record<Id, { name: string; color: string }>;
		logo: Snippet<[id: Id, layout: 'grid' | 'list']>;
	}

	let { open = $bindable(), selected = $bindable(), title, groups, items, logo }: Props = $props();

	const titleId = $props.id();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const total = $derived(groups.reduce((n, g) => n + g.ids.length, 0));
	const allSelected = $derived(selected.length === total);
</script>

<dialog
	class="m-auto mb-0 max-h-[85dvh] w-screen max-w-screen rounded-t-[18px] sm:mb-auto sm:w-[560px] sm:rounded-[18px] bg-panel p-0 text-fg shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop:bg-[rgb(10_10_12/0.45)] backdrop:backdrop-blur-[3px]"
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(e) => e.target === dialog && dialog.close()}
	aria-labelledby={titleId}
>
	<div class="flex flex-col gap-4 p-[22px] pb-[max(22px,env(safe-area-inset-bottom))]">
		<header class="flex items-center justify-between gap-3">
			<h2 id={titleId} class="text-[19px] font-bold tracking-[-0.01em]">{title}</h2>
			<div class="flex items-center gap-2">
				<button
					class="cursor-pointer rounded-lg bg-subtle px-3 py-1.5 text-[13px] font-[550]"
					onclick={() => (selected = allSelected ? [] : groups.flatMap((g) => g.ids))}
				>
					{allSelected ? 'Clear' : 'Select all'}
				</button>
				<button class="cursor-pointer rounded-lg bg-fg px-3 py-1.5 text-[13px] font-semibold text-bg" onclick={() => dialog.close()}>
					Done
				</button>
			</div>
		</header>

		<SelectionList bind:selected {groups} {items} {logo} />
	</div>
</dialog>
