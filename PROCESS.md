# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it.

## What I built

An interactive explainer for the Monty Hall problem: the visitor picks one of
three doors, the host reveals a goat behind another, and the visitor chooses to
switch or stay. Rather than being told switching wins 2/3 of the time, they see
it: wins are tallied separately for "switchers" and "stayers" as running,
side-by-side win-rate bars, and a "simulate 100 rounds instantly" button makes
the gap undeniable even without playing dozens of rounds by hand.

## The moments that mattered

1. **Adapting into the provisioned template instead of replacing its tooling.**
   The game was first built and fully verified (both viewports, keyboard nav,
   the simulate button) as a from-scratch static HTML/CSS/JS project, before it
   was clear that this course's assignment-1 repo already existed with a
   Vite+TypeScript template already provisioned. The obvious shortcut was to
   drop the plain JS/CSS/HTML in as-is and discard the build tooling; instead
   the game was ported into `main.ts` with real types (`Phase`, `Occupant`,
   a `getEl<T>` helper instead of scattering non-null assertions), so
   `pnpm check`/`build`/`lint` keep working exactly as the template's CI
   expects, rather than becoming dead scripts nobody runs. I knew it was right
   once `pnpm check` chained typecheck, build, oxlint, stylelint, and all 15
   vitest tests (the shipped invariants plus the evidence check) to green
   against the ported code, with no `pnpm` script left unused
   ([`08b17bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-u8033161/commit/08b17bb)).

2. **Fixing the `stylelint-config-standard` errors the template caught that the
   from-scratch build never saw** --- a deprecated `clip: rect(...)` (replaced
   with `clip-path: inset(50%)` for the visually-hidden heading), descending
   specificity between `.door:disabled` and `.door:hover:not(:disabled)`
   (reordered), and a plain `max-width: 480px` media query where this config
   wants range syntax (`width <= 480px`). None of these were visible by looking
   at the rendered page --- they only surfaced once the real template's lint
   config ran against the ported CSS, which is exactly what running the
   template's own checks early was for
   ([`08b17bb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-u8033161/commit/08b17bb)).

3. **Turning a CSS bug into a standing harness rule, not just a fix.** During
   the original build, the stay/switch/play-again buttons stayed visible on
   load despite `hidden` being set correctly in the markup. The cause: an
   author rule like `.actions { display: flex }` beats the browser's built-in
   `[hidden] { display: none }` regardless of selector specificity, because
   author-stylesheet rules always win over user-agent rules. Re-prompting
   would have fixed that one instance; instead the rule
   (`.your-class[hidden] { display: none; }` alongside any class that styles a
   `hidden`-toggled element) was written into this repo's `CLAUDE.md` so it
   applies to every element toggled this way going forward, not just the ones
   already caught. Verified by screenshotting the rendered page and reading
   `getComputedStyle(...).display`, not by re-reading the source
   ([`cba6d59`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-u8033161/commit/cba6d59)).
