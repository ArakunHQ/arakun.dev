#!/usr/bin/env bash
# Checks that a pull request title or commit message follows Conventional
# Commits, with the types CONTRIBUTING.md lists. CI checks the title of every
# pull request; the lefthook commit-msg hook checks commits for those who opt in.
#
#   tools/conventional-commits.sh title "fix(changelog): show pre-releases after stable ones"
#   tools/conventional-commits.sh message .git/COMMIT_EDITMSG
set -euo pipefail
export LC_ALL=C

TYPES='feat|fix|docs|refactor|perf|test|build|ci|chore|revert'
MAX_LENGTH=100
# type, optional (scope), optional !, then ": " and a description.
HEADER_RE="^($TYPES)(\([a-z0-9][a-z0-9._/-]*\))?!?: (.*)$"

# Prints why the header is wrong, or nothing when it is fine.
problem() {
  local header=$1 description
  # What GitHub's Revert button and 'git revert' write.
  if [[ $header =~ ^Revert\ \"(.*)\"$ ]]; then
    description=${BASH_REMATCH[1]}
    # Lower-cased by tr, not ${x,}: macOS still ships bash 3.2.
    echo "write it as: revert: $(printf %s "${description:0:1}" | tr '[:upper:]' '[:lower:]')${description:1}"
    return
  fi
  if [[ ! $header =~ $HEADER_RE ]]; then
    echo "expected <type>(<scope>): <description>, with type one of ${TYPES//|/, } and a lower-case scope"
    return
  fi
  description=${BASH_REMATCH[3]}
  if [[ -z ${description//[[:space:]]/} ]]; then
    echo "the description is empty"
  elif [[ $description == [[:space:]]* ]]; then
    echo "put exactly one space after the colon"
  elif [[ $description == [[:upper:]]* ]]; then
    echo "start the description with a lower-case letter"
  elif [[ $header == *. ]]; then
    echo "leave out the period at the end"
  elif ((${#header} > MAX_LENGTH)); then
    echo "keep it to $MAX_LENGTH characters at most (it has ${#header})"
  fi
}

# Checks one header; exits 1 with the reason when it fails.
check() {
  local what=$1 header=$2 why
  why=$(problem "$header")
  [[ -z $why ]] && return 0
  cat >&2 <<EOF
✗ $what: $header
  $why

Pull request titles and commit messages follow Conventional Commits, for example
  fix(changelog): show pre-releases after stable ones
  feat(docs)!: move the docs pages under /guide
See "Pull requests" in CONTRIBUTING.md.
EOF
  exit 1
}

case ${1:-} in
  title)
    [[ $# -eq 2 ]] || { echo "usage: $0 title <text>" >&2; exit 2; }
    check "pull request title" "$2"
    ;;

  message)
    [[ $# -eq 2 ]] || { echo "usage: $0 message <file>" >&2; exit 2; }
    # The first line that is not empty or a git comment, as git would keep it.
    header=$(grep -v '^#' "$2" | grep -m1 -v '^[[:space:]]*$' || true)
    # Left for git to write ('git commit --fixup', merges, 'git revert').
    # Only the squashed pull request's title reaches main.
    case $header in
      'fixup! '* | 'squash! '* | 'amend! '* | 'Merge '* | 'Revert "'*) exit 0 ;;
    esac
    check "commit message" "$header"
    ;;

  *)
    sed -n '2,7s/^# \{0,1\}//p' "$0" >&2
    exit 2
    ;;
esac
