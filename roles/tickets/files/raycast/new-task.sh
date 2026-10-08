#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title New Task
# @raycast.mode silent
# @raycast.packageName Tickets

# Optional parameters:
# @raycast.icon 📝
# @raycast.argument1 { "type": "text", "placeholder": "Title (optional)", "optional": true }
# @raycast.description Open the task board with the New task box, for notes, links and screenshots

title=$(/usr/bin/python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "${1:-}")
open "http://127.0.0.1:7717/?new=${title}"
