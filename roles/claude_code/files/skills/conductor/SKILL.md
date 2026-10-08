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

If `~/.claude/skills/conductor/projects/<project>.md` exists, read it first: it holds that project's base branch, how checks run, and anything every brief must say.

For each candidate ticket:
1. Work out where it happens (project name ≈ folder name; ask if unclear) and pick the mode:
   - **git repo** → `--repo`: own worktree and branch; runs in parallel safely.
   - **plain folder, not git** → `--dir`: works in the folder directly, one worker per folder, and changes can't be undone – say so in the plan. If it's code, suggest `git init` first.
   - **no folder** (research, writing, planning, ops) → no flag: scratch folder whose `RESULT.md` is the deliverable.
   Skim the code or material enough to scope it.
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

For tickets that change what a page looks like, include a browser check in "Done when" when the project notes describe a way to preview a worktree (cmux browser + screenshots), and do the same check yourself at review.

Then show the user the plan – tickets, repo, base branch, one line per brief – and wait for approval. Do not spawn before they say go.

## 3. Spawn

```
conductor spawn <id> --repo <repo path> [--base <branch>]   # git
conductor spawn <id> --dir <folder>                          # plain folder
conductor spawn <id>                                         # scratch
```

Add `--dry-run` to see the mode and paths without creating anything – useful for the plan you show the user.

In git mode it creates `~/worktrees/<project>/<id>-<slug>` on branch `tk/<id>-<slug>`, writes the brief plus worker rules to `~/.local/share/tickets/briefs/<id>.md`, opens a cmux workspace running `claude --permission-mode auto` with the brief, links everything to the ticket and moves it to Working. Workers commit but never push, open PRs, merge or delete.

If the output says `"waiting_on_folder_trust": true`, Claude Code is asking whether to trust the new worktree folder. That is the user's call: tell them to answer it in that workspace (or to trust `~/worktrees` once, which covers every future worker).

## 4. Keep track

Run `conductor wait` in the background (Bash `run_in_background`) whenever workers are running or a ticket is in Review; it returns when a worker needs the user, finishes, or the user decides a review on the board. Handle the event, then start it again.

- `conductor status` – column, cmux lane, commit count per worker. The board and the cmux sidebar show the same.
- Needs you (amber): tell the user which worker is waiting and on what (read its screen via the cmux skills). Don't answer a worker's question yourself unless the user tells you to.
- A worker that finishes moves its ticket to Review.

## 5. Wrap up (per ticket in Review)

Without git (`--dir` / scratch) there's no branch or PR: review the files the worker lists (dir) or its `RESULT.md` (scratch), check "Done when", report to the user, and move the ticket to Done when they accept it. `conductor cleanup` then copies a scratch `RESULT.md` into the ticket under "## Result" and deletes the scratch folder (it refuses if other files are there); for `--dir` it only closes the workspace and never touches the folder.

For git:

1. Review the work: `git -C <worktree> log --oneline <base>..HEAD` and the diff. Run the "Done when" checks yourself. For anything non-trivial, have a separate reviewer subagent read the diff against the brief.
2. Attach the review to the ticket so the user can decide on the board: `tk review <id> -f - <<'EOF' … EOF` (markdown). Sections: `#### What was done` (with check results and size in the heading line), `#### Decisions to confirm`, `#### Doc edits included if you approve` (when any), `#### Not checked`. Keep it to bullets – the board shows the brief's Goal above it. The Approve button only appears once a review is attached. Attach the screenshots you took with `tk shot <id> <png or file:// path> -c "<what it shows>"` – they appear in the board's review panel; a send-back clears them with the review.
   Report to the user: what changed, check results, review findings. Send fixes back to the same worker (it's still open in its workspace) rather than editing its worktree yourself.
   The user decides either in the chat or on the board (Approve / Send back on Review cards). Record a chat decision on the board too: `tk approve <id>` or `tk send-back <id> -m "<what to change>"`.
   - **Sent back** (`decision: changes`): pass the note to the worker as one line – `cmux send --workspace <workspace_id> "<note>"`, then `cmux send-key --workspace <workspace_id> --force enter` (a trailing `\n` does not submit Claude Code's prompt). Read the screen a few seconds later to confirm it started working – then `tk mv <id> working`, which clears the decision for the next round.
   - **Approved** (`decision: approved`): continue with step 3. Approval covers push + PR only; merge and deploy still need the user to say so in the chat.
3. Only on the user's approval: push the branch and open a PR (`gh pr create` from the worktree), then `tk link <id> --pr <url>`. Use the right GitHub identity for the repo: personal repos (owner `sebastianastalos`) need `gh auth switch --user sebastianastalos` before pushing and `gh auth switch --user sebastianHST` straight after; commits must be authored by that repo's configured identity and carry no Co-Authored-By trailer.
4. When the PR is merged the ticket moves to Done by itself (via cmux). Then offer clean-up; on approval run `conductor cleanup <id>` (removes the worktree and local branch, closes the workspace). It refuses if the ticket isn't Done or the worktree has uncommitted changes – surface that rather than adding `--force`.

## Rules

- The user approves: the plan, every push/PR/merge, and every clean-up. Never `--force` without them asking.
- Never edit files inside a worker's worktree while it is running.
- Keep the board true: if you change a ticket's state by hand, use `tk mv`.
