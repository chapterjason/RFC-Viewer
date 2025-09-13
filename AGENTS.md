# Repository Guidelines

## Project Vision & Intent
- Goal: extract structured requirements and related artifacts from RFC-like plaintext using a whitespace-aware parser that preserves meaningful formatting.
- Principles: correctness over convenience, predictable output, and small, composable parsing primitives. Prefer explicitness and readability.
- Scope: build a reusable AST and utilities first; a CLI and integrations can layer on later.

## Project Structure & Module Organization
- Source code lives in `src/` (TypeScript, ESM). Key modules: `src/index.ts` (entry), `src/Tree/**` (AST, parser, matchers), `src/Utils/**` (helpers).
- Build output is written to `dist/`.
- Sample input assets live in `rfc/`.
- Keep new modules cohesive; prefer `src/<Area>/<Subarea>.ts` over flat files.

## Architecture Overview
- Core: `Tree/Parser.ts` produces a `Document` from a line-oriented cursor.
- Matchers: `Tree/Matcher/*` identify structural blocks by priority. The set of block kinds is open for extension.
- Nodes: `Tree/Node/*` define AST node shapes and positions.
- Utilities: `Utils/*` provide cursors and helpers for common parsing tasks.

## Build, Test, and Development Commands
- Install: `npm ci` (reproducible installs).
- Build: `npm run build` (TypeScript → `dist/`).
- Start: `npm start` (builds if needed, then runs `dist/index.js`).
- Type-check only: `npm run typecheck`.
- Watch compile: `npm run watch`.
- Dev (two terminals): `npm run dev:build` and `npm run dev:run` (Node 18+ for `--watch`).
- Clean: `npm run clean`.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled; fix all type errors before merging.
- Naming: do not use abbreviations; do not use single-letter names. In loops, name the counter `index`.
- Case: TypeScript files and folders always start with Uppercase (e.g., `Parser.ts`, `Tree/Matcher/IndentedBlockMatcher.ts`). Existing lowercase entries are legacy; prefer uppercase for any new code.
- Line endings: normalize inputs to `\n` and serialize using `\n`.
- Indentation: spaces only. Represent indentation internally as a count of spaces. Expand leading tabs to 4 spaces. Do not emit spaces on otherwise blank lines.
- Whitespace: preserve the count of blank lines between blocks and at file boundaries; do not preserve incidental whitespace on blank lines.
- Braces: always use `{}` for all control structures, even single statements.
- Comments: code should be self-explanatory; add concise comments only where logic is non-obvious.

## Testing Guidelines
- Test runner: Vitest. Place tests under `tests/**/*.spec.ts`.
- Commands: `npm test` (run), `npm run test:watch` (watch), `npm run coverage` (report).
- Focus: unit tests for parsers, matchers, and utilities (`Tree/Matcher/*`, `Utils/*`), including indentation and blank-line edge cases.
- Use short RFC-like snippets embedded directly in tests as string arrays; include several lines of context before and after each snippet to exercise matcher integration. Do not read files from outside `tests/`.
- Normalize line endings to `\n` in test strings and keep runs deterministic (no network or writes).

## CI Policy
- No CI is used for this project. Do not add workflow files or badges.
- Ensure `npm run typecheck` and `npm test` pass locally before opening a PR.

## Agent-Specific Instructions
- Align with the vision: prioritize parser correctness, whitespace fidelity, and simple, composable APIs.
- Follow naming and formatting rules rigorously (Uppercase TS files/folders, LF endings, spaces-only indentation, braces everywhere).
- Prefer minimal dependencies and explicit module boundaries. Avoid introducing CI. Tests must be self-contained and not read external fixtures.

## Commit & Pull Request Guidelines
- Commits: use clear, imperative subjects (e.g., "Add parser for indented blocks"). Group related changes; keep diffs focused.
- PRs: include a summary, rationale, and links to issues. Add before/after examples for parsing behavior. Confirm `npx tsc --noEmit` passes and include tests when behavior changes.

## Security & Dependencies
- Keep dependencies minimal. Justify new runtime dependencies and prefer dev-only tools when possible.
- Follow ESM (`"type": "module"`) and avoid CommonJS additions.
