#!/usr/bin/env bash

set -e

BASEDIR=$(dirname "$0")

cd $BASEDIR # get scripts location

BASEDIR=$(pwd)

cd ../.. # move to where package.json is

git remote add repo https://${GHTOKEN}@github.com/awjh/license-check-and-add
git fetch repo

git checkout master

VERSION=$(echo $TAG | grep -Eo '([0-9]+\.){2}[0-9]+')

jq -r ".version=\"$VERSION\"" "$DIR/package.json" | cat > tmp.json

mv tmp.json $DIR/package.json

if [[ -n $(git status -s) ]]; then
    echo "PUSH TO GITHUB $VERSION"
    # git add --all
    # git commit -s -m "Release required version bump $VERSION [skip ci]"
    # git push repo master
fi