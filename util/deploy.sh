#!/usr/bin/env sh

# This script is intended to be run by Travis for automated deployment to
# GitHub static via the gh-pages branch. We assume that we're in the top-level
# repo directory, we've built to dist/, and the Travis encryption key
# environment variables are set.

set -e
set -x

# SHA of the commit we're deploying.
SHA="$(git rev-parse HEAD)"

# The SSH key we'll use to push with is encrypted by Travis. Decrypt it and
# make it available to Git via ssh-agent.
KEY="util/deploy.key"
openssl aes-256-cbc -K $encrypted_10b955ca498f_key -iv $encrypted_10b955ca498f_iv -in "$KEY.enc" -out "$KEY" -d
chmod 600 "$KEY"
eval $(ssh-agent -s) # eval because ssh-agent prints setenv commands.
ssh-add "$KEY"

# Clone the repo.
REPO="git@github.com:aomarks/bridgesim.git"
git clone "$REPO" deploy --branch gh-pages \
  --single-branch --depth 1  # Optimizations.

# Clobber everything with output of build.
cd deploy
rm -rf *
cp -R ../dist/* .

# Commit and push.
git config user.name "Deploy Robot"
git config user.email "aomarks+robot@gmail.com"
git add --all
git commit --message "Deploy $SHA" && git push || true
