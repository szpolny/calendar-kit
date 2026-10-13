# Calendar Kit

Shared Svelte 5 calendar controls, date and ICS helpers, HTTP utilities, and
schedule caching. Extracted from [Outlap](https://github.com/szpolny/outlap).

## Development

```sh
pnpm install
pnpm check
pnpm build
pnpm test
```

## Usage

Add this repo as a submodule at `packages/calendar-kit` and include it in your
pnpm workspace with a `workspace:*` dependency. Import from
`@szpolny/calendar-kit/<export>`; build the package before running the app.

Controls require Tailwind 4 theme tokens, a `dark` variant, and Lucide icons via
`unplugin-icons`. Add `@source '../packages/calendar-kit/dist';` to `src/app.css`.
Keep theme-toggle settings consistent with the app's first-paint theme script.

Clone with `--recurse-submodules`, or run `git submodule update --init --recursive`
after pulling. Push shared changes first, then update each app's submodule pin.

MIT licensed.
