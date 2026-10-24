#!/bin/bash
# Avvio delle sessioni cloud di Claude Code: dipendenze e browser per i test.
# Solo in remoto; idempotente; nessun segreto.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

# npm install (non ci) sfrutta la cache del container; "prepare" ricostruisce js/vendor.
npm install --no-audit --no-fund

# Chromium preinstallato nel container: la suite browser lo legge da CHROMIUM_PATH.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  for candidate in /opt/pw-browsers/chromium /usr/bin/chromium; do
    if [ -x "$candidate" ]; then
      echo "export CHROMIUM_PATH=\"$candidate\"" >> "$CLAUDE_ENV_FILE"
      break
    fi
  done
fi
