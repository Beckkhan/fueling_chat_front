# T15 — Code Style Review

**Verdict:** PASS
**Timestamp:** 2026-10-13T19:06:39Z

## Scope

Commit `ae4a968` ("T15: Frontend API Integration", frontend repo `/Users/Slava/fueling_chat_front`, 4 files: `M src/App.tsx`, `M src/AppSendFlow.test.tsx`, `A src/api/chat.test.ts`, `M src/api/chat.ts`, +192/−6) on branch `second` — quality gate 5 of 5. Prior gates PASS: `reviews/T15-test-engineer.md`, `T15-correctness-reviewer.md`, `T15-simplicity-reviewer.md`, `T15-git-reviewer.md`. All checks below ran on the committed tree: `git diff ae4a968 -- src` is empty; `git status --porcelain -uall` shows only the gate-review files as untracked.

Toolchain: node v22.23.3 / pnpm 12.11.2 (`PATH=/Users/Slava/.local/node/bin`); ESLint 9.39.5 flat config (`@eslint/js` recommended + `tseslint.configs.recommended` + react-hooks + `eslint-config-prettier`); Prettier 3.9.10 with `.prettierrc` (`semi: false`, `printWidth: 100`). The enforced lint path is `pnpm lint` = `eslint .` — the same step CI (`ci.yml`) runs; CI does not run `prettier --check`.

## Verification performed (fresh re-runs, not taken on trust)

- **ESLint**: `pnpm lint` → exit 0; re-run stricter as `pnpm exec eslint . --max-warnings 0` → exit 0 → 0 errors, 0 warnings.
- **Full acceptance chain**: `pnpm build && pnpm lint && pnpm test` → exit 0 (`tsc --noEmit` + vite build 24 modules; eslint clean; vitest 4 files / 24 tests passed — reproduces the gate-1 counts).
- **Prettier**: `pnpm exec prettier --check "src/**/*"` → "All matched files use Prettier code style!" — the whole `src` tree, including all four T15 files, is formatter-clean. Repo-wide `prettier --check .` flags only `pnpm-lock.yaml` + `pnpm-workspace.yaml` (Finding 2, pre-existing, outside the diff).
- **No suppressions added**: `eslint-disable*`, `prettier-ignore`, `@ts-ignore`, `@ts-expect-error`, `ts-nocheck` — grep over the added diff lines and over all of `src/` returns nothing.
- **No TODO/FIXME/XXX** anywhere in `src/` or in the diff (implementer's claim reproduced).
- **No debug/focus leftovers**: no `console.*`, `debugger`, `.only(`, `.skip(` in `src/`.
- **No explicit `any`**: no `: any`, `as any`, `<any>` in `src/`; test mocks use `as Response` / `as unknown as Response`.
- **Conventions**: `.prettierrc` no-semicolon + double-quote style respected (the only `;`-terminated lines in the changed files are inside JSDoc prose); naming consistent with the T09-review record — camelCase functions/consts (`sendChat`, `okBody`, `jsonResponse`), PascalCase types, contract field names verbatim snake_case (`fueling_id`, `elapsed_ms`), module const `API_BASE_URL` SCREAMING_SNAKE.
- **Spec §5, gate scope**: parameters ≤ 4 everywhere (max 3 in a test helper); no trivial KDoc — every added comment documents contract behaviour or decision-log references (the spec's *allowed* category), none repeats a name or explains syntax; `App.tsx` diff confirmed comments-only (all 12 added lines are `//`). Function-length and comment-volume rulings are Findings 1 and 3.
- **Auto-fix**: none applied — none needed; every file in the T15 scope is lint- and Prettier-clean on the committed tree. The only formatter-dirty files are two pre-existing YAMLs outside the diff, deliberately left untouched (see Finding 2).

## Findings

**Finding 1 (non-blocking) — Comment volume exceeds the repo's comment-minimal house style and, if the spec §5 comment limits apply to these doc blocks, their line limits.**
- Measured delta: the commit adds 50 comment lines (`App.tsx` 12, `api/chat.ts` 25, `api/chat.test.ts` 12, `AppSendFlow.test.tsx` 1), against a pre-T15 baseline of exactly 1 comment line in all of `src/` (the required `/// <reference types="vite/client" />`). Branch `first`'s T15 added 2. `api/chat.ts` is 25/56 comment lines; the class doc is 10 lines.
- Spec §5 ("Комментариев минимум"; limits: class ≤ 4 KDoc lines, function ≤ 2): `ChatApiError` class doc is 10 lines, `sendChat` function doc is 4 (const `API_BASE_URL` doc 4 — no limit category for consts). `sendChat` measures 33 physical lines including comments/blanks (23 code-only); note the branch-`first` T15 gate measured the same quantity as its "`sendChat` 27 lines (< 30)" size check, so under that ruler this diff nominally exceeds the 30-line limit, while by code-only lines it does not.
- Mitigating context: all content is in spec §5's allowed categories (external contracts CONTRACT-API-001/UI-002, decision-log refs D-7/D-9/D-10/D-13, design G-1); nothing is in the prohibited list (no trivial-class KDoc, no name repetition, no syntax explanation). Gates 1–3 each read these comments and treated them as neutral-to-positive; gate 3 explicitly ruled them "acceptable in this contract-driven repo. Non-blocking". They are also architect-scaffolded (dual-coder pipeline) and have zero runtime impact.
- Ruling: non-blocking for T15. Recommend a later comments-only trim at the next touch of these files: class doc → ≤ 4 lines, function doc → ≤ 2, and drop the `App.tsx` lines that narrate the diff itself ("no markup changes here", "no App state for it"). Recorded here with exact numbers as part of the branch `first` vs `second` style comparison (spec §7 / D-5).

**Finding 2 (non-blocking, pre-existing) — repo-wide `prettier --check .` fails on `pnpm-lock.yaml` and `pnpm-workspace.yaml`.**
- Verified pre-existing: both files are already formatter-dirty at the parent commit `4686d6c` (checked out and re-ran the check there), last touched by T07/T08, and untouched by T15 (`git show --name-only ae4a968` = the four src files only). CI runs only `pnpm lint` + `pnpm build`, neither of which invokes `prettier --check`; everything under `src/` — the T15 scope — is clean.
- Ruling: non-blocking, no auto-fix applied — running `prettier --write` on those files would add out-of-scope changes to the branch. Candidate for a `.prettierignore` entry (or a one-time `pnpm format`) at a future config touch.

**Finding 3 (non-blocking, pre-existing, out of T15 scope) — `App.tsx` `sendMessage` exceeds spec §5's 30-line function rule** (39 code lines; 53 physical after this commit's 12 added comment lines; 41 physical before).
- T15 changed none of its code (comments-only diff; 39 code lines before and after — measured at `4686d6c` and `ae4a968`). The identical function passed branch `first`'s T15 gate, and the branch-`first` gate scoped its size check to *added* functions. Future refactor candidate (e.g. extract the two `setMessages` appends); not this task's to fix.

## Notes

- Gate prerequisites hold: the four prior review files all head with a PASS verdict; none of their recommended follow-ups is a style item assigned to T15 rework.
- Sensitivity check for the experiment: the only style-relevant divergence between the two branch implementations of T15 is comment volume (Finding 1) — 50 added comment lines on `second` vs 2 on `first`. ESLint/Prettier/suppression/TODO status is identical: clean on both.

## Verdict

`T15-code-style-reviewer: PASS | verified: ok`
