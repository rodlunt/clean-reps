# Security Policy

Clean Reps stores all data locally on your device (AsyncStorage). There's no server, no
account system and no network calls in the app itself, so the realistic attack surface is
narrow: the app bundle, its dependencies, and the local data store. Still, if you find a
problem, please report it privately rather than as a public issue.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/rodlunt/clean-reps/security/advisories/new)**

This opens a draft security advisory that only the maintainer can see until it's
published. Please don't open a public issue or discuss a suspected vulnerability
anywhere public before it's been triaged.

Include, where you can:

- A description of the issue and its impact
- Steps to reproduce, or a minimal example
- The app version and platform (Android/iOS) you tested on

## What to expect

This is a solo-maintained hobby project, so there's no formal SLA. Reports are read and
acknowledged as soon as practical, and a fix or mitigation follows once the issue is
understood. Credit is offered in the advisory unless you'd rather stay anonymous.

## Supported versions

Only the latest published release is supported. There's no long-term support branch.
