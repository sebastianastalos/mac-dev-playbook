---
name: conductor
description: Run a team of Claude Code workers on tk tickets, each in its own git worktree and cmux workspace. Use when the user wants to work through tickets in parallel, "conduct", hand tickets to agents, spawn workers, check on workers, or wrap up / clean up finished tickets.
---

# Conductor

You are the lead. You plan, brief, start workers, keep track of them, and wrap up with the user. Workers do the coding; the user approves the plan and every push, PR, merge and clean-up.

Tools:
- `tk` – the ticket board (`tk --help`). Columns: backlog, todo, working, needs-you, review, done. Board: http://127.0.0.1:7717 (`tk open`).
- `~/.claude/skills/conductor/scripts/conductor` – `spawn`, `status`, `cleanup` (below as `conductor`).
- For cmux details (reading a worker's screen, focusing a workspace) load the `cmux` / `cmux-cli` skills; don't guess commands.

## 1. Pick tickets

- Start from `tk ls -s todo --json` (or the tickets the user names). Backlog tickets need the user's go-ahead before they become work.
- `conductor status` shows workers already running. At most 3 run at once (the script enforces it); the user's 5-hour usage limit is shared by all of them, so ask before going past 2 if their status line shows the 5h bar above ~60%.

## 2. Plan and brief

For each candidate ticket:
1. Work out the repo it belongs to (project name ≈ repo folder; ask if unclear) and skim the code enough to scope it.
2. Reject or split tickets that would edit the same files as another ticket in this batch – parallel workers on overlapping files end in merge conflicts.
3. Write the brief into the ticket body with `tk edit <id> -d "<brief>"`, using this shape:

```
## Goal
<one or two sentences: the outcome, not the steps>

## Scope
- Files/areas to change: ...
- Out of scope: ...

## Done when
- <checkable: tests/commands that pass, behaviour that can be shown>

## Context
<links, error text, decisions already made>
```

Then show the user the plan – tickets, repo, base branch, one line per brief – and wait for approval. Do not spawn before they say go.

## 3. Spawn

```
conductor spawn <id> --repo <repo path> [--base <branch>]
```

It creates `~/worktrees/<project>/<id>-<slug>` on branch `tk/<id>-<slug>`, writes the brief plus worker rules to `~/.local/share/tickets/briefs/<id>.md`, opens a cmux workspace running `claude --permission-mode auto` with the brief, links everything to the ticket and moves it to Working. Workers commit but never push, open PRs, merge or delete.

If the output says `"waiting_on_folder_trust": true`, Claude Code is asking whether to trust the new worktree folder. That is the user's call: tell them to answer it in that workspace (or to trust `~/worktrees` once, which covers every future worker).

## 4. Keep track

- `conductor status` – column, cmux lane, commit count per worker. The board and the cmux sidebar show the same.
- Needs you (amber): tell the user which worker is waiting and on what (read its screen via the cmux skills). Don't answer a worker's question yourself unless the user tells you to.
- A worker that finishes moves its ticket to Review.

## 5. Wrap up (per ticket in Review)

1. Review the work: `git -C <worktree> log --oneline <base>..HEAD` and the diff. Run the "Done when" checks yourself. For anything non-trivial, have a separate reviewer subagent read the diff against the brief.
2. Report to the user: what changed, check results, review findings. Send fixes back to the same worker (it's still open in its workspace) rather than editing its worktree yourself.
3. Only on the user's approval: push the branch and open a PR (`gh pr create` from the worktree), then `tk link <id> --pr <url>`. Use the right GitHub identity for the repo: personal repos (owner `sebastianastalos`) need `gh auth switch --user sebastianastalos` before pushing and `gh auth switch --user sebastianHST` straight after; commits must be authored by that repo's configured identity and carry no Co-Authored-By trailer.
4. When the PR is merged the ticket moves to Done by itself (via cmux). Then offer clean-up; on approval run `conductor cleanup <id>` (removes the worktree and local branch, closes the workspace). It refuses if the ticket isn't Done or the worktree has uncommitted changes – surface that rather than adding `--force`.

## Rules

- The user approves: the plan, every push/PR/merge, and every clean-up. Never `--force` without them asking.
- Never edit files inside a worker's worktree while it is running.
- Keep the board true: if you change a ticket's state by hand, use `tk mv`.
