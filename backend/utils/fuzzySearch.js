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

// `categoria` puede venir poblada ({ nombre }) o como texto.
const categoryName = (c) => (c && typeof c === 'object' ? c.nombre : c) || '';

function scoreComponentMatch(component, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return 100;
  const query = rawQuery.trim().toLowerCase();

  // Un código de barras idéntico es una coincidencia perfecta.
  if (component.codigoBarras && component.codigoBarras.toLowerCase() === query) return 100;

  const fields = [
    component.nombre,
    component.sku,
    categoryName(component.categoria),
    component.especificaciones,
    component.encapsulado
  ].map((f) => String(f || '').toLowerCase());

  let bestScore = 0;
  for (const field of fields) {
    if (!field) continue;
    if (field === query) bestScore = Math.max(bestScore, 100);
    else if (field.startsWith(query)) bestScore = Math.max(bestScore, 92);
    else if (field.includes(query)) bestScore = Math.max(bestScore, 85);
    else {
      const tokens = field.split(/[\s\-_/.,]+/);
      for (const token of tokens) {
        if (!token) continue;
        const slice = token.slice(0, Math.max(query.length, Math.min(token.length, query.length + 2)));
        const dist = levenshteinDistance(query, slice);
        const maxAllowedTypos = query.length <= 4 ? 1 : 2;
        if (dist <= maxAllowedTypos) {
          bestScore = Math.max(bestScore, Math.max(0, 75 - dist * 20));
        }
      }
    }
  }
  return bestScore;
}

function fuzzyFilterAndRank(components, query) {
  if (!query || !query.trim()) return components;
  return components
    .map((component) => ({ component, score: scoreComponentMatch(component, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.component);
}

module.exports = { levenshteinDistance, scoreComponentMatch, fuzzyFilterAndRank };
