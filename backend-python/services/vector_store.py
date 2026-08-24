from __future__ import annotations

import hashlib
import json
import sqlite3
import struct
from pathlib import Path
from typing import List, Optional

import numpy as np

from config import DATA_DIR
from services.llm_service import embed_texts, get_provider

_DB_FILE = DATA_DIR / "embeddings_py.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_FILE))
    conn.execute(
        """CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)"""
    )
    conn.execute(
        """CREATE TABLE IF NOT EXISTS doc_embeddings (
            rowid   INTEGER PRIMARY KEY,
            tab     TEXT NOT NULL,
            title   TEXT NOT NULL,
            text    TEXT NOT NULL,
            raw     TEXT NOT NULL,
            vector  BLOB NOT NULL
        )"""
    )
    conn.commit()
    return conn


def _fingerprint(documents: List[dict]) -> str:
    payload = json.dumps(
        [{"tab": d["tab"], "title": d["title"], "text": d["text"]} for d in documents],
        sort_keys=True,
    ).encode()
    return hashlib.sha256(payload).hexdigest()


def _vec_to_blob(vec: List[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)


def _blob_to_vec(blob: bytes) -> np.ndarray:
    n = len(blob) // 4
    return np.array(struct.unpack(f"{n}f", blob), dtype=np.float32)


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(np.dot(a, b) / (na * nb))


async def _ensure_index(documents: List[dict], conn: sqlite3.Connection) -> bool:
    if not get_provider() or not documents:
        return False

    fp = _fingerprint(documents)
    provider = get_provider()
    row = conn.execute("SELECT value FROM meta WHERE key='fingerprint'").fetchone()
    prow = conn.execute("SELECT value FROM meta WHERE key='provider'").fetchone()
    if row and row[0] == fp and prow and prow[0] == provider:
        return True

    vectors = await embed_texts([d["text"] for d in documents])
    if not vectors or len(vectors) != len(documents):
        return False

    conn.execute("DELETE FROM doc_embeddings")
    for i, (doc, vec) in enumerate(zip(documents, vectors)):
        conn.execute(
            "INSERT INTO doc_embeddings (rowid, tab, title, text, raw, vector) VALUES (?,?,?,?,?,?)",
            (i + 1, doc["tab"], doc["title"], doc["text"], json.dumps(doc.get("raw", {})), _vec_to_blob(vec)),
        )
    conn.execute("INSERT OR REPLACE INTO meta VALUES ('fingerprint',?)", (fp,))
    conn.execute("INSERT OR REPLACE INTO meta VALUES ('provider',?)", (provider,))
    conn.commit()
    return True


async def search(
    documents: List[dict], question: str, limit: int = 5
) -> Optional[List[dict]]:
    if not documents or not get_provider():
        return None

    try:
        conn = _get_conn()
        indexed = await _ensure_index(documents, conn)
        if not indexed:
            return None

        query_vecs = await embed_texts([question])
        if not query_vecs or not query_vecs[0]:
            return None
        q_vec = np.array(query_vecs[0], dtype=np.float32)

        rows = conn.execute(
            "SELECT tab, title, text, raw, vector FROM doc_embeddings"
        ).fetchall()

        scored = []
        for tab, title, text, raw_json, blob in rows:
            d_vec = _blob_to_vec(blob)
            score = _cosine(q_vec, d_vec)
            scored.append(
                (score, {"tab": tab, "title": title, "text": text, "raw": json.loads(raw_json)})
            )

        scored.sort(key=lambda x: x[0], reverse=True)
        return [{"doc": doc, "score": score} for score, doc in scored[:limit]]
    except Exception as exc:
        print(f"[vector_store] search error: {exc}")
        return None
