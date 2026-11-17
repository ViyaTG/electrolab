// Misma lógica que el backend (distancia de Levenshtein) para filtrar al instante mientras se escribe.
function levenshteinDistance(a, b) {
  const strA = a.toLowerCase();
  const strB = b.toLowerCase();
  const matrix = Array.from({ length: strA.length + 1 }, () => Array(strB.length + 1).fill(0));
  for (let i = 0; i <= strA.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= strB.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= strA.length; i++) {
    for (let j = 1; j <= strB.length; j++) {
      const cost = strA[i - 1] === strB[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[strA.length][strB.length];
}

const categoryName = (c) => (c && typeof c === 'object' ? c.nombre : c) || '';

function scoreMatch(item, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return 100;
  const query = rawQuery.trim().toLowerCase();
  if (item.codigoBarras && item.codigoBarras.toLowerCase() === query) return 100;

  const fields = [item.nombre, item.sku, categoryName(item.categoria), item.especificaciones, item.encapsulado].map((f) =>
    String(f || '').toLowerCase()
  );
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    if (field === query) best = Math.max(best, 100);
    else if (field.startsWith(query)) best = Math.max(best, 92);
    else if (field.includes(query)) best = Math.max(best, 85);
    else {
      for (const token of field.split(/[\s\-_/.,]+/)) {
        if (!token) continue;
        const slice = token.slice(0, Math.max(query.length, Math.min(token.length, query.length + 2)));
        const dist = levenshteinDistance(query, slice);
        const maxTypos = query.length <= 4 ? 1 : 2;
        if (dist <= maxTypos) best = Math.max(best, Math.max(0, 75 - dist * 20));
      }
    }
  }
  return best;
}

export function clientFuzzySearch(items, query) {
  if (!query || !query.trim()) return items;
  return items
    .map((item) => ({ item, score: scoreMatch(item, query) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((e) => e.item);
}
