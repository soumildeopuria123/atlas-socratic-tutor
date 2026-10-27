"""
Hybrid retrieval for Atlas course material.

Two layers:

1. `HybridIndex` — dependency-free in-process index. Dense vectors are hashed
   bag-of-words projections (deterministic, no model download), sparse scores
   are BM25, and a lexical reranker approximates a cross-encoder. This keeps the
   service runnable offline and makes tests deterministic.
2. `QdrantHybridStore` — optional. Activated by QDRANT_URL with qdrant-client
   >= 1.12; stores named dense + sparse vectors, filters strictly on the
   `course_slug` payload namespace, and fuses results with RRF.

Callers should use `get_store()`; it prefers Qdrant when configured and healthy
and otherwise returns the local index, so a Qdrant outage degrades quality, not
availability.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

DENSE_DIM = 512
STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "for", "on",
    "with", "as", "by", "that", "this", "it", "be", "from", "at", "we", "you",
    "can", "if", "not", "but", "so", "what", "which", "when", "how", "why",
}


GREEK = {"π": "pi", "θ": "theta", "α": "alpha", "λ": "lambda", "Σ": "sigma", "√": "sqrt", "∞": "infinity"}


def tokenize(text: str) -> list[str]:
    for symbol, word in GREEK.items():
        text = text.replace(symbol, f" {word} ")
    words = re.findall(r"[a-z0-9]+", text.lower())
    tokens = []
    for word in words:
        if word in STOPWORDS or len(word) < 2:
            continue
        if len(word) > 4 and word.endswith("ies"):
            word = word[:-3] + "y"
        elif len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
            word = word[:-1]
        tokens.append(word)
    return tokens


def hashed_vector(tokens: Iterable[str]) -> dict[int, float]:
    vector: Counter[int] = Counter()
    for token in tokens:
        digest = hashlib.blake2b(token.encode(), digest_size=8).digest()
        index = int.from_bytes(digest, "big") % DENSE_DIM
        vector[index] += 1.0
    norm = math.sqrt(sum(value * value for value in vector.values())) or 1.0
    return {index: value / norm for index, value in vector.items()}


def cosine(a: dict[int, float], b: dict[int, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(value * b.get(index, 0.0) for index, value in a.items())


class HybridIndex:
    """Small in-memory index with BM25 + hashed dense vectors + lexical rerank."""

    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.chunks: list[dict[str, Any]] = []
        self._tokens: list[list[str]] = []
        self._vectors: list[dict[int, float]] = []
        self._df: Counter[str] = Counter()
        self._avg_len = 0.0

    def add(self, chunks: Iterable[dict[str, Any]]) -> int:
        added = 0
        for chunk in chunks:
            text = chunk.get("text", "")
            if not text.strip():
                continue
            tokens = tokenize(text)
            if not tokens:
                continue
            self.chunks.append(chunk)
            self._tokens.append(tokens)
            self._vectors.append(hashed_vector(tokens))
            for term in set(tokens):
                self._df[term] += 1
            added += 1
        total = sum(len(tokens) for tokens in self._tokens)
        self._avg_len = total / len(self._tokens) if self._tokens else 0.0
        return added

    def _bm25(self, query: list[str], doc_index: int) -> float:
        tokens = self._tokens[doc_index]
        counts = Counter(tokens)
        length = len(tokens) or 1
        n = len(self._tokens)
        score = 0.0
        for term in query:
            df = self._df.get(term, 0)
            if not df:
                continue
            idf = math.log(1 + (n - df + 0.5) / (df + 0.5))
            tf = counts.get(term, 0)
            denominator = tf + self.k1 * (1 - self.b + self.b * length / (self._avg_len or 1))
            score += idf * (tf * (self.k1 + 1)) / (denominator or 1)
        return score

    def search(self, query: str, course_slug: str | None = None, limit: int = 6) -> list[dict[str, Any]]:
        query_tokens = tokenize(query)
        if not query_tokens or not self.chunks:
            return []
        query_vector = hashed_vector(query_tokens)
        scored: list[tuple[float, int]] = []

        for index, chunk in enumerate(self.chunks):
            if course_slug and chunk.get("course_slug") != course_slug:
                continue
            sparse = self._bm25(query_tokens, index)
            dense = cosine(query_vector, self._vectors[index])
            scored.append((0.65 * sparse + 0.35 * dense * 6, index))

        if not scored:
            return []
        scored.sort(reverse=True)

        # Rerank the top candidates with exact-phrase and coverage signals, which
        # is the cheap stand-in for a cross-encoder in this dependency-light path.
        reranked = []
        normalized_query = query.lower().strip()
        for base, index in scored[: max(limit * 4, 12)]:
            text = self.chunks[index]["text"]
            lowered = text.lower()
            phrase_bonus = 1.5 if normalized_query and normalized_query in lowered else 0.0
            coverage = len(set(query_tokens) & set(self._tokens[index])) / len(set(query_tokens))
            reranked.append((base + phrase_bonus + 2.0 * coverage, index))

        reranked.sort(reverse=True)
        results = []
        for score, index in reranked[:limit]:
            chunk = self.chunks[index]
            results.append(
                {
                    "score": round(score, 4),
                    "text": chunk["text"],
                    "metadata": chunk.get("metadata", {}),
                    "course_slug": chunk.get("course_slug"),
                }
            )
        return results

    def stats(self) -> dict[str, Any]:
        return {"backend": "in-memory", "chunks": len(self.chunks), "vocabulary": len(self._df)}


def _sparse_pairs(tokens: Iterable[str]) -> list[tuple[int, float]]:
    """Deterministic sparse (index, weight) pairs, aligned and sorted by index."""
    counters = Counter(tokens)
    pairs = sorted(
        (
            int.from_bytes(hashlib.blake2b(term.encode(), digest_size=4).digest(), "big") % (2**31),
            float(count),
        )
        for term, count in counters.items()
    )
    return pairs


class QdrantHybridStore:
    """Named-vector hybrid store. Requires qdrant-client and a reachable Qdrant."""

    def __init__(self, url: str, collection: str = "atlas_curriculum") -> None:
        from qdrant_client import QdrantClient  # imported lazily: optional dependency

        self.client = QdrantClient(url=url)
        self.collection = collection
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        from qdrant_client import models

        existing = {collection.name for collection in self.client.get_collections().collections}
        if self.collection in existing:
            return
        self.client.create_collection(
            collection_name=self.collection,
            vectors_config={
                "dense": models.VectorParams(size=DENSE_DIM, distance=models.Distance.COSINE),
            },
            sparse_vectors_config={
                "sparse": models.SparseVectorParams(index=models.SparseIndexParams(on_disk=False)),
            },
        )
        for field in ("course_slug", "layer"):
            self.client.create_payload_index(
                collection_name=self.collection,
                field_name=field,
                field_schema=models.PayloadSchemaType.KEYWORD,
            )

    def add(self, chunks: Iterable[dict[str, Any]]) -> int:
        from qdrant_client import models

        points = []
        for chunk in chunks:
            tokens = tokenize(chunk.get("text", ""))
            if not tokens:
                continue
            dense = hashed_vector(tokens)
            pairs = _sparse_pairs(tokens)
            indices = [pair[0] for pair in pairs]
            values = [pair[1] for pair in pairs]
            point_id = int.from_bytes(
                hashlib.blake2b((chunk.get("id") or chunk["text"]).encode(), digest_size=8).digest(),
                "big",
            ) % (2**63)
            points.append(
                models.PointStruct(
                    id=point_id,
                    vector={
                        "dense": [dense.get(i, 0.0) for i in range(DENSE_DIM)],
                        "sparse": models.SparseVector(indices=indices, values=values),
                    },
                    payload={
                        "text": chunk["text"],
                        "course_slug": chunk.get("course_slug"),
                        "layer": chunk.get("metadata", {}).get("layer"),
                        "metadata": chunk.get("metadata", {}),
                    },
                )
            )
        if points:
            self.client.upsert(collection_name=self.collection, points=points, wait=True)
        return len(points)

    def search(self, query: str, course_slug: str | None = None, limit: int = 6) -> list[dict[str, Any]]:
        from qdrant_client import models

        tokens = tokenize(query)
        dense = hashed_vector(tokens)
        pairs = _sparse_pairs(tokens)
        indices = [pair[0] for pair in pairs]
        values = [pair[1] for pair in pairs]

        query_filter = None
        if course_slug:
            query_filter = models.Filter(
                must=[models.FieldCondition(key="course_slug", match=models.MatchValue(value=course_slug))]
            )

        response = self.client.query_points(
            collection_name=self.collection,
            prefetch=[
                models.Prefetch(
                    query=models.SparseVector(indices=indices, values=values),
                    using="sparse",
                    limit=limit * 3,
                ),
                models.Prefetch(
                    query=[dense.get(i, 0.0) for i in range(DENSE_DIM)],
                    using="dense",
                    limit=limit * 3,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )

        return [
            {
                "score": round(point.score, 4),
                "text": point.payload.get("text", ""),
                "metadata": point.payload.get("metadata", {}),
                "course_slug": point.payload.get("course_slug"),
            }
            for point in response.points
        ]

    def stats(self) -> dict[str, Any]:
        info = self.client.get_collection(self.collection)
        return {"backend": "qdrant", "chunks": info.points_count}


def curriculum_chunks() -> list[dict[str, Any]]:
    """One retrievable document per layer, built from the exported curriculum."""
    path = Path(__file__).resolve().parent / "data" / "curriculum.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    chunks: list[dict[str, Any]] = []
    for course in data["courses"]:
        for layer in course["layers"]:
            concepts = " ".join(f"{c['term']}: {c['definition']}" for c in layer["concepts"])
            text = (
                f"{course['title']} — Layer {layer['layer']}: {layer['title']}. "
                f"{layer['intuition']} {concepts} Worked example: {layer['worked']['problem']} "
                f"Answer: {layer['worked']['answer']}"
            )
            chunks.append(
                {
                    "id": f"{course['slug']}:{layer['layer']}",
                    "text": text,
                    "course_slug": course["slug"],
                    "metadata": {
                        "course": course["title"],
                        "layer": layer["layer"],
                        "title": layer["title"],
                        "tier": layer["tier"],
                    },
                }
            )
    return chunks


_store: Any = None


def get_store() -> Any:
    """Qdrant when configured and reachable, else the local deterministic index."""
    global _store
    if _store is not None:
        return _store

    url = os.environ.get("QDRANT_URL")
    if url:
        try:
            store = QdrantHybridStore(url, os.environ.get("QDRANT_COLLECTION", "atlas_curriculum"))
            store.add(curriculum_chunks())
            _store = store
            return _store
        except Exception as error:  # noqa: BLE001 - degrade, never fail the request
            print(f"[atlas-ai] Qdrant unavailable ({error}); using local hybrid index", flush=True)

    local = HybridIndex()
    local.add(curriculum_chunks())
    _store = local
    return _store


if __name__ == "__main__":
    store = get_store()
    print(json.dumps(store.stats(), indent=2))
    for hit in store.search("why does sine repeat every 2π", limit=3):
        print(f"\n[{hit['score']}] {hit['metadata'].get('course')} L{hit['metadata'].get('layer')}: {hit['text'][:160]}…")
