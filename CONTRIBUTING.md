# Contributing

Thanks for wanting to improve Clean Reps. This is a solo-maintained hobby project, so the
process is deliberately light.

## Where things go

- **Bugs**: [open an issue](https://github.com/rodlunt/clean-reps/issues/new/choose) using
  the bug report form. Device, OS version and app version are the three things that get a
  bug fixed fast.
- **Ideas and feature requests**: [open an issue](https://github.com/rodlunt/clean-reps/issues/new/choose)
  using the feature request form.
- **Security problems**: never as a public issue. See [SECURITY.md](SECURITY.md).

## Development setup

The project uses [pnpm](https://pnpm.io/) (never npm, see `.npmrc`) with
[Expo](https://docs.expo.dev/):

```sh
git clone https://github.com/rodlunt/clean-reps
cd clean-reps
pnpm install
pnpm start
```

- Android builds need Android Studio; iOS builds need Xcode on a Mac.
- End-to-end tests use [Detox](https://wix.github.io/Detox/) against a real device or
  emulator: `pnpm test:e2e:debug` (debug build) or `pnpm test:e2e` (release build). Detox
  needs a connected device or running emulator, so it can't run headless in CI, which is
  why this repository has no CI workflow: there's also no lint, typecheck or unit test
  script to gate on. Treat the checklist below as the manual equivalent.

## Checks to run before pushing

There's no automated CI here, so these are on you:

```sh
pnpm install          # confirms the lockfile still resolves cleanly
pnpm start             # confirms the app boots with no red-screen errors
pnpm test:e2e:debug    # for any behaviour change, run the relevant Detox scenario
```

## Expectations for a pull request

- **Branch from `main`**, named descriptively (`fix/...`, `feat/...`, `chore/...`).
- **Conventional commit messages** (`fix:`, `feat:`, `docs:`, `refactor:`, `test:`,
  `chore:`), imperative subject, body explaining why rather than what.
- **Link the tracking issue** with a `Closes #N` line in the PR body, when one exists.
- **Tests for behaviour changes.** A Detox scenario covering the change, or a note in the
  PR's Verification section explaining why one doesn't apply.
- **Prose in Australian English**, and no em or en dashes anywhere (commas, colons,
  parentheses or hyphens instead); this matches the rest of the repository.

Every change lands via a pull request; there's no required review count on a solo repo
(GitHub blocks an author approving their own PR), but every diff is read before merging.

## Licence

By contributing you agree your contributions are licensed under this repository's
[MIT licence](LICENSE).
