#!/bin/sh

#
# Shows several articles comparing master and a branch
# First argument is the name of a branch
#


WIDTH=1280
TOP=3000
BRANCH=${1:-vulture-css-revamp}

URL="http://factory.qa.vulture.com/2014/08/recommendation-generator-test.html"
node index.js $URL?build=master $URL?build=$BRANCH --beside --width $WIDTH --top $TOP --diff basic.png
open basic.png

URL="http://factory.qa.vulture.com/2014/08/breaking-bad-aaron-paul-bryan-cranston-kiss-and-hug-filled-emmys.html"
node index.js $URL?build=master $URL?build=$BRANCH --beside --width $WIDTH --top $TOP --diff long-with-pictures.png
open long-with-pictures.png

URL="http://factory.qa.vulture.com/2014/08/masters-of-sex-recap-season-2-e7-asterion.html"
node index.js $URL?build=master $URL?build=$BRANCH --beside --width $WIDTH --top $TOP --diff standard.png
open standard.png