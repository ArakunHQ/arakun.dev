#!/usr/bin/env bash
# Uploads screenshots for a pull request to the public ArakunHQ/pr-assets
# repository and prints the Markdown that embeds them. GitHub has no API to
# attach an image to a pull request, so this is how agents add them.
#
#   tools/pr-assets.sh "$TMPDIR/before-settings.png" "$TMPDIR/after-settings.png"
#
# Each run gets a new folder, <branch>-<commit>-<UTC time>-<process ID>, so no
# two uploads share one and none replaces images a pull request already shows.
# Folder and file names keep only letters, digits, ".", "_" and "-", so they are
# safe in a URL. Name each file: a glob could publish an old capture.
# PR_ASSETS_URL points it at another repository (the tests use a local one).
set -euo pipefail
export LC_ALL=C

REPO=ArakunHQ/pr-assets
URL=${PR_ASSETS_URL:-https://github.com/$REPO.git}

die() {
  echo "pr-assets: $*" >&2
  exit 1
}

# Letters, digits, ".", "_" and "-" stay; anything else becomes "-". No
# leading "-", so git never reads a name as an option.
safe() {
  printf '%s' "$1" | tr -c 'A-Za-z0-9._' - | sed 's/^-*//'
}

[ $# -gt 0 ] || {
  echo "usage: tools/pr-assets.sh <image>..." >&2
  exit 2
}
for f in "$@"; do
  [ -f "$f" ] || die "no file $f"
done

if [ -z "${PR_ASSETS_URL:-}" ]; then
  push=$(gh api "repos/$REPO" --jq .permissions.push 2>/dev/null || true)
  [ "$push" = true ] ||
    die "no push access to $REPO; drag the images into the pull request instead"
fi

branch=$(safe "$(git branch --show-current)")
folder="${branch:+$branch-}$(git rev-parse --short=12 HEAD)-$(date -u +%Y%m%d%H%M%S)-$$"

dir=$(mktemp -d)
trap 'rm -rf "$dir"' EXIT
git clone -q --depth 1 "$URL" "$dir"
# Fails when the folder exists, before anything is copied over it.
mkdir -- "$dir/$folder"
names=()
for f in "$@"; do
  name=$(safe "$(basename -- "$f")")
  [ -n "$name" ] || die "no usable file name in $f"
  [ ! -e "$dir/$folder/$name" ] || die "two files are both named $name"
  cp -- "$f" "$dir/$folder/$name"
  names+=("$name")
done
git -C "$dir" add -- "$folder"
git -C "$dir" commit -q -m "docs: add $folder screenshots"

# Another upload may land first; take it, wait a moment and try again.
pushed=false
for _ in 1 2 3 4 5; do
  if git -C "$dir" push -q origin HEAD:main 2>/dev/null; then
    pushed=true
    break
  fi
  sleep $((RANDOM % 3))
  git -C "$dir" pull -q --rebase origin main
done
[ "$pushed" = true ] || die "could not push to $REPO"

raw="https://raw.githubusercontent.com/$REPO/main/$folder"
for name in "${names[@]}"; do
  echo "![${name%.*}]($raw/$name)"
done
