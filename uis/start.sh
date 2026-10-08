#!/bin/sh
set -e

echo "Starting website on port 3000..."

#npm --prefix /app/website run dev -- --hostname 0.0.0.0 --port 3000 & profe guia
npm --prefix /app/application run dev -- --hostname 0.0.0.0 --port 3000 &
WEBSITE_PID=$!

echo "Starting backoffice on port 3001..."
npm --prefix /app/backoffice run dev -- --hostname 0.0.0.0 --port 3001 &
BACKOFFICE_PID=$!

trap 'kill $WEBSITE_PID $BACKOFFICE_PID' INT TERM

wait
