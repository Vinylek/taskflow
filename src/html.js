// ──────────────────────────────────────────────
// Échappement HTML : neutralise les caractères interprétables par le navigateur
// (< devient &lt;, etc.) avant d'insérer une donnée dans du HTML généré côté serveur.
// ──────────────────────────────────────────────

const ENTITIES = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&#39;'],
]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES.get(char));
}

module.exports = { escapeHtml };
