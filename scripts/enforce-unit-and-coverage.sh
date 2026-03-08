#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

echo "Running unit test gate..."
npm test

echo
echo "Running coverage gate..."
npm run test:coverage

echo
echo "Unit tests and coverage gates passed."
