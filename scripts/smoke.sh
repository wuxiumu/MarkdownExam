#!/usr/bin/env bash
# Smoke-check MarkdownExam on the PHP built-in server.
# Does not call the external news API.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${SMOKE_HOST:-127.0.0.1}"
PORT="${SMOKE_PORT:-8099}"
BASE="http://${HOST}:${PORT}"
LOG="$(mktemp)"
TMPDIR_SMOKE="$(mktemp -d)"
PID=""

cleanup() {
  if [[ -n "${PID}" ]]; then
    kill "${PID}" >/dev/null 2>&1 || true
    wait "${PID}" 2>/dev/null || true
  fi
  rm -f "${LOG}"
  rm -rf "${TMPDIR_SMOKE}"
}
trap cleanup EXIT

if ! command -v php >/dev/null 2>&1; then
  echo "php is required" >&2
  exit 1
fi

if ! php -m | grep -qi '^mbstring$'; then
  echo "php mbstring extension is required" >&2
  exit 1
fi

php -S "${HOST}:${PORT}" -t "${ROOT}" >"${LOG}" 2>&1 &
PID=$!

ready=0
for _ in $(seq 1 50); do
  if curl -sf "${BASE}/api/health.php" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.1
done

if [[ "${ready}" != 1 ]]; then
  echo "PHP server did not become ready" >&2
  cat "${LOG}" >&2
  exit 1
fi

fetch() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -sS -o "${TMPDIR_SMOKE}/${name}.body" -w '%{http_code}' "${url}")"
  printf '%s' "${code}" > "${TMPDIR_SMOKE}/${name}.code"
}

fetch home "${BASE}/"
fetch redirect "${BASE}/redirect.html"
fetch health "${BASE}/api/health.php"
fetch index "${BASE}/api/index.php"
fetch index_empty "${BASE}/api/index.php?keyword="
fetch detail "${BASE}/api/detail.php?id=frontend"
fetch nested "${BASE}/api/detail.php?id=book-series/10-day-reading/day01-deliberate-practice"
fetch missing "${BASE}/api/detail.php"
fetch traversal "${BASE}/api/detail.php?id=../../etc/passwd"
fetch engines "${BASE}/api/search.php?action=engines"

ADMIN_QUERY="$(php -r '$config = require $argv[1]; echo rawurlencode((string) $config["admin_keyword"]);' "${ROOT}/api/config.php")"
fetch admin "${BASE}/api/index.php?keyword=${ADMIN_QUERY}"

php -r '
$dir = $argv[1];
$fail = function ($message) {
    fwrite(STDERR, "FAIL: {$message}\n");
    exit(1);
};
$read = function ($name) use ($dir) {
    return file_get_contents($dir . "/" . $name);
};
$code = function ($name) use ($read) {
    return trim($read($name . ".code"));
};
$json = function ($name) use ($read, $fail) {
    $data = json_decode($read($name . ".body"), true);
    if (!is_array($data)) {
        $fail($name . " is not json");
    }
    return $data;
};

if ($code("home") !== "200" || strpos($read("home.body"), "51吃瓜") === false || strpos($read("home.body"), "MarkdownExam") === false) {
    $fail("home page");
}
if ($code("redirect") !== "200" || strpos($read("redirect.body"), "51吃瓜") === false) {
    $fail("commercial redirect page");
}

$health = $json("health");
if ($code("health") !== "200" || ($health["code"] ?? null) !== 0) {
    $fail("health");
}

$index = $json("index");
if ($code("index") !== "200" || empty($index["success"]) || !is_array($index["data"]) || count($index["data"]) < 1 || isset($index["redirect"])) {
    $fail("exam list");
}

$empty = $json("index_empty");
if (!empty($empty["redirect"]) || empty($empty["success"]) || count($empty["data"]) < 1) {
    $fail("empty keyword must stay on the exam list");
}

$detail = $json("detail");
if ($code("detail") !== "200" || empty($detail["success"]) || count($detail["data"]["questions"] ?? []) < 1) {
    $fail("frontend exam");
}

$nested = $json("nested");
if ($code("nested") !== "200" || empty($nested["success"]) || count($nested["data"]["questions"] ?? []) < 1) {
    $fail("nested exam");
}

if ($code("missing") !== "400") {
    $fail("missing id status " . $code("missing"));
}
if ($code("traversal") !== "404") {
    $fail("traversal status " . $code("traversal"));
}

$engines = $json("engines");
if ($code("engines") !== "200" || empty($engines["success"]) || count($engines["data"] ?? []) < 1) {
    $fail("search engines");
}

$admin = $json("admin");
if ($code("admin") !== "200" || empty($admin["success"]) || empty($admin["redirect"])) {
    $fail("admin gate");
}

fwrite(STDOUT, "smoke ok\n");
' "${TMPDIR_SMOKE}"
