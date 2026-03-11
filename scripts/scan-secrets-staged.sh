#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

staged_files="$(git diff --cached --name-only --diff-filter=ACMR)"
if [[ -z "$staged_files" ]]; then
  exit 0
fi

patch="$(git diff --cached --no-color --unified=0 --diff-filter=ACMR)"
blocked=0

echo "Running staged secret scan..."

search_added_lines() {
  local regex="$1"

  if command -v rg >/dev/null 2>&1; then
    printf '%s\n' "$patch" | rg -n --pcre2 "^\+[^+].*(${regex})" || true
    return
  fi

  printf '%s\n' "$patch" | grep -En "^\+[^+].*(${regex})" || true
}

# Block committing real env files directly (.env, .env.local, env, etc.).
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  name="$(basename "$file")"
  if [[ "$name" =~ ^\.env($|\.) || "$name" == "env" ]]; then
    case "$name" in
      *.example|*.sample|*.template)
        ;;
      *)
        echo
        echo "Potential secret risk: env file staged -> $file"
        blocked=1
        ;;
    esac
  fi
done <<< "$staged_files"

# High-confidence secret patterns in added lines only.
names=(
  "AWS Access Key ID"
  "AWS STS Access Key ID"
  "Google API Key"
  "GitHub PAT (classic)"
  "GitHub PAT (fine-grained)"
  "Slack Token"
  "Stripe Live Secret Key"
  "OpenAI/Anthropic-Style Secret Key"
  "npm Token"
  "Private Key Block"
  "JWT Bearer Token"
)

regexes=(
  "AKIA[0-9A-Z]{16}"
  "ASIA[0-9A-Z]{16}"
  "AIza[0-9A-Za-z\\-_]{35}"
  "ghp_[0-9A-Za-z]{36}"
  "github_pat_[0-9A-Za-z_]{22,}"
  "xox[baprs]-[0-9A-Za-z-]{10,}"
  "sk_live_[0-9A-Za-z]{16,}"
  "sk-(proj|live|test|ant)-[0-9A-Za-z_-]{16,}"
  "npm_[A-Za-z0-9]{36}"
  "-----BEGIN (RSA|EC|OPENSSH|DSA|PGP|PRIVATE) KEY-----"
  "Bearer[[:space:]]+[A-Za-z0-9_-]{16,}\\.[A-Za-z0-9_-]{16,}\\.[A-Za-z0-9_-]{16,}"
)

for i in "${!regexes[@]}"; do
  name="${names[$i]}"
  regex="${regexes[$i]}"
  matches="$(search_added_lines "$regex")"
  if [[ -n "$matches" ]]; then
    echo
    echo "Potential secret detected ($name):"
    printf '%s\n' "$matches"
    blocked=1
  fi
done

if [[ "$blocked" -ne 0 ]]; then
  echo
  echo "Commit blocked: possible secret(s) found in staged changes."
  echo "If this is a false positive, remove or rotate the value before commit."
  exit 1
fi

echo "Secret scan passed."
