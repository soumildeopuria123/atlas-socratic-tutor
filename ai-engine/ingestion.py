"""
Document ingestion for Atlas.

Pipeline: extract text -> split on heading hierarchy -> pack sentences into
semantic chunks that respect sentence boundaries -> attach breadcrumb metadata
(course, section path, layer guess) -> hand to the hybrid store.

Why hierarchical chunking matters here: a retrieval hit that says "the identity
follows from x² + y² = 1" is useless without knowing which chapter and layer it
came from. Each chunk therefore carries its heading trail, and chunk boundaries
never cut a sentence in half.

CLI:
    python ingestion.py path/to/notes.md --course trigonometry
    python ingestion.py path/to/textbook.pdf --course calculus --limit 20

PDF support needs pypdf (listed in requirements.txt); plain text and Markdown
need nothing beyond the standard library.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

from vector_store import get_store, tokenize

MAX_CHARS = 1200
OVERLAP_CHARS = 180


@dataclass
class Section:
    path: list[str] = field(default_factory=list)
    lines: list[str] = field(default_factory=list)


def read_document(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".md", ".markdown", ".txt", ""}:
        return path.read_text(encoding="utf-8", errors="replace")
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader  # optional dependency
        except ImportError as error:  # pragma: no cover - optional path
            raise RuntimeError("PDF ingestion needs pypdf: pip install pypdf") from error
        reader = PdfReader(str(path))
        return "\n\n".join((page.extract_text() or "") for page in reader.pages)
    raise ValueError(f"Unsupported file type: {suffix}. Use .md, .txt, or .pdf.")


HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9(\[])")


def split_sections(text: str) -> list[Section]:
    sections: list[Section] = []
    current = Section(path=[])
    for line in text.splitlines():
        heading = HEADING_RE.match(line.strip())
        if heading:
            if current.lines:
                sections.append(current)
            depth = len(heading.group(1))
            current = Section(path=current.path[: depth - 1] + [heading.group(2).strip()])
        else:
            current.lines.append(line)
    if current.lines:
        sections.append(current)
    return sections or [Section(path=[], lines=text.splitlines())]


def pack_chunks(sentences: list[str], max_chars: int = MAX_CHARS,
                overlap: int = OVERLAP_CHARS) -> list[str]:
    chunks: list[str] = []
    buffer: list[str] = []
    size = 0

    for sentence in sentences:
        if size + len(sentence) + 1 > max_chars and buffer:
            chunks.append(" ".join(buffer).strip())
            # Carry the tail of the previous chunk so cross-boundary context survives.
            carry: list[str] = []
            carried = 0
            for previous in reversed(buffer):
                if carried + len(previous) > overlap:
                    break
                carry.insert(0, previous)
                carried += len(previous) + 1
            buffer = carry
            size = carried
        buffer.append(sentence)
        size += len(sentence) + 1

    if buffer:
        chunks.append(" ".join(buffer).strip())
    return [chunk for chunk in chunks if chunk]


def semantic_chunks(text: str) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    for section in split_sections(text):
        body = "\n".join(section.lines).strip()
        if not body:
            continue
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
        sentences: list[str] = []
        for paragraph in paragraphs:
            sentences.extend(s.strip() for s in SENTENCE_RE.split(paragraph) if s.strip())

        for index, chunk in enumerate(pack_chunks(sentences)):
            if len(tokenize(chunk)) < 8:
                continue  # skip headings, page numbers, and other noise
            heading = " › ".join(section.path) if section.path else "Untitled"
            chunks.append(
                {
                    "id": f"{heading}#{index}",
                    "text": f"{heading}\n\n{chunk}",
                    "metadata": {"section": heading, "chunk_index": index, "chars": len(chunk)},
                }
            )
    return chunks


def infer_layer(section_path: list[str], text: str, explicit: int | None = None) -> int | None:
    if explicit:
        return explicit
    haystack = " ".join(section_path) + " " + text[:400]
    match = re.search(r"layer\s*(\d)", haystack, re.I)
    if match:
        return int(match.group(1))
    return None


def ingest(path: Path, course_slug: str, layer: int | None = None) -> list[dict[str, Any]]:
    text = read_document(path)
    chunks = semantic_chunks(text)
    for chunk in chunks:
        chunk["course_slug"] = course_slug
        section = chunk["metadata"].get("section", "")
        chunk["metadata"].update(
            {
                "source": path.name,
                "course_slug": course_slug,
                "layer": infer_layer([section], chunk["text"], layer),
            }
        )
    return chunks


def index_chunks(chunks: Iterable[dict[str, Any]]) -> int:
    store = get_store()
    return store.add(chunks)


def main() -> None:
    # Windows consoles default to cp1252 and would crash on curriculum symbols.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

    parser = argparse.ArgumentParser(description="Chunk and optionally index a document for Atlas retrieval.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--course", required=True, help="Course slug the document belongs to")
    parser.add_argument("--layer", type=int, default=None)
    parser.add_argument("--index", action="store_true", help="Push chunks into the configured store")
    parser.add_argument("--limit", type=int, default=5, help="Preview chunks to print")
    args = parser.parse_args()

    chunks = ingest(args.path, args.course, args.layer)
    print(f"[ingest] {len(chunks)} chunks from {args.path.name} -> course {args.course}")
    for chunk in chunks[: args.limit]:
        print(f"\n--- {chunk['id']} (layer {chunk['metadata'].get('layer')}) ---")
        print(chunk["text"][:400])

    if args.index:
        added = index_chunks(chunks)
        print(f"\n[index] added {added} chunks to the hybrid store")
    else:
        print(json.dumps({"chunks": len(chunks)}, indent=2))


if __name__ == "__main__":
    main()
