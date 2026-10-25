# Live exercise: review and fix with AI

**Time:** 45 minutes, live, screen shared.
**AI tools:** required. Use whatever you normally use (Claude, ChatGPT, Copilot, Cursor, Claude Code, anything).

## The situation

This service controls who can see and change shipments for many customer companies on one
platform. Two pull requests are open against `main`. Each says what it does, and its tests pass.
Your job is to decide whether each is safe to merge and, if not, fix it.

## Plan for the session

| When | What |
| --- | --- |
| 0-7 min | Get oriented |
| 7-27 min | Review and fix both PRs, **PR-102 first** |
| 27-38 min | Adapt to a change (we will explain it at the time) |
| 38-45 min | Wrap-up questions |

## Get oriented (about 7 minutes)

1. Read [docs/DOMAIN.md](docs/DOMAIN.md), especially **Requirements**. It is short.
2. Skim [README.md](README.md) for the code layout and the fixture users.
3. Run `npm test` on `main`.

Using AI to get oriented is fine. Tell us what you asked it.

## Review and fix (about 20 minutes)

Do **PR-102 first**, then PR-101.

| Order | PR | Branch | See changes with |
| --- | --- | --- | --- |
| 1 | PR-102 Bulk move users between groups | `pr-102-bulk-move` | `git diff main...pr-102-bulk-move` |
| 2 | PR-101 Notify users on shipment alerts | `pr-101-shipment-alerts` | `git diff main...pr-101-shipment-alerts` |

The authors' descriptions are in [PULL_REQUESTS.md](PULL_REQUESTS.md) (and on the PRs on GitHub).

For each PR, use AI to review it and decide: **approve** or **request changes**. If it needs changes:

1. **Explain the problem** in one or two sentences: which requirement it breaks and what goes wrong for a customer.
2. **Prove it** with a test that fails on the PR branch.
3. **Fix it** on the PR branch. You may rewrite a function's internals, but keep the names and
   signatures of the functions the PR adds.
4. **Show the test passing** and the rest of the suite still green, then commit.

Talk us through it as you go: what you ask the AI, what you accept, what you reject, and why.

## Adapt to a change (about 10 minutes)

Requirements change during real work. Around the 27-minute mark we will tell you about a
change, even if you have not finished both PRs. Finishing PR-102 well matters more than
starting PR-101. Update your code and tests for it, the same way: explain, test, fix, commit.

## Wrap-up (5 minutes)

We will ask:

- Where did the AI help most? What did it get wrong, and how did you notice?
- How would you make this kind of review repeatable for a teammate?
- What part of it would you automate, and what would you always keep for a human?

## Ground rules

- Do not paste this code into tools that train on your data.
- Work in your local clone. Commit your fixes on the PR branches there (`pr-101-shipment-alerts`,
  `pr-102-bulk-move`). Do not change `main`.
- Do not open pull requests, issues or comments on this repository, and do not push to it.

## Handing in

At the end, send us your work in one of these ways:

- **Zip (preferred):** zip your whole local folder, including the hidden `.git` folder, and email it to us.
- **Your own fork:** fork this repository, push your two PR branches to your fork, and send us the
  link. Do not open a pull request against this repository.
