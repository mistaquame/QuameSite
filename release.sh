#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# release.sh  —  Publish new QuameVoice version
#
# Auto-detects version from QuameVoice/package.json
# and release files from QuameVoice/release/.
#
# Usage:  ./release.sh [voice-release-dir]
#
# Examples:
#   ./release.sh                          # auto-detect
#   ./release.sh ../QuameVoice/release    # explicit path
# ──────────────────────────────────────────────

SITE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Find version: check release dir's parent first, then sibling ../QuameVoice
VOICE_RELEASE="${1:-"$SITE_DIR/../QuameVoice/release"}"

# Locate app dir (where package.json lives)
APP_CANDIDATES=(
  "$(cd "$VOICE_RELEASE/.." 2>/dev/null && pwd)"
  "$SITE_DIR/../QuameVoice"
)

PKG=""
for d in "${APP_CANDIDATES[@]}"; do
  if [ -f "$d/package.json" ]; then
    PKG="$d/package.json"
    APP_DIR="$d"
    break
  fi
done

if [ -z "$PKG" ]; then
  echo "ERROR: Can't find QuameVoice/package.json"
  echo "       Tried: ${APP_CANDIDATES[0]} and ${APP_CANDIDATES[1]}"
  echo "Pass release dir explicitly:  ./release.sh /path/to/QuameVoice/release"
  exit 1
fi

VER=$(grep '"version"' "$PKG" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
VERSION="v${VER}"

# Resolve absolute path for release dir
VOICE_RELEASE="$(cd "$VOICE_RELEASE" 2>/dev/null && pwd)" || {
  echo "ERROR: Release directory not found: $VOICE_RELEASE"
  exit 1
}

echo "Detected QuameVoice version: $VERSION"
echo "App dir:                     $APP_DIR"
echo "Release dir:                 $VOICE_RELEASE"
echo ""

# ── Paths ──
GH_EXE="/c/Program Files/GitHub CLI/gh.exe"
REPO="mistaquame/QuameSite"

EXE="$VOICE_RELEASE/QuameVoice Setup $VER.exe"
YML="$VOICE_RELEASE/latest.yml"
BLOCKMAP="$VOICE_RELEASE/QuameVoice Setup $VER.exe.blockmap"

# gh CLI uploads spaces as dots in filename
EXE_DOTS="QuameVoice.Setup.$VER.exe"
BLOCKMAP_DOTS="QuameVoice.Setup.$VER.exe.blockmap"

# ── Locate token from git credential store ──
TOKEN=$(git credential-store get <<<"protocol=https
host=github.com" 2>/dev/null | grep password | cut -d= -f2 | head -1)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No GitHub token found in git credential store."
  echo "Run:  gh auth login"
  exit 1
fi
export GH_TOKEN="$TOKEN"

# ── Check files exist ──
MISSING=0
for f in "$EXE" "$YML" "$BLOCKMAP"; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    MISSING=1
  fi
done
if [ "$MISSING" -eq 1 ]; then
  echo "ERROR: Some release files not found in $VOICE_RELEASE"
  exit 1
fi

# ── Upload release ──
echo "Uploading $VERSION to $REPO ..."
"$GH_EXE" release create "$VERSION" \
  "$EXE" \
  "$YML" \
  "$BLOCKMAP" \
  --repo "$REPO" \
  --title "$VERSION" \
  --notes "Release $VERSION"

echo "Upload done."
echo ""

# ── Update website files ──
echo "Updating version references in site files ..."

# index.html: hero badge
sed -i "s/v[0-9]\+\.[0-9]\+\.[0-9]\+ — Latest Release/$VERSION — Latest Release/g" "$SITE_DIR/index.html"

# index.html: download card version
sed -i "s|<div class=\"download-card-version\">v[0-9]\+\.[0-9]\+\.[0-9]\+|<div class=\"download-card-version\">$VERSION|g" "$SITE_DIR/index.html"

# index.html: download URL (replace version in the exe URL)
sed -i "s|/download/v[0-9]\+\.[0-9]\+\.[0-9]\+/QuameVoice.Setup.[0-9]\+\.[0-9]\+\.[0-9]\+\.exe|/download/$VERSION/$EXE_DOTS|g" "$SITE_DIR/index.html"

# script.js: download tracking version
sed -i "s|version: '[0-9]\+\.[0-9]\+\.[0-9]\+'|version: '$VER'|g" "$SITE_DIR/script.js"

echo "Updated:"
grep -n "$VER" "$SITE_DIR/index.html" "$SITE_DIR/script.js" 2>/dev/null || true
echo ""

# ── Commit & push ──
cd "$SITE_DIR"
git add -A
git commit -m "release $VERSION"
git push

echo ""
echo "✅ Release $VERSION published!"
echo "   https://github.com/$REPO/releases/tag/$VERSION"
echo "   https://mistaquame.github.io/QuameSite/  (deploys in ~1-2 min)"
