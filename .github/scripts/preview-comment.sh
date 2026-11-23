#!/usr/bin/env bash
# Writes the preview's comment on a pull request, or rewrites the one that is
# there, so a pull request has one comment however often it is pushed to.
#
#   GH_TOKEN=... GH_REPO=owner/repo preview-comment.sh <pull request> <text>
set -euo pipefail

pr=$1
marker='<!-- preview-deploy -->'
body="$marker"$'\n'"$2"

ours() {
  gh api "repos/$GH_REPO/issues/$pr/comments?per_page=100" --paginate --jq \
    '.[] | select(.user.login == "github-actions[bot]" and (.body | startswith("<!-- preview-deploy -->"))) | .id'
}

ids=$(ours)
if [ -z "$ids" ]; then
  gh api -X POST "repos/$GH_REPO/issues/$pr/comments" --silent -f body="$body"
  # Two runs at once can each find no comment and both post. Comments are
  # listed oldest first, so both keep the oldest and delete the rest.
  ids=$(ours)
  keep=$(head -n 1 <<<"$ids")
  gh api -X PATCH "repos/$GH_REPO/issues/comments/$keep" --silent -f body="$body"
else
  keep=$(head -n 1 <<<"$ids")
  gh api -X PATCH "repos/$GH_REPO/issues/comments/$keep" --silent -f body="$body"
fi
for id in $(tail -n +2 <<<"$ids"); do
  # Another run may have deleted it already.
  gh api -X DELETE "repos/$GH_REPO/issues/comments/$id" --silent || true
done
