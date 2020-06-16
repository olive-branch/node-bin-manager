#!/bin/bash

rm -rf ./dist

npm ci
npm run test:ci
npm run build

cp README.md LICENSE.md package.json ./dist

cd ./dist

npm publish
