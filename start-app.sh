#!/bin/bash

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

osascript - "$APP_DIR" <<'EOF'
on run argv
    set appDir to item 1 of argv

    tell application "iTerm2"
        activate

        set appWindow to (create window with default profile)
        tell current session of appWindow
            set name to "SIRI Backend"
            write text "cd " & quoted form of appDir & " && npm run dev:api"

            set frontendSession to (split horizontally with same profile)
            tell frontendSession
                set name to "SIRI Frontend"
                write text "cd " & quoted form of appDir & " && npm run dev"
            end tell
        end tell
    end tell
end run
EOF
