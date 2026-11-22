#!/usr/bin/env bash
# Writes the preview's comment on a pull request, or rewrites the one that is
# there, so a pull request has one comment however often it is pushed to.
#
#   GH_TOKEN=... GH_REPO=owner/repo preview-comment.sh <pull request> <text>
set -euo pipefail

pr=$1
marker='<!-- preview-deploy -->'
body="$marker"$'\n'"$2"

id=$(gh api "repos/$GH_REPO/issues/$pr/comments?per_page=100" --paginate --jq \
  '.[] | select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- preview-deploy -->"))) | .id' |
  head -n 1)

if [ -n "$id" ]; then
  gh api -X PATCH "repos/$GH_REPO/issues/comments/$id" --silent -f body="$body"
else
  gh api -X POST "repos/$GH_REPO/issues/$pr/comments" --silent -f body="$body"
fi
