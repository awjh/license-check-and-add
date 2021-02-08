#!/usr/bin/env bash

set -e

BASEDIR=$(dirname "$0")

cd $BASEDIR # get scripts location

BASEDIR=$(pwd)

cd ../.. # move to where package.json is

git checkout master

VERSION=$(npm --no-git-tag-version version patch)

git add --all
git -c user.name=${GHUSER} -c user.email=${GHEMAIL} commit -s -m "Version bump $VERSION [skip ci]"
git push repo master