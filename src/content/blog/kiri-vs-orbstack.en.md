---
title: "Kiri vs OrbStack: Docker on macOS, benchmarked"
description: "Kiri vs OrbStack on an M4 Pro with a DDEV PHP stack: Kiri used ~1/6 of OrbStack's RAM with nothing running, OrbStack 1/3 of Kiri's CPU with the project idle."
lang: en
slug: kiri-vs-orbstack
date: 2026-11-21
author: "Hamza Makraz"
category: "Engineering"
authorRole: "Founder, MAKRAZ — software engineer"
ctaTitle: "Need a leaner, well-tuned development environment?"
faq:
  - q: "Is Kiri faster than OrbStack?"
    a: "Not overall. In our test (Kiri 0.2.2 vs OrbStack 2.2.5, DDEV PHP stack on an M4 Pro), the full test suite took about the same time on both (125 s on Kiri, 131 s on OrbStack). Kiri was faster on a Postgres `pgbench` run and on large writes; OrbStack was faster on small files, cache warmup and HTTP latency."
  - q: "Which uses less memory, Kiri or OrbStack?"
    a: "Kiri. In our test (Kiri 0.2.2 vs OrbStack 2.2.5 on an M4 Pro), with nothing running it used 0.33 GB against 1.93 GB for OrbStack, and about 1 GB less under load."
  - q: "Kiri or OrbStack: which is better on a laptop running on battery?"
    a: "OrbStack, in our test (Kiri 0.2.2 vs OrbStack 2.2.5 on an M4 Pro): it used a third of Kiri's CPU with the project idle and had a 24% lower macOS energy-impact score over the test suite (a relative score, not watts). We did not measure battery life directly."
  - q: "Does DDEV work with Kiri?"
    a: "Yes. Out of the box, DDEV falls back to ports 30000/30001 because Kiri's own proxy holds ports 80 and 443. Move the proxy with `launchctl setenv KIRI_HTTP_PORT 8880` and `launchctl setenv KIRI_HTTPS_PORT 8843`, restart Kiri with `launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon` (this stops running containers), then run `ddev poweroff && ddev start`. The setting lasts until you log out or restart; a login item makes it permanent."
services: [devops-cloud]
---

