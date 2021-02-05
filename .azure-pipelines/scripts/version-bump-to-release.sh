#!/usr/bin/env bash

set -e

BASEDIR=$(dirname "$0")

cd $BASEDIR # get scripts location

BASEDIR=$(pwd)

cd ../.. # move to where package.json is

REPODIR=$(pwd)

git remote add repo https://${GHTOKEN}@github.com/awjh/license-check-and-add # add repo with token so we have push permissions
git fetch repo

git checkout v4-dev

VERSION=$(echo $TAG | grep -Eo '([0-9]+\.){2}[0-9]+')

jq -r ".version=\"$VERSION\"" "$REPODIR/package.json" | cat > tmp.json

mv tmp.json $REPODIR/package.json

echo "HELLO $VERSION"

if [[ -n $(git status -s) ]]; then
    git status
    # git add --all
    # git commit -s -m "Release required version bump $VERSION [skip ci]"
    # git push repo master
fi