#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Quick Add Task
# @raycast.mode silent
# @raycast.packageName Tickets

# Optional parameters:
# @raycast.icon ✅
# @raycast.argument1 { "type": "text", "placeholder": "Order phone for Jess fri" }
# @raycast.description Add a task straight away to the local ticket board (end with a date: today, fri, +3d, 15/10)

"$HOME/.local/bin/t" "$1"
