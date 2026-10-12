# T08 — Correctness Review

**Verdict:** pass
**Timestamp:** 2026-10-12T21:45:00Z

## Acceptance criteria check

- [x] Component tree matches design §5 exactly (`App`, `Header`, `ModelSwitcher`, `MessageList`, `Message`, `Composer`, `Icon`). Markup parity verified programmatically: all 38 unique `className` strings of the Figma export appear 1:1 in the implementation (the only diffs are Prettier whitespace inside template literals and the prop-variable rename `item` → `message`); `src/index.css` is a byte-identical copy of the export (`diff` empty).
- [x] `src/index.css` carries the export's Tailwind v4 import, `@theme` font tokens (DM Sans body, Manrope display) and base styles verbatim; the palette tokens (`#17302e`, `#e8e4dc`, `#fbfaf7`, `#d66b50`, `#4e7667`) are carried verbatim as the export's arbitrary-value utilities in the markup — exactly where the export puts them (G-1).
- [x] Conversation starts empty (`useState<Message[]>([])` — the mockup's `initialMessages` are not used); `App` owns `messages`, `activeModel` (default `local`) and composer text in local state only.
- [x] `ModelSwitcher` renders "Local model" / "Private" and "Remote model" / "Cloud", marks the active option (`aria-selected="true"` + check icon opacity), closes on selection and on outside click.
- [x] `Composer`: Enter sends (optimistic user bubble appended, input cleared; no network call — T09 wires the POST), Shift+Enter inserts a newline without sending, the coral send button is disabled when the input is empty, the attach button is visual-only, "Enter to send" hint + disclaimer render per the mockup.
- [x] `Message` renders user bubbles right-aligned dark-green (`bg-[#1e4b47]`, `rounded-tr-md`) and assistant bubbles left-aligned white (`bg-white`, `rounded-tl-md`) with avatar, body and time; `MessageList` auto-scrolls on a new message (spy-asserted `scrollIntoView` after send).
- [x] Vitest + @testing-library/react configured (jsdom environment, jest-dom matchers, setup file with `afterEach(cleanup)` and a `scrollIntoView` shim); `pnpm test` exits 0 — 9 tests covering header/switcher/composer render per mockup, model switching, Enter-send, Shift+Enter-newline, send-disabled-when-empty, and both Message bubble variants. (The fetch-mocked cases are T09's, per the AC.)
- [x] `pnpm build`, `pnpm lint`, `pnpm test` all exit 0; Prettier check clean.

## Findings

1. **`src/models.ts` added beyond the component list** (informational): the export's `models` catalog (names/descriptions/labels) is UI data used by Header, ModelSwitcher and Composer; it lives in its own data module rather than being duplicated or buried in a component. Type-only content stays in `types.ts` per the design tree.
2. **Palette tokens are in markup, not `@theme`** (spec nuance): T08's AC lists the five palette tokens as carried by `index.css`, but the export's `index.css` defines only fonts in `@theme` — the colors exist solely as arbitrary-value utilities (`bg-[#e8e4dc]` etc.). Copying verbatim (G-1's actual requirement) means the tokens are carried in the markup; adding an `@theme` block would be a style edit the parity contract forbids.
3. **`afterEach(cleanup)` explicit in the setup file** (informational): RTL's auto-cleanup requires Vitest `globals: true`; with explicit imports the registration is done in `src/test/setup.ts` — the documented pattern for globals-free Vitest.

## Verdict

`T08 done | verified: ok`