**In short:** In our test of Kiri 0.2.2 against OrbStack 2.2.5 on an M4 Pro running a real DDEV PHP stack, Kiri used about a sixth of OrbStack's RAM with nothing running (about 0.7 GB less with the project running) and handled 2.6× as many Postgres transactions as OrbStack in our run. OrbStack used a third of Kiri's CPU with the project idle and was faster on small files. The full test suite took about the same time on both. On battery, choose OrbStack (based on its lower CPU load; we didn't measure battery life); short on RAM, choose Kiri.

[Kiri](https://github.com/libracoder/kiri) is a new container runtime written in Rust, tested here on macOS. It speaks the Docker API, so it can replace Docker Desktop or OrbStack with little or no change to your tools. We wanted to know whether it holds up for day-to-day PHP development, so we tested it on a real project rather than a hello-world container.

## The setup

- **Machine:** MacBook with an Apple M4 Pro, 12 cores, 24 GB RAM, macOS 27.2.
- **Stack:** DDEV v1.25.5 with Mutagen file sync, running a Symfony API on FrankenPHP, Postgres 18 and LocalStack. Same images on both engines.
- **Versions:** Kiri 0.2.2 and OrbStack 2.2.5.
- **Isolation:** each engine ran alone. OrbStack was quit during the Kiri run, and the Kiri daemon was stopped during the OrbStack run.
- **Measurements:** macOS `top` sampled the engine's host processes every 2 seconds for CPU, memory and "energy impact".

We tested the engine boot, the first project start and a restart; idle CPU and RAM; file IO (1 GiB reads and writes, and copying `vendor/`); Symfony cache warmup and `composer dump-autoload`; Postgres with `pgbench`; HTTP latency through the DDEV router; and the project's full test suite.

## Results

| | OrbStack | Kiri | Better |
|---|---|---|---|
| **Startup** | | | |
| Engine boot until Docker answers | 0.1–5.9 s | ~1 s | Tie |
| First `ddev start` after switching engines | 31.9 s | 44.6 s | OrbStack |
| `ddev stop` + `start` | 21.2 s | 26.2 s | OrbStack |
| **Memory (engine host processes)** | | | |
| Engine alone, nothing running | 1.93 GB | 0.33 GB | **Kiri, ~1/6 of OrbStack's RAM** |
| Project running, idle | 3.2 GB | 2.5 GB | Kiri |
| Peak during the test suite | 4.1 GB | 2.9 GB | Kiri |
| **CPU and energy** | | | |
| Idle, engine alone | 2.5% | 3.6% | Tie |
| Idle, project running | 11.7% | 35.6% | **OrbStack, 1/3 of Kiri's CPU** |
| Test suite, average CPU | 113% | 155% | OrbStack |
| Test suite, energy score (no unit) | 14.7k | 19.4k | OrbStack (−24%) |
| **Speed** | | | |
| Full test suite (~1,400 tests, all passing) | 130.5 s | 124.8 s | Tie |
| `cache:warmup`, empty cache | 2.5 s | 3.1 s | OrbStack |
| `composer dump-autoload -o` | 1.9 s | 2.4 s | OrbStack |
| Copy and delete `vendor/` | 1.2 s | 2.6 s | OrbStack |
| 1 GiB write, container filesystem | 523 MB/s | 782 MB/s | Kiri |
| 1 GiB write, project folder | 697 MB/s | 886 MB/s | Kiri |
| 1 GiB read, container filesystem | 1.9 GB/s | 2.4 GB/s | Tie |
| 1 GiB read, project folder | 3.2 GB/s | 2.7 GB/s | Tie |
| Postgres `pgbench` (scale 20, 8 clients, 30 s) | 2,091 tps, 3.8 ms avg latency | 5,453 tps, 1.5 ms avg latency | **Kiri, 2.6×** |
| HTTP through the router (300 requests), p50 | 12.3 ms | 15.2 ms | OrbStack |
| HTTP through the router (300 requests), p95 | 19.2 ms | 40.4 ms | OrbStack |

## Which one should you choose?

**Test-suite speed is a tie.** The test suite is the closest thing to real daily work, and it took about the same time on both engines, even though OrbStack is faster on small-file tasks. The difference is in what each engine costs to run.

**Kiri wins on memory,** by a wide margin: about 1.6 GB less with nothing running and about 1 GB less under load. In our `pgbench` run it also handled 2.6 times as many Postgres transactions (5,453 vs 2,091 per second), and it was faster on large sequential writes.

**OrbStack wins on CPU and energy.** With the project sitting idle, Kiri uses three times as much CPU as OrbStack, and over the test suite OrbStack's energy score was 24% lower. OrbStack also took about 20% less time on cache warmup and autoload, was about twice as fast on copying `vendor/`, and had lower HTTP latency through the router (p95 of 19 ms vs 40 ms).

Our recommendation: **on a laptop running on battery, choose OrbStack** (based on its lower CPU load; we didn't measure battery life directly). **If you run several stacks at once and RAM is short, choose Kiri.** Kiri is only at version 0.2, but it's worth watching.

## How to run DDEV on Kiri (the port 80/443 conflict)

Kiri runs its own proxy for `<name>.kiri.local` on ports 80 and 443. DDEV checks whether those ports are free before it starts, finds them taken, and falls back to ports 30000/30001, which puts a port in the project URL. The Kiri settings have no option to turn the proxy off.

The fix is to move Kiri's proxy to other ports. We found these variable names in the Kiri app itself, not in its documentation:

```sh
launchctl setenv KIRI_HTTP_PORT 8880
launchctl setenv KIRI_HTTPS_PORT 8843
launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon
ddev poweroff && ddev start
```

The `kickstart -k` line restarts Kiri, which stops any containers running on it. Side effect: Kiri's own `*.kiri.local` URLs now need `:8880` or `:8843`.

Don't put the variables in Kiri's LaunchAgent plist: the app regenerates that file every time it launches. `launchctl setenv` only lasts until you log out or restart, so we add a login item, `~/Library/LaunchAgents/dev.kiri.ports.plist`, that runs the same three `launchctl` commands at every login (and so restarts Kiri at login):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>dev.kiri.ports</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>launchctl setenv KIRI_HTTP_PORT 8880; launchctl setenv KIRI_HTTPS_PORT 8843; launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon</string>
  </array>
  <key>RunAtLoad</key><true/>
</dict>
</plist>
```

To undo it, remove the login item, clear the variables and restart Kiri so its proxy goes back to ports 80/443 (run `ddev poweroff` first if DDEV is using them):

```sh
launchctl bootout gui/$(id -u)/dev.kiri.ports 2>/dev/null; rm -f ~/Library/LaunchAgents/dev.kiri.ports.plist
launchctl unsetenv KIRI_HTTP_PORT; launchctl unsetenv KIRI_HTTPS_PORT
launchctl kickstart -k gui/$(id -u)/dev.kiri.daemon
```

To move a project from OrbStack to Kiri:
1. Run `ddev poweroff` first.
2. Docker volumes don't move with the engine. Copy each one with `kiri import orbstack volume <volume>` (for example `<project>-postgres`) while OrbStack is running **and the project is stopped**: copying a running database can corrupt the copy.
3. Run `docker context use kiri`, then `ddev start`.

Whenever OrbStack launches, it takes the Docker context back: run `docker context use kiri` again, or `docker context use orbstack` to return to OrbStack.

## Limits of this benchmark

Each test ran once (three times for cache warmup and Composer, median shown), so treat differences under about 15% as noise. The 1 GiB read results are probably dominated by the page cache, so we call them even despite gaps above 15%; the write results may be partly cached as well. The `pgbench` test and Kiri's HTTP test failed on the first pass and were re-run in a second pass after a fresh engine boot. Both first starts include Mutagen's initial file sync. The energy figure is macOS's relative "energy impact" score for the engine's processes, not watts. With samples every 2 seconds, short phases only have three to five data points. This is one machine and one project: we expect the trade-off (memory against CPU) to hold, but measure on your own setup.

Choosing and tuning local and cloud environments is part of our [DevOps & Cloud](/en/services/devops-cloud) work. If you run AI coding agents in DDEV, see [ddev-claude, our sandboxed Claude Code add-on](/en/blog/ddev-claude).
