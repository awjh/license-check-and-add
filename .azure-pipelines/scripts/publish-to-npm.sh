#!/usr/bin/env bash

set -e

BASEDIR=$(dirname "$0")

cd $BASEDIR # get scripts location

BASEDIR=$(pwd)

cd ../.. # move to where package.json is

echo '[Action] adding token to npmrc'
echo '//registry.npmjs.org/:_authToken=$(NPMTOKEN)' > .npmrc

npm publish

rm .npmrc
