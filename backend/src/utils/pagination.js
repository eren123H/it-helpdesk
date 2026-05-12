/** LIST endpoint'lerinde tek seferde dönebilecek kayıt üst sınırı */
const MAX_LIST_LIMIT = 100;

function parseLimit(value, defaultLimit = 20) {
  let n = Number(value);
  if (!Number.isFinite(n) || n < 1) n = defaultLimit;
  return Math.min(Math.floor(n), MAX_LIST_LIMIT);
}

function parsePage(value) {
  let p = Number(value);
  if (!Number.isFinite(p) || p < 1) p = 1;
  return Math.floor(p);
}

module.exports = { MAX_LIST_LIMIT, parseLimit, parsePage };
