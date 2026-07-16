#!/bin/sh
# The data volume is the "DASD" -- empty on first run of a fresh
# volume, so seed it from the baked-in demo dataset before the app
# starts. On every later start the volume already has data and this
# is a no-op, same as a mainframe shop only doing an initial IEBGENER
# load once.
set -e

if [ -z "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
  echo "[entrypoint] $DATA_DIR is empty -- seeding from ./seed-data"
  cp -r /app/seed-data/. "$DATA_DIR"/
fi

exec "$@"
