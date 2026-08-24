const crypto = require("crypto");
const path = require("path");
const Database = require("better-sqlite3");
const sqliteVec = require("sqlite-vec");
const { embedTexts, getProvider } = require("./llmService");

const DATABASE_FILE = path.join(__dirname, "../../data/embeddings.db");
const database = new Database(DATABASE_FILE);
sqliteVec.load(database);

database.exec(`
  CREATE TABLE IF NOT EXISTS vector_index_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS document_embeddings (
    rowid INTEGER PRIMARY KEY,
    fingerprint TEXT NOT NULL,
    tab TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    raw TEXT NOT NULL
  );
`);

function vectorBuffer(values) {
  return Buffer.from(new Float32Array(values).buffer);
}

function getMetadata(key) {
  return database.prepare("SELECT value FROM vector_index_metadata WHERE key = ?").get(key)?.value;
}

function setMetadata(key, value) {
  database.prepare("INSERT OR REPLACE INTO vector_index_metadata (key, value) VALUES (?, ?)").run(key, value);
}

function getDocumentsFingerprint(documents) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(documents.map((document) => ({ tab: document.tab, title: document.title, text: document.text, raw: document.raw }))))
    .digest("hex");
}

function recreateVectorTable(dimension) {
  database.exec("DROP TABLE IF EXISTS document_vectors");
  database.exec(`CREATE VIRTUAL TABLE document_vectors USING vec0(embedding float[${dimension}] distance_metric=cosine)`);
}

async function ensureIndex(documents) {
  const provider = getProvider();
  if (!provider || !documents.length) return false;

  const fingerprint = getDocumentsFingerprint(documents);
  const model = provider === "openai"
    ? process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
    : process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  if (getMetadata("fingerprint") === fingerprint && getMetadata("provider") === provider && getMetadata("model") === model) {
    return true;
  }

  const vectors = await embedTexts(documents.map((document) => document.text));
  if (!vectors?.length || vectors.length !== documents.length || !vectors[0]) return false;

  recreateVectorTable(vectors[0].length);
  database.exec("DELETE FROM document_embeddings");
  const insertDocument = database.prepare("INSERT INTO document_embeddings (rowid, fingerprint, tab, title, text, raw) VALUES (?, ?, ?, ?, ?, ?)");
  const insertVector = database.prepare("INSERT INTO document_vectors (rowid, embedding) VALUES (?, ?)");
  const insertAll = database.transaction(() => {
    documents.forEach((document, index) => {
      const rowid = index + 1;
      insertDocument.run(rowid, fingerprint, document.tab, document.title, document.text, JSON.stringify(document.raw || {}));
      insertVector.run(rowid, vectorBuffer(vectors[index]));
    });
  });
  insertAll();

  setMetadata("fingerprint", fingerprint);
  setMetadata("provider", provider);
  setMetadata("model", model);
  setMetadata("dimension", String(vectors[0].length));
  return true;
}

async function search(documents, question, limit = 5) {
  if (!documents.length || !getProvider()) return null;

  try {
    const indexed = await ensureIndex(documents);
    if (!indexed) return null;
    const queryVector = (await embedTexts([question]))?.[0];
    if (!queryVector) return null;

    const matches = database.prepare(`
      SELECT document_embeddings.*, document_vectors.distance
      FROM document_vectors
      JOIN document_embeddings ON document_embeddings.rowid = document_vectors.rowid
      WHERE document_vectors.embedding MATCH ? AND k = ?
      ORDER BY document_vectors.distance
    `).all(vectorBuffer(queryVector), limit);

    return matches.map((match) => ({
      doc: {
        tab: match.tab,
        title: match.title,
        text: match.text,
        raw: JSON.parse(match.raw),
      },
      score: Math.max(0, 1 - match.distance),
    }));
  } catch (error) {
    return null;
  }
}

module.exports = { search };