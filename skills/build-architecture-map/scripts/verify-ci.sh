#!/usr/bin/env bash
# Clone (or refresh) every repo a map cites, shallow and default branch only, then check every evidence reference.
#
#   bash verify-ci.sh <map-dir> [work-dir]        work-dir defaults to .archmap-repos (add it to .gitignore)
#
# Clone URLs come from map.json repos[name].clone, else the "web" URL recorded in pins.json plus ".git".
# The script uses whatever git credentials the CI job provides: an SSH key with
#   git config --global url."git@github.com:".insteadOf "https://github.com/"
# or an HTTPS token with
#   git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"
# It never prints credentials. Exit code is verify.js's: 0 OK, 1 references failed, 2 a repo could not be read.
set -euo pipefail
MAP=${1:?usage: verify-ci.sh <map-dir> [work-dir]}
WORK=${2:-.archmap-repos}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$WORK"

node -e '
  const L = require(process.argv[1] + "/lib.js"), m = L.loadMap(process.argv[2]);
  for (const [name, pin] of Object.entries(m.pins.repos)) {
    const conf = L.repoConf(m, name), url = conf.clone || (pin.web ? pin.web + ".git" : "");
    if (!url) { console.error(`no clone URL for ${name}: set "clone" in map.json repos`); process.exit(2); }
    console.log([name, conf.path || name, url].join("\t"));
  }' "$HERE" "$MAP" > "$WORK/.clone-list"

while IFS=$'\t' read -r name rel url; do
  dest="$WORK/$rel"
  if [ -d "$dest/.git" ] || [ -f "$dest/HEAD" ]; then
    git -C "$dest" fetch -q --depth 1 origin
    git -C "$dest" remote set-head origin -a >/dev/null
  else
    mkdir -p "$(dirname "$dest")"
    git clone -q --depth 1 --no-checkout "$url" "$dest"
  fi
  echo "fetched $name"
done < "$WORK/.clone-list"

node "$HERE/verify.js" "$MAP" --repos "$WORK"
