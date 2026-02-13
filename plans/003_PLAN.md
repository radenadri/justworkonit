# Light/Dark/System Theme Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure a Light/Dark/System theme toggle is available in the global header, persisted in localStorage, and applied via `data-theme` with system mode support.

**Architecture:** Use the existing theme context (`ThemeProvider` + `useTheme`) and `ThemeToggle` UI, backed by `localStorage` and `prefers-color-scheme` listener. Apply the resolved theme by setting `data-theme` on `<html>` and use CSS variables in `src/index.css` for monochrome tokens.

**Tech Stack:** Bun + React 19 + React Router + Tailwind v4 (CSS variables in `src/index.css`).

---

## Preconditions / Constraints
- **No git commands** (user forbids).
- **Monochrome only**: no border-radius, no shadows, no accent colors beyond black/white/gray.
- **Persistence**: `localStorage` for mode selection.
- **System mode**: `prefers-color-scheme` listener; default to System when no saved preference.
- **Apply theme**: `data-theme` (or class) on `html`/`body` using CSS vars.
- **Toggle placement**: right side of global header.

## Blocker: Test Framework
There is no test framework configured in `package.json` (no `test` script). TDD is required, but we cannot run tests without a framework.

**Decision required before implementation:**
1) **Add a minimal test framework** (e.g., Vitest) to enable TDD, OR
2) **Grant explicit exception to skip TDD/tests** for this change.

> **Stop and request explicit exception before implementing.**

---

### Task 1: Verify existing theme infrastructure
**Files:**
- Review: `src/components/theme-context.tsx`
- Review: `src/components/theme-toggle.tsx`
- Review: `src/lib/theme.ts`
- Review: `src/index.css`
- Review: `src/components/layout/header.tsx`

**Step 1: Inspect existing theme context and toggle UI**
- Confirm localStorage usage, system media listener, and `data-theme` application.
- Confirm toggle is in global header and on the right side.

**Step 2: Identify any gaps vs requirements**
- Document any missing behavior or styling constraints.

---

### Task 2: (TDD) Add tests for theme utilities (ONLY if test framework approved)
**Files:**
- Create: `src/lib/theme.test.ts`
- Modify: `package.json` (add `test` script)
- Add: `vitest.config.ts` (or equivalent)

**Step 1: Write failing tests**
- `getInitialTheme` defaults to `system` when no stored preference.
- `resolveTheme("system", "dark")` returns `"dark"`.
- `getStoredTheme` returns `null` for invalid values.

**Step 2: Run tests to verify failures**
- Run: `bun test` (or `bunx vitest run`) — expect FAIL (missing implementation or config).

**Step 3: Minimal implementation**
- Update `src/lib/theme.ts` only if tests show gaps.

**Step 4: Run tests to verify green**
- Expect PASS.

---

### Task 3: Implement any missing theme behavior (if gaps found)
**Files:**
- Modify: `src/components/theme-context.tsx`
- Modify: `src/lib/theme.ts`
- Modify: `src/index.css`

**Step 1: Write failing test for missing behavior (if framework approved)**
- Example: `data-theme` reflects resolved system value.

**Step 2: Implement minimal change**
- Ensure `data-theme` updates and CSS vars handle dark mode.

**Step 3: Verify tests**
- Run tests and confirm PASS.

---

### Task 4: Header placement and monochrome UI checks
**Files:**
- Modify: `src/components/layout/header.tsx`
- Modify (if needed): `src/components/theme-toggle.tsx`

**Step 1: Write failing test for header placement (if framework approved)**
- Validate `ThemeToggle` renders in header navigation (right side).

**Step 2: Implement minimal change**
- Place toggle in right-side nav, keep monochrome styling.

**Step 3: Verify tests**
- Run tests and confirm PASS.

---

### Task 5: Verification
**Step 1: Run diagnostics**
- `lsp_diagnostics` on changed files.

**Step 2: Run build**
- Command: `bun run build`
- Expect success.

**Step 3: Run tests**
- If framework approved: run test command from Task 2.
- If exception granted: document skipped tests explicitly.

---

## Notes
- **Commit steps intentionally omitted** because git usage is forbidden.
- If no code changes are required after verification, document findings and still run build.
