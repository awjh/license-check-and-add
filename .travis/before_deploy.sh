#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

cd $DIR

git remote add repo https://${GH_TOKEN}@github.com/awjh/node-red-contrib-alexa-endpoint
git fetch repo

git checkout master

VERSION=$(echo $TRAVIS_TAG | grep -Eo '([0-9]+\.){2}[0-9]+')

jq -r ".version=\"$VERSION\"" "$DIR/package.json" | cat > tmp.json

mv tmp.json $DIR/package.json

if [[ -n $(git status -s) ]]; then
    git add --all
    git commit -s -m "Release required version bump $VERSION [skip travis]"
    git push repo master
fi
