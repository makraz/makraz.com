---
title: "Claude Code skills: my daily Ponytail + Matt Pocock setup"
description: "How I use Claude Code skills every day: plan with Matt Pocock's skills, build with Ponytail, review with both. Commands, install steps and tips."
lang: en
slug: claude-code-skills
date: 2026-11-21
author: "Hamza Makraz"
category: "Engineering"
authorRole: "Founder, MAKRAZ — software engineer"
ctaTitle: "Want this workflow on your project?"
faq:
  - q: "What is a Claude Code skill?"
    a: "A Claude Code skill is a short Markdown file of instructions that Claude Code loads when it is relevant, or when you type its name as a slash command."
  - q: "Which Claude Code skills should I start with?"
    a: "Two: Matt Pocock's `/mattpocock-skills:grill-with-docs` before each task, so the agent understands what you want, and Ponytail's `/ponytail-review` before each merge."
  - q: "Why type `/mattpocock-skills:code-review` instead of `/code-review` in Claude Code?"
    a: "Claude Code has its own built-in `/code-review` with the same name, and which one the short name runs depends on the app and version. The full name always runs Matt Pocock's skill."
  - q: "Do Ponytail and Matt Pocock's skills work with other coding agents?"
    a: "Yes. Both collections can also be installed in other agents such as Codex; each README explains how."
services: [developpement, audit-ingenierie]
---

**In short:** Claude Code skills are short instruction files that give the agent good habits. I use Matt Pocock's skills to plan (`/mattpocock-skills:wayfinder`, `/mattpocock-skills:grill-with-docs`), Ponytail to keep every change small, and both `/ponytail-review` and `/mattpocock-skills:code-review` before every merge.

An AI coding agent out of the box is fast but has no habits. It starts coding before it understands what you want, writes more than the task needs, and reviews its own work generously. **Skills** fix that. A skill is a short Markdown file of instructions that the agent loads when it's relevant, or when you type its name as a slash command. It's the difference between hiring someone talented and hiring someone with a method.

I use two collections every day, on every project, alongside Claude Code:

- **[Ponytail](https://github.com/dietrichgebert/ponytail)** by Dietrich Gebert: makes the agent think like "the lazy senior dev". Write only what the task needs, reuse what already exists, and never cut validation, error handling, security or accessibility.
- **[Matt Pocock's skills](https://github.com/mattpocock/skills)**: small, composable skills for "real engineering - not vibe coding". They align you and the agent before any code is written, and keep you in control of the process.

After a few months, my history shows a clear pattern. It fits in three steps.

A note on names before we start: both collections install as Claude Code plugins, and some short command names clash with commands built into Claude Code. When that happens, type the full name with the plugin prefix, for example `/mattpocock-skills:code-review`. Below, I write all of Matt Pocock's commands with their full name, so they keep working if Claude Code adds a command with the same short name.

## 1. Plan: understand before writing code

Most bad AI output comes from misunderstanding, not from bad code. So nothing starts with code.

- **`/mattpocock-skills:wayfinder`** for anything too big for one session. It turns a vague idea into a map of *decisions* on your issue tracker (set up once with `/mattpocock-skills:setup-matt-pocock-skills`, see below), then resolves them one at a time. It produces decisions, not code: when the way is clear, the plan is done.
- **`/mattpocock-skills:grill-with-docs`** before every task. The agent interviews me in rounds of numbered questions, each with its recommended answer, until we agree on what we're building. This is the step that saves the most time: ten minutes of questions instead of an afternoon of rework. The "docs" part is domain modeling: while we talk, the agent keeps a `GLOSSARY.md` of the project's vocabulary and proposes a short decision record (ADR) for decisions that are hard to reverse, surprising, and the result of a real trade-off. The next session, and the next agent, start with the same words and the same decisions. (`/mattpocock-skills:grill-me` does the questioning without the docs, for anything that isn't code.)
- **`/mattpocock-skills:research`** when a question depends on facts: an API, a library, a spec. A background agent reads the primary sources (official docs, source code) and writes a Markdown note with citations, while I keep working.

## 2. Build: the smallest change that fully works

Ponytail is always on: a hook (a script Claude Code runs automatically) loads it at the start of every session, so I never have to remember it. Before writing code, the agent works through a checklist like this one (simplified):

1. Does this need to exist at all?
2. Is it already in the codebase?
3. Is it in the standard library or the platform?
4. Is it in a dependency we already have?
5. Can it be one line that a reader understands at a glance?
6. Only then: write the minimum that works.

The README's example says it well: asked for a date picker, an agent without the skill wrote 335 lines; with Ponytail it reused the project's existing input with the browser's native date picker and wrote 10. Less code means less to review, less to maintain and fewer places for bugs to hide.

What makes it trustworthy is the list of things Ponytail **never cuts**: validation at trust boundaries, error handling that prevents data loss, security and accessibility. On top of that, any new non-trivial logic (a branch, a loop, a parser, money or security) has to ship with a small test. Lazy about the solution, never lazy about the job.

When there's a bug, **`/mattpocock-skills:diagnosing-bugs`** replaces guessing with a method: first build a quick check that fails on this exact bug, then narrow it down, test hypotheses, fix the root cause and add a regression test. For a design question, **`/mattpocock-skills:prototype`** builds a throwaway version to answer it before we commit.

## 3. Review: two reviewers, two angles

These are the two commands I run most. Every change goes through both before it is merged:

- **`/ponytail-review`** reviews like the senior dev who gets paged when it breaks. It reads the code the change touches, not just the diff, and looks for bugs, security holes, behaviour under real load, risky code without tests, and code that could be deleted. Each finding explains what goes wrong, how to fix it, and what happens if you skip it.
- **`/mattpocock-skills:code-review`** checks two other things side by side: does the code follow the project's own standards, and does it actually do what the ticket asked? Plain `/code-review` may run Claude Code's own built-in review instead, depending on the app and version; the full name always runs Matt Pocock's skill.

They catch different problems, so I keep both. Then **`/mattpocock-skills:pr`** writes the pull request description, with before/after evidence and the risk of merging. Now and then, **`/ponytail-audit`** runs the same checks on the whole repository and ranks what to fix first.

## How to install Ponytail and Matt Pocock's skills in Claude Code

Inside Claude Code, run these two prompts one at a time:

```
/plugin marketplace add DietrichGebert/ponytail
```

```
/plugin install ponytail@ponytail
```

In your terminal:

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

Then, back inside Claude Code, run `/mattpocock-skills:setup-matt-pocock-skills` once per repository: it asks which issue tracker you use, which labels you use for triage, and, in a monorepo, where to save docs.

My advice: don't install twenty skills on day one. Start with **`/mattpocock-skills:grill-with-docs`** before each task and **`/ponytail-review`** before each merge. Those two alone change the quality of what the agent hands you. Add the rest as you feel the need. Both collections are open source and readable in a few minutes, so read them, adapt them and make them your own.

We use this workflow in our [development](/en/services/development) and [engineering audit](/en/services/engineering-audit) work. The agent itself runs in a sandbox: see [ddev-claude](/en/blog/ddev-claude).
