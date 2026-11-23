---
title: "ddev-claude: Claude Code in YOLO mode, in a DDEV sandbox"
description: "A DDEV add-on that runs Claude Code without permission prompts in a firewalled container: why we built it, what it protects, and its version history."
lang: en
slug: ddev-claude
date: 2026-09-29
updated: 2026-11-22
author: "Hamza Makraz"
category: "Engineering"
authorRole: "Founder, MAKRAZ — software engineer"
ctaTitle: "Want AI-assisted development set up safely for your team?"
faq:
  - q: "Is it safe to run Claude Code with `--dangerously-skip-permissions` in ddev-claude?"
    a: "Safer, not safe. The agent runs in its own container, and its outbound traffic is limited to an allow-list (which includes your own machine), with documented gaps such as DNS tunnelling and ping. But it can read your whole project, including `.env`, and any API keys or tokens in the container, including your Claude login. Any allowed host, GitHub included, can carry data out. And it can change or delete anything in your project. Keep backups and review what it writes to `.git/` and `.ddev/`, because Git hooks and DDEV host commands written there run on your machine."
  - q: "Does ddev-claude need an Anthropic API key?"
    a: "No. If `ANTHROPIC_API_KEY` is not set, Claude Code asks you to log in with your Claude account (a subscription or an Anthropic Console account) the first time you run `ddev claude`."
  - q: "How do I allow an extra domain in ddev-claude?"
    a: "Add it under `extra_allowed_domains` in `.ddev/claude.yaml`, then run `ddev claude rebuild && ddev restart`."
  - q: "Does ddev-claude work without Mutagen?"
    a: "Yes. Without Mutagen the project is mounted from your machine; with Mutagen enabled, the container shares DDEV's synced volume, which was much faster on macOS in our tests."
services: [devops-cloud]
---

**In short:** ddev-claude is an open-source DDEV add-on that runs Claude Code in YOLO mode (no permission prompts) inside its own container. A firewall limits its outbound traffic to Anthropic, GitHub, your DDEV services, your machine (the host gateway) and the domains you or your enabled extras allow, with documented gaps such as DNS tunnelling, ping, and data sent out through allowed hosts like GitHub. It guards against accidental data leaks, but it is not a vault for the secrets inside your project, and files it writes to `.git/` or `.ddev/` can run on your machine. Install it with `ddev add-on get makraz/ddev-claude`.

