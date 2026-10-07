#!/usr/bin/env python3
# Claude Code status line: limit bars, context, cost, model, git branch, elapsed time
import json, os, subprocess, sys, time
from datetime import datetime

data = json.load(sys.stdin)

def rgb(hex_, s):
    r, g, b = (int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return f"\033[38;2;{r};{g};{b}m{s}\033[0m"

GREEN, AMBER, RED, ORANGE = "#7ec699", "#e5b567", "#ff6b6b", "#d97757"
TEXT, DIM, TRACK = "#d0d0d0", "#8a8a8a", "#3a3a3a"
SEP = rgb(DIM, " · ")

def level(pct):
    return GREEN if pct < 50 else AMBER if pct < 80 else RED

def bar(pct, width=10):
    filled = max(0, min(width, round(pct / 100 * width)))
    return rgb(level(pct), "━" * filled) + rgb(TRACK, "━" * (width - filled))

def epoch(v):
    if isinstance(v, (int, float)):
        return v / 1000 if v > 1e12 else v
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None

def until(v):
    t = epoch(v) if v is not None else None
    if t is None:
        return ""
    mins = max(0, round((t - time.time()) / 60))
    if mins >= 1440:
        return f" ↻{mins // 1440}d{(mins % 1440) // 60}h"
    return f" ↻{mins // 60}h{mins % 60}m" if mins >= 60 else f" ↻{mins}m"

def tokens(n):
    return f"{n / 1e6:g}M" if n >= 1e6 else f"{round(n / 1000)}k" if n >= 1000 else str(n)

top, bottom = [], []

limits = data.get("rate_limits") or {}
for key, label in (("five_hour", "5h"), ("seven_day", "7d")):
    w = limits.get(key)
    if not w:
        continue
    pct = float(w.get("used_percentage", w.get("percent_used", 0)) or 0)
    top.append(f"{rgb(DIM, label)} {bar(pct)} {rgb(level(pct), f'{round(pct)}%')}{rgb(DIM, until(w.get('resets_at')))}")

ctx = data.get("context_window") or {}
size = ctx.get("context_window_size")
pct = ctx.get("used_percentage")
if size:
    used = ctx.get("total_input_tokens")
    if pct is None and used is not None:
        pct = round(used / size * 100)
    body = f"{tokens(used)}/{tokens(size)} " if used is not None else ""
    shown = rgb(level(pct), f"{round(pct)}%") if pct is not None else rgb(DIM, "–")
    top.append(f"{rgb(DIM, 'ctx')} {rgb(TEXT, body)}{shown}")

cost = data.get("cost") or {}
if cost.get("total_cost_usd") is not None:
    top.append(rgb(TEXT, f"${cost['total_cost_usd']:.2f}"))

model = (data.get("model") or {}).get("display_name")
if model:
    bottom.append(rgb(ORANGE, model))

cwd = (data.get("workspace") or {}).get("current_dir") or data.get("cwd") or ""
try:
    branch = subprocess.run(["git", "-C", cwd, "branch", "--show-current"], capture_output=True, text=True, timeout=1).stdout.strip()
except Exception:
    branch = ""
added, removed = cost.get("total_lines_added", 0), cost.get("total_lines_removed", 0)
if branch:
    bottom.append(f"{rgb(TEXT, '⎇ ' + branch)} {rgb(GREEN, f'+{added}')}{rgb(DIM, ',')}{rgb(RED, f'-{removed}')}")
if cwd:
    bottom.append(rgb(DIM, cwd.replace(os.path.expanduser("~"), "~", 1)))

ms = cost.get("total_duration_ms")
if ms:
    mins = int(ms // 60000)
    bottom.append(rgb(DIM, f"⏱ {mins // 60}h{mins % 60}m" if mins >= 60 else f"⏱ {mins}m"))

print(SEP.join(top))
print(SEP.join(bottom))
