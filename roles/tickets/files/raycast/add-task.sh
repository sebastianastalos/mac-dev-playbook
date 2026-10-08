#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Add Task
# @raycast.mode silent
# @raycast.packageName Tickets

# Optional parameters:
# @raycast.icon ✅
# @raycast.argument1 { "type": "text", "placeholder": "Order phone for Jess fri" }
# @raycast.description Add a task to the local ticket board (end with a date: today, fri, +3d, 15/10)

"$HOME/.local/bin/t" "$1"
