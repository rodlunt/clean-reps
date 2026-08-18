<!-- Thanks for the PR. CONTRIBUTING.md is the two-minute read behind each line here. -->

## What and why

<!-- What changed, and the reason it needed to. A summary is fine if your commits
     already explain the detail. -->

## Verification

<!-- How you know this works: which Detox scenario you ran and on what device/emulator,
     a manual walkthrough, or a screen recording. There is no CI for this repo (it's a
     bare Expo app: no lint, typecheck or unit test script exists, and Detox e2e needs
     a real device or emulator CI doesn't have), so this section is the only proof a
     reviewer gets. -->

Closes #

## Checklist

- [ ] `pnpm install` completes clean from this branch
- [ ] `pnpm start` (Expo dev server) launches with no red-screen errors
- [ ] Ran the relevant Detox e2e scenario(s) against a device or emulator for any
      behaviour change (`pnpm test:e2e:debug` or `pnpm test:e2e`)
- [ ] Commits follow conventional commits (`fix:`, `feat:`, `docs:`, `chore:`, ...)
      with the why in the body
- [ ] Prose is Australian English with no em or en dashes
