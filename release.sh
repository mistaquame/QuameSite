#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# release.sh  —  Publish new QuameVoice version
# Usage:  ./release.sh <version> [voice-dir]
#
# Examples:
#   ./release.sh v1.0.3
#   ./release.sh v1.0.3 /path/to/QuameVoice/release
#
# Default voice-dir: ../QuameVoice/release
# ──────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo "Usage: $0 <version> [voice-release-dir]"
  echo "  version       e.g. v1.0.3"
  echo "  voice-releasedir  path to folder with EXE + latest.yml (default: ../QuameVoice/release)"
  exit 1
fi

VERSION="$1"
VOICE_RELEASE="${2:-"$(cd "$(dirname "$0")/../QuameVoice/release" && pwd)"}"
SITE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Strip leading v for filename patterns
VER="${VERSION#v}"

GH_EXE="/c/Program Files/GitHub CLI/gh.exe"
REPO="mistaquame/QuameSite"

# ── Locate token from git credential store ──
TOKEN=$(git credential-store get <<<"protocol=https
host=github.com" 2>/dev/null | grep password | cut -d= -f2 | head -1)

if [ -z "$TOKEN" ]; then
  echo "ERROR: No GitHub token found in git credential store."
  echo "Run:  gh auth login"
  exit 1
fi

export GH_TOKEN="$TOKEN"

# ── Files to upload ──
EXE="$VOICE_RELEASE/QuameVoice Setup $VER.exe"
YML="$VOICE_RELEASE/latest.yml"
BLOCKMAP="$VOICE_RELEASE/QuameVoice Setup $VER.exe.blockmap"

# Use dots variant (gh CLI uploads spaces as dots)
EXE_DOTS="QuameVoice.Setup.$VER.exe"
BLOCKMAP_DOTS="QuameVoice.Setup.$VER.exe.blockmap"

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

# ── Commit & push ──
cd "$SITE_DIR"
git add -A
git commit -m "release $VERSION"
git push

echo ""
echo "✅ Release $VERSION published!"
echo "   https://github.com/$REPO/releases/tag/$VERSION"
echo "   https://mistaquame.github.io/QuameSite/  (deploys in ~1-2 min)"