[ddev-claude](https://github.com/makraz/ddev-claude) is an open-source DDEV add-on that runs Claude Code, Anthropic's AI coding agent, in its own container next to your project (a "sidecar"). Inside that container the agent runs with `--dangerously-skip-permissions`, often called YOLO mode, so it works without asking for approval at every step. A firewall decides where it can connect.

Two commands install it in any DDEV project, and a third starts it:

```bash
ddev add-on get makraz/ddev-claude
ddev restart
ddev claude
```

## Why run Claude Code in a sandbox?

An AI coding agent is most useful when it can work for a long stretch without supervision: run the tests, read the error, fix the code, run the tests again. By default Claude Code asks permission before each command, which is safe but means you have to sit and click "yes" all session. The obvious way out is the `--dangerously-skip-permissions` flag, and the name says it all: on your own machine, an agent that goes wrong can delete files, read your SSH keys, or send data anywhere on the internet.

We already run every client project in [DDEV](https://ddev.com), so each project has its own containers and its own network. Putting the agent in one more container on that network was the natural answer: it sees the project code and the DDEV services (`web`, `db`, other add-ons), but not your home directory, your SSH keys or your other projects.

## What does ddev-claude do?

- **A separate sidecar container.** The agent runs as the `claude` service, as an unprivileged user, on a small `debian:bookworm-slim` image. Your home directory, SSH keys and other projects are not mounted.
- **An outbound allow-list.** Standard Linux network tools (iptables, ipset and dnsmasq) block outbound connections except to Anthropic, GitHub, the DDEV network, the host gateway (your machine, as Docker sees it) and the domains you add (see the limits below). While the agent runs, the allow-list lives in root-owned files it cannot edit, and the firewall starts with the container, so every way into the container (`ddev claude`, `ddev exec -s claude`, `docker exec`) goes through the firewall once it is up (if it fails at start, only `ddev claude` retries it).
- **Simple commands.** `ddev claude` opens a session, `ddev claude safe` runs with permission prompts, `ddev claude shell` opens a shell inside the sandbox, and `ddev claude exec <cmd>` runs a single command.
- **One config file.** `.ddev/claude.yaml` controls the optional extras (`php`, `python`, `node`), additional allowed domains, which built-in tools the agent uses by default, which plugins are on, and how the project is mounted.

```yaml
extras:
  - php
extra_allowed_domains:
  - sentry.io
```

Apply changes with `ddev claude rebuild && ddev restart`.

## What does ddev-claude not protect against?

We'd rather be clear about this. The agent can read and change your whole project tree, including `.env`, and it can reach the project's database: it can still delete files or drop tables inside the project. The firewall controls *where* traffic can go, not *what* goes through a destination you allowed: any allowed host, GitHub included, can carry data out, whether the agent pushes with your token (`GITHUB_PERSONAL_ACCESS_TOKEN`, if you pass one in) or with one an attacker supplies. If you pass a token, give it the narrowest scopes you can.

The `SECURITY.md` file lists the remaining gaps, including: DNS tunnelling (hiding data inside DNS queries) through the allowed resolver, ICMP echo (ping), sites that share a CDN address with an allowed domain, and any service listening on your machine, since the host gateway is allowed on every port. The agent can also write files that take effect later, outside the sandbox: Git hooks and DDEV host commands that run on your machine, and the Dockerfile escape hatch (`.ddev/claude.local/Dockerfile.fragment`) or `.ddev/claude.yaml` (including its allowed domains), which apply at the next rebuild.

So the sandbox guards against accidental data leaks, limits the agent's network access to the allow-list (within the gaps above) and its file access to the project. Still, review what it writes to `.git/` and `.ddev/` before you run or rebuild anything. It is not a vault for secrets.

## Version history

**v0.1.0 (6 May 2026): first release.** Everything was included: PHP, Composer, Playwright, Chromium, MCP servers and the GitHub CLI, in an image of about 1.5 GB.

**v0.2.0 (3 June): a minimal sidecar.** The default image dropped to Claude Code plus the firewall, about 300 MB. PHP became an opt-in extra in `.ddev/claude.yaml`; the rest (Playwright, the GitHub CLI, MCP servers) moved to an escape hatch (`.ddev/claude.local/Dockerfile.fragment`), with ready-made snippets in the README. This release also added the `safe`, `shell`, `exec`, `rebuild` and `help` subcommands.

**v0.3.0 betas (June): pre-built image and security hardening.**
- A multi-arch base image (`ghcr.io/makraz/ddev-claude-base`) published from the repository, pinned to the add-on version.
- The allow-list can no longer be widened from inside the running sandbox. Before this, the agent could add a domain to a file in the project and re-run the firewall script.
- The container's first process now turns on the firewall at start, so `docker exec` is sandboxed too.
- The `php` extra checks the fingerprint of the Sury repository's signing key, and the firewall refuses to start if IPv6 is reachable but can't be filtered.
- Re-checking the firewall on each `ddev claude` became near-instant.

**v0.4.0 (21 August 2026): the first stable release since v0.2.** `ddev add-on get` only installs stable releases by default, so none of the v0.3 betas reached anyone installing the default version. Lesson learned. This release:
- Closed a hole that dated from the first version: port 53 was open to *any* host, which allowed DNS tunnelling or a raw connection to any server listening on 53. Port 53 now only reaches the configured DNS resolvers.
- Limited the agent's built-in tools to `Read`, `Write`, `Bash` and `Skill` by default, and curated the plugins. These are defaults that control cost, not a security boundary.
- Moved the agent's state to a Docker volume and added `ddev claude state` to copy it out.
- When Mutagen is enabled, shares DDEV's Mutagen-synced volume instead of a host bind mount: a `grep` over `vendor/` went from 28.4 s to 0.065 s on our machine.
- Added the `python` and `node` extras, and published the image with a build provenance attestation and an SBOM (a list of everything inside the image).

**v0.4.1 (31 August 2026):** a blocked connection now fails immediately instead of hanging until the client's timeout (up to 300 s for curl).

**v0.4.2 (26 September 2026):** the base image was rebuilt with the Claude Code release current at the time, and the release procedure now signs and verifies tags.

## Try it

The add-on is MIT-licensed and listed in the [DDEV add-on registry](https://addons.ddev.com). The README and `SECURITY.md` in the [repository](https://github.com/makraz/ddev-claude) cover every option and every known limit. Issues and pull requests are welcome.

Setting up safe, fast development environments like this one is part of our [DevOps & Cloud](/en/services/devops-cloud) work. For the skills we use with the agent inside the sandbox, see [how I use Claude Code skills every day](/en/blog/claude-code-skills).
