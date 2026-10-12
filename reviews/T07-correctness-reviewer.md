# T07 — Correctness Review

**Verdict:** pass
**Timestamp:** 2026-10-12T21:25:00Z

## Acceptance criteria check

- [x] `pnpm install` and `pnpm build` complete with 0 errors; `pnpm dev` serves the page (verified: dev server responds on http://localhost:5173/ with the `Fueling Chat` shell; minimal placeholder entry, replaced by T08).
- [x] `tsconfig.json` enables `strict: true` under TypeScript 5.7 (`typescript@5.7.3`, pinned exactly per D-4); `pnpm build` fails on a type error — verified by introducing `{42 as string}`, observing `error TS2352` abort the build, then reverting (build green again).
- [x] Tailwind CSS v4 wired via `@tailwindcss/vite` in `vite.config.ts`; no `tailwind.config.*` file exists.
- [x] ESLint flat config (`eslint.config.js`) uses typescript-eslint + react-hooks (`recommended-latest`) + `eslint-config-prettier` (last, so formatting rules stay off); `pnpm lint` exits 0 with 0 errors and 0 warnings on the scaffold.
- [x] Prettier configured (`.prettierrc`: `semi: false` to match the Figma export's code style, `printWidth: 100`); `package.json` exposes `"format": "prettier --write ."`; the Figma export's `oxfmt` script is absent (replaced by Prettier per design §5).
- [x] `package.json` pins the D-4 stack: Vite 8.3.4, React 19.3.0, TypeScript 5.7.3, Tailwind v4 (4.3.3), `"packageManager": "pnpm@12.11.2"`; `pnpm-lock.yaml` is committed.

## Findings

1. **ESLint pinned to 9.39.5, not the 10.x line** (informational): typescript-eslint 8.71.2's supported ESLint range is the 9.x line; the design pins only "ESLint flat config", so the latest compatible major was chosen. Nothing in the task requires ESLint 10.
2. **Prettier `semi: false`** (informational): the Figma export is written without semicolons; matching that style minimizes diff churn against the verbatim-copy requirement of T08 while Prettier (not oxfmt) remains the formatter.

## Verdict

`T07 done | verified: ok`
