#!/usr/bin/env bash

set -e

BASEDIR=$(dirname "$0")

cd $BASEDIR # get scripts location

BASEDIR=$(pwd)

cd ../.. # move to where package.json is

mv .npmrc.tmpl .npmrc

npm publish

mv .npmrc .npmrc.tmpl