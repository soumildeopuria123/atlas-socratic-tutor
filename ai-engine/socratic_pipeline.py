"""
Atlas — Socratic orchestration service.

Design contract
---------------
1. The curriculum is the authority. Lessons, checkpoints, diagrams and tables
   come from `data/curriculum.json`, exported from the Node curriculum so the
   two engines can never disagree about what a layer teaches.
2. Deterministic by default. Every endpoint works with no API key and no
   network. An LLM can *enrich* a reply when configured; it can never replace
   or contradict the curated content.
3. Layer discipline. A lesson request for a layer that the caller has not
   unlocked is refused with LAYER_LOCKED rather than quietly taught.
4. Socratic output. Every reply ends with a question the learner must answer.

The Node API (server/) proxies /lesson and /message here when AI_ENGINE_URL is
set, and falls back to its own implementation of the same contract otherwise.
"""

from __future__ import annotations

import json
import os
import random
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
CURRICULUM_PATH = DATA_DIR / "curriculum.json"
PASS_THRESHOLD = 0.75

TIER_LABEL = {"FOUNDATION": "Foundation", "INTERMEDIATE": "Intermediate", "ADVANCED": "Advanced"}


# ---------------------------------------------------------------------------
# Curriculum access
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class LayerRef:
    course: dict[str, Any]
    layer: dict[str, Any]
    index: int


_cache: dict[str, Any] | None = None


def curriculum() -> dict[str, Any]:
    global _cache
    if _cache is None:
        if not CURRICULUM_PATH.exists():
            raise RuntimeError(
                "Curriculum export missing. Run `node server/scripts/export-curriculum.mjs`."
            )
        _cache = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))
    return _cache


def courses() -> list[dict[str, Any]]:
    return curriculum()["courses"]


def find_course(slug: str) -> dict[str, Any] | None:
    return next((course for course in courses() if course["slug"] == slug), None)


def find_layer(course: dict[str, Any], layer_number: int) -> dict[str, Any] | None:
    return next((layer for layer in course["layers"] if layer["layer"] == layer_number), None)


# ---------------------------------------------------------------------------
# Markdown helpers
# ---------------------------------------------------------------------------
def _cell(value: Any) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ").strip()


def markdown_table(table: dict[str, Any]) -> str:
    head = "| " + " | ".join(_cell(item) for item in table["head"]) + " |"
    divider = "| " + " | ".join("---" for _ in table["head"]) + " |"
    rows = ["| " + " | ".join(_cell(item) for item in row) + " |" for row in table["rows"]]
    return "\n".join([head, divider, *rows])


def fence(language: str, body: str) -> str:
    return f"```{language}\n{body}\n```"


def socratic_question(course: dict[str, Any], layer: dict[str, Any], rng: random.Random) -> str:
    concepts = layer.get("concepts", [])
    first = concepts[0]["term"] if concepts else layer["title"]
    second = concepts[1]["term"] if len(concepts) > 1 else first
    options = [
        f"Before we move on: in your own words, what would break if **{first}** did not exist?",
        f"Try this before scrolling on — how would you explain **{first}** to a friend using only the idea of **{second}**?",
        f"Quick self-check: which part of **{layer['title']}** still feels like a rule you memorised rather than a consequence you could derive?",
        f"If I changed one assumption in the worked example above, where would **{first}** stop being valid?",
    ]
    return rng.choice(options)


# ---------------------------------------------------------------------------
# Lesson assembly
# ---------------------------------------------------------------------------
def build_lesson(course: dict[str, Any], layer: dict[str, Any], mode: str = "lesson",
                 weak_concepts: Iterable[str] | None = None) -> dict[str, Any]:
    rng = random.Random(layer["layer"] * 7919 + len(course["slug"]))
    previous = find_layer(course, layer["layer"] - 1)
    following = find_layer(course, layer["layer"] + 1)
    weak = list(weak_concepts or [])
    concepts = [c for c in layer["concepts"] if c["term"] in weak] or layer["concepts"]

    parts: list[str] = [
        f"## Layer {layer['layer']} · {layer['title']}",
        f"**{course['title']}** · {TIER_LABEL.get(layer['tier'], layer['tier'])} · "
        f"~{layer['minutes']} min · Layer {layer['layer']} of {len(course['layers'])}",
    ]

    if mode == "remediation" and weak:
        parts.append(
            f"> **Remediation mode.** Your last attempt scored below "
            f"{round(PASS_THRESHOLD * 100)}%, so Atlas is re-teaching exactly what slipped — "
            + ", ".join(f"**{term}**" for term in weak)
            + " — before you retest."
        )
    elif previous:
        parts.append(
            f"> You are building on **Layer {previous['layer']} — {previous['title']}**. "
            "If that layer still feels shaky, revisit it; this one assumes it."
        )
    else:
        parts.append(
            "> **Start here.** This is the foundation layer: it assumes no prior notation or "
            "vocabulary. Everything is built from scratch."
        )

    parts.append("### What you will be able to do")
    parts.append("\n".join(f"- {objective}" for objective in layer["objectives"]))

    parts.append("### The ideas, one at a time")
    for index, concept in enumerate(concepts, start=1):
        parts.append(f"#### {index}. {concept['term']}")
        parts.append(concept["definition"])

    parts.append("### The intuition underneath")
    parts.append(layer["intuition"])

    parts.append("### Worked example")
    parts.append(f"**Problem.** {layer['worked']['problem']}")
    parts.append("\n".join(f"{i}. {step}" for i, step in enumerate(layer["worked"]["steps"], start=1)))
    parts.append(f"**Answer.** {layer['worked']['answer']}")

    parts.append(f"### Reference: {layer['table']['caption']}")
    parts.append(markdown_table(layer["table"]))

    parts.append("### How it fits together")
    parts.append(fence("mermaid", layer["diagram"]))

    parts.append("### Where learners slip")
    parts.append("\n".join(f"- {pitfall}" for pitfall in layer["pitfalls"]))

    # Chat renders the checkpoint as an interactive card from the structured
    # field, so only remediation (markdown-only) embeds it in the prose.
    if mode == "remediation":
        parts.append("### Checkpoint")
        parts.append(layer["scenario"]["q"])
        for index, option in enumerate(layer["scenario"]["options"]):
            parts.append(f"{chr(65 + index)}. {option}")
        parts.append("_Try this before the retest; the answer is in the worked example above._")

    if following:
        parts.append(
            f"### After this layer\nLayer {following['layer']} — **{following['title']}** — unlocks once you "
            f"pass the Layer {layer['layer']} assessment at {round(PASS_THRESHOLD * 100)}% or higher."
        )
    else:
        parts.append(
            f"### After this layer\nThis is the final layer of **{course['title']}**. Passing it completes the "
            "ladder and seeds your spaced-repetition deck for the whole course."
        )

    return {
        "markdown": "\n\n".join(parts),
        "checkpoint": layer["scenario"],
        "socraticPrompt": socratic_question(course, layer, rng),
        "meta": {
            "courseSlug": course["slug"],
            "courseTitle": course["title"],
            "layer": layer["layer"],
            "title": layer["title"],
            "tier": layer["tier"],
            "minutes": layer["minutes"],
            "mode": mode,
            "totalLayers": len(course["layers"]),
            "engine": "python",
        },
    }


def build_overview(course: dict[str, Any], progress: dict[int, str] | None = None) -> dict[str, Any]:
    progress = progress or {}
    rows = [
        [
            layer["layer"],
            layer["title"],
            TIER_LABEL.get(layer["tier"], layer["tier"]),
            f"{layer['minutes']} min",
            {"PASSED": "✅ passed", "LOCKED": "🔒 locked"}.get(progress.get(layer["layer"], "LOCKED"), "▶ available"),
        ]
        for layer in course["layers"]
    ]
    first = course["layers"][0]
    markdown = "\n\n".join(
        [
            f"## {course['title']}",
            course["summary"],
            f"**Discipline:** {course['discipline']} · **Level:** {course['level']} · "
            f"**Layers:** {len(course['layers'])}",
            "### The ladder",
            markdown_table({"head": ["Layer", "Focus", "Tier", "Study time", "Status"], "rows": rows}),
            "### The rule of the ladder",
            f"Atlas never opens a layer you have not earned. Each layer ends in a timed assessment; "
            f"{round(PASS_THRESHOLD * 100)}% is the pass mark. Below that, advanced layers stay locked and "
            "the next attempt is a **new variant**, not the same paper.",
            f"### Start here\nLayer 1 — **{first['title']}**. {first['objectives'][0]}.",
            '_Ask me anything about this course, or request "teach me layer 1" to begin._',
        ]
    )
    return {
        "markdown": markdown,
        "socraticPrompt": (
            f"What do you already believe about **{first['concepts'][0]['term']}** — even a rough guess? "
            "Wrong guesses are the most useful starting point we have."
        ),
        "meta": {"courseSlug": course["slug"], "courseTitle": course["title"], "layer": None,
                 "totalLayers": len(course["layers"]), "engine": "python"},
    }


# ---------------------------------------------------------------------------
# Socratic dialogue
# ---------------------------------------------------------------------------
MOVES = [
    "If you had to teach **{term}** to someone who has never seen the notation, where would you start: "
    "a picture, an example, or a definition? Pick one and I will build from there.",
    "Here is a sharper question: what would have to be true for **{term}** to fail? Naming the failure "
    "case is the fastest way to own the idea.",
    "Try restating **{term}** without using the word itself. What survives the rewording is what you "
    "actually understand.",
    "Which is closer to your current picture of **{term}** — a rule you apply, or a mechanism you can "
    "explain? Answer honestly and I will pitch the next step correctly.",
]


def _normalise(text: str) -> str:
    return re.sub(r"[^a-z0-9\s'-]", " ", text.lower())


def find_concept(message: str) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]] | None:
    text = _normalise(message)
    best: tuple[dict[str, Any], dict[str, Any], dict[str, Any]] | None = None
    best_len = 0
    for course in courses():
        for layer in course["layers"]:
            for concept in layer["concepts"]:
                term = _normalise(re.sub(r"\(.*?\)", "", concept["term"])).strip()
                words = [word for word in term.split() if len(word) > 3]
                if any(word in text for word in words) and len(term) > best_len:
                    best = (course, layer, concept)
                    best_len = len(term)
    return best


def build_reply(message: str, enrolled: list[str] | None = None,
                progress: dict[str, dict[int, str]] | None = None) -> dict[str, Any]:
    enrolled = enrolled or []
    progress = progress or {}
    match = find_concept(message)
    rng = random.Random(len(message) * 7 + 31)

    if re.search(r"\bquiz|test me|check me|practice question\b", message, re.I):
        course = match[0] if match else (find_course(enrolled[0]) if enrolled else courses()[0])
        layer = match[1] if match else course["layers"][0]
        scenario = layer["scenario"]
        options = "\n".join(
            f"{chr(65 + index)}. {option}" for index, option in enumerate(scenario["options"])
        )
        return {
            "markdown": "\n\n".join(
                [
                    f"### Quick check · {course['title']}, Layer {layer['layer']}",
                    scenario["q"],
                    options,
                    "Tell me your answer and reasoning — I will not just mark it right or wrong, I will show "
                    "you which concept decided it.",
                ]
            ),
            "checkpoint": scenario,
            "meta": {"courseSlug": course["slug"], "layer": layer["layer"], "mode": "checkpoint",
                     "engine": "python"},
        }

    if match:
        course, layer, concept = match
        sibling = next((c for c in layer["concepts"] if c["term"] != concept["term"]),
                       layer["concepts"][0])
        move = MOVES[rng.randrange(len(MOVES))].format(term=concept["term"])
        body = [
            f"### {concept['term']}",
            f"**In one sentence.** {concept['definition']}",
            f"**Where it lives.** Layer {layer['layer']} — *{layer['title']}* in **{course['title']}** "
            f"({TIER_LABEL.get(layer['tier'], layer['tier'])}, ~{layer['minutes']} min).",
            f"**Why it exists.** {layer['intuition']}",
            f"**A concrete handle.** {layer['worked']['problem']} → {layer['worked']['answer']}",
            "### Structure of the idea",
            fence("mermaid", layer["diagram"]),
            "### Compare it with its neighbour",
            markdown_table(
                {
                    "head": ["Idea", "Working definition", "Layer"],
                    "rows": [
                        [concept["term"], concept["definition"], f"Layer {layer['layer']}"],
                        [sibling["term"], sibling["definition"], f"Layer {layer['layer']}"],
                    ],
                }
            ),
            "### Common trap",
            layer["pitfalls"][0],
            move,
        ]
        course_progress = progress.get(course["slug"], {})
        # JSON object keys arrive as strings; accept either form.
        status = course_progress.get(layer["layer"], course_progress.get(str(layer["layer"])))
        if status == "LOCKED":
            body.insert(
                2,
                f"> 🔒 Layer {layer['layer']} is currently locked on your dashboard. You can discuss it, but "
                f"the lesson and assessment unlock after you pass Layer {max(1, layer['layer'] - 1)}.",
            )
        return {
            "markdown": "\n\n".join(body),
            "socraticPrompt": move,
            "meta": {"courseSlug": course["slug"], "courseTitle": course["title"],
                     "layer": layer["layer"], "mode": "concept", "engine": "python"},
        }

    course = find_course(message.lower()) or (find_course(enrolled[0]) if enrolled else courses()[0])
    picks = random.Random(len(message) * 7 + len(course["slug"])).sample(course["layers"], k=3)
    return {
        "markdown": "\n\n".join(
            [
                "I want to answer precisely rather than generically, so let me anchor us first.",
                f"You are asking something in the neighbourhood of **{course['title']}**. Within that ladder, "
                "the three ideas most likely to be what you need are:",
                "\n".join(
                    f"- **Layer {layer['layer']} — {layer['title']}**: {layer['objectives'][0]}"
                    for layer in picks
                ),
                "Tell me which one is closest — or name the exact term you are stuck on — and I will take you "
                "through it from the layer that introduces it, with a worked example, a table, and a diagram.",
            ]
        ),
        "socraticPrompt": "Which of those three feels closest to your question — and what have you already tried?",
        "meta": {"courseSlug": course["slug"], "courseTitle": course["title"], "layer": None,
                 "mode": "disambiguation", "engine": "python"},
    }


# ---------------------------------------------------------------------------
# Retest generation (dynamic variants)
# ---------------------------------------------------------------------------
def _rng(seed: int) -> random.Random:
    return random.Random(seed)


def generate_quiz(course: dict[str, Any], layer: dict[str, Any], seed: int) -> dict[str, Any]:
    rng = _rng(seed)
    pool = [
        {**concept, "layer": item["layer"]}
        for item in course["layers"]
        if item["layer"] != layer["layer"]
        for concept in item["concepts"]
    ]
    local = layer["concepts"]
    chosen = rng.sample(local, k=2)
    rest = [concept for concept in local if concept not in chosen]
    questions: list[dict[str, Any]] = []

    def make(prompt: str, correct: str, distractors: list[str], explanation: str,
             concept: str | None) -> None:
        options = [correct, *[d for d in distractors if d and d != correct]]
        seen, deduped = set(), []
        for option in options:
            if option not in seen:
                seen.add(option)
                deduped.append(option)
        while len(deduped) < 4:
            deduped.append(f"None of these describe {concept or 'the idea'}")
        deduped = deduped[:4]
        rng.shuffle(deduped)
        questions.append(
            {
                "id": f"q{abs(hash((seed, prompt))) % 10**8}",
                "prompt": prompt,
                "options": deduped,
                "answer": deduped.index(correct),
                "explanation": explanation,
                "concept": concept,
            }
        )

    for concept in chosen:
        distractors = [item["definition"] for item in rng.sample(pool, k=min(3, len(pool)))]
        make(
            f"Which statement best defines **{concept['term']}**?",
            concept["definition"],
            distractors,
            f"**{concept['term']}** — {concept['definition']}",
            concept["term"],
        )

    for concept in rest:
        distractors = [item["term"] for item in rng.sample(pool, k=min(3, len(pool)))]
        make(
            f"Which term matches this description?\n\n> {concept['definition']}",
            concept["term"],
            distractors,
            f"That description is the definition of **{concept['term']}**.",
            concept["term"],
        )

    foreign = rng.choice(pool)
    make(
        f"Which term is **not** taught in this layer (Layer {layer['layer']} — {layer['title']})?",
        foreign["term"],
        [concept["term"] for concept in rng.sample(local, k=min(3, len(local)))],
        f"**{foreign['term']}** belongs to Layer {foreign['layer']}, not Layer {layer['layer']}.",
        foreign["term"],
    )

    previous = find_layer(course, layer["layer"] - 1)
    if previous:
        others = [item for item in course["layers"] if item["layer"] != previous["layer"]]
        make(
            f"In {course['title']}, which layer must be passed before **{layer['title']}** can be studied?",
            previous["title"],
            [item["title"] for item in rng.sample(others, k=min(3, len(others)))],
            f"Layer {layer['layer']} builds on **Layer {previous['layer']} — {previous['title']}**.",
            previous["concepts"][0]["term"],
        )
    else:
        make(
            f"Where does **{layer['title']}** sit in the {course['title']} ladder?",
            "It is Layer 1 and assumes no prior knowledge",
            [
                "It is the final layer and requires all others",
                "It is an optional aside that can be skipped",
                "It assumes Layer 2 has already been passed",
            ],
            "Layer 1 is the foundation: Atlas never requires prior coursework for it.",
            local[0]["term"],
        )

    own = rng.choice(layer["pitfalls"])
    others = [pitfall for item in course["layers"] if item["layer"] != layer["layer"] for pitfall in item["pitfalls"]]
    make(
        f"Which of these is a documented pitfall when working with **{layer['title']}**?",
        own,
        rng.sample(others, k=min(3, len(others))),
        f"The lesson flags this explicitly: {own}",
        local[0]["term"],
    )

    scenario = layer["scenario"]
    make(
        scenario["q"],
        scenario["options"][scenario["answer"]],
        [option for index, option in enumerate(scenario["options"]) if index != scenario["answer"]],
        scenario["why"],
        local[0]["term"],
    )

    return {
        "questions": questions,
        "passMark": int(round(len(questions) * PASS_THRESHOLD)),
        "meta": {"courseSlug": course["slug"], "layer": layer["layer"], "seed": seed},
    }


# ---------------------------------------------------------------------------
# Optional LLM enrichment (never replaces curriculum content)
# ---------------------------------------------------------------------------
def llm_enrich(prompt: str, context: str) -> str | None:
    """Optional. Requires OPENAI_API_KEY and ATLAS_LLM_ENRICH=true."""
    if os.environ.get("ATLAS_LLM_ENRICH", "false").lower() != "true":
        return None
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    import urllib.error
    import urllib.request

    base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    payload = json.dumps(
        {
            "model": model,
            "temperature": 0.2,
            "max_tokens": 320,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are Atlas, a Socratic tutor. Use ONLY the supplied curriculum context. "
                        "Never introduce facts outside it. Reply with at most 120 words and end with one "
                        "question for the learner."
                    ),
                },
                {"role": "user", "content": f"Context:\n{context}\n\nLearner: {prompt}"},
            ],
        }
    ).encode()
    request = urllib.request.Request(
        f"{base}/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            data = json.loads(response.read())
        return data["choices"][0]["message"]["content"].strip()
    except (urllib.error.URLError, KeyError, TimeoutError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------------------
# Code sandbox bridge
# ---------------------------------------------------------------------------
LANGUAGE_SPECS = {
    "javascript": ("mjs", None),
    "python": ("py", None),
    "c": ("c", ["gcc"]),
    "cpp": ("cpp", ["g++", "-std=c++17"]),
    "java": ("java", ["javac"]),
}
MAX_CODE = 20000
TIMEOUT_SECONDS = 8


def execute_code(language: str, code: str) -> dict[str, Any]:
    if language not in LANGUAGE_SPECS:
        return {"supported": False, "message": "Unsupported language."}
    if len(code) > MAX_CODE:
        return {"supported": False, "message": "Code too long."}

    extension, compiler_args = LANGUAGE_SPECS[language]
    with tempfile.TemporaryDirectory(prefix="atlas-ai-") as workdir:
        source = Path(workdir) / f"main.{extension}"
        source.write_text(code, encoding="utf-8")
        env = {"PATH": os.environ.get("PATH", ""), "HOME": workdir, "PYTHONIOENCODING": "utf-8"}
        try:
            if language == "javascript":
                command = ["node", "--no-warnings", str(source)]
            elif language == "python":
                command = [sys.executable, "-I", str(source)]
            else:
                if not compiler_args:
                    return {"supported": False, "message": "No compiler configured."}
                binary = Path(workdir) / ("main.exe" if os.name == "nt" else "main")
                if language == "java":
                    compile_cmd = [*compiler_args, str(source)]
                    run_cmd = ["java", "-cp", workdir, "Main"]
                else:
                    compile_cmd = [*compiler_args, str(source), "-O1", "-o", str(binary)]
                    run_cmd = [str(binary)]
                compiled = subprocess.run(
                    compile_cmd, cwd=workdir, env=env, capture_output=True, text=True,
                    timeout=TIMEOUT_SECONDS,
                )
                if compiled.returncode != 0:
                    return {
                        "supported": True,
                        "phase": "compile",
                        "stdout": compiled.stdout[:MAX_CODE],
                        "stderr": compiled.stderr[:MAX_CODE],
                        "exitCode": compiled.returncode,
                    }
                command = run_cmd

            completed = subprocess.run(
                command, cwd=workdir, env=env, capture_output=True, text=True,
                timeout=TIMEOUT_SECONDS,
            )
            return {
                "supported": True,
                "language": language,
                "phase": "run",
                "stdout": completed.stdout[:MAX_CODE],
                "stderr": completed.stderr[:MAX_CODE],
                "exitCode": completed.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"supported": True, "timedOut": True, "exitCode": 124,
                    "stdout": "", "stderr": f"Execution exceeded {TIMEOUT_SECONDS}s."}
        except FileNotFoundError:
            return {"supported": False, "message": "Required runtime is not installed on this host."}


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(title="Atlas AI Engine", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CLIENT_ORIGIN", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LessonRequest(BaseModel):
    courseSlug: str
    layer: int = Field(ge=1, le=12)
    mode: str = "lesson"
    weakConcepts: list[str] | None = None


class MessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    enrolled: list[str] | None = None
    progress: dict[str, dict[int, str]] | None = None


class RetestRequest(BaseModel):
    courseSlug: str
    layer: int = Field(ge=1, le=12)
    seed: int | None = None


class ExecuteRequest(BaseModel):
    language: str
    code: str


class SearchRequest(BaseModel):
    query: str
    courseSlug: str | None = None
    limit: int = 6


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "atlas-ai-engine",
        "courses": len(courses()),
        "layers": sum(len(course["layers"]) for course in courses()),
        "llmEnrichment": os.environ.get("ATLAS_LLM_ENRICH", "false").lower() == "true",
    }


@app.get("/courses")
def list_courses() -> dict[str, Any]:
    return {
        "courses": [
            {
                "slug": course["slug"],
                "title": course["title"],
                "discipline": course["discipline"],
                "layers": [layer["layer"] for layer in course["layers"]],
            }
            for course in courses()
        ]
    }


@app.post("/lesson")
def lesson(request: LessonRequest) -> dict[str, Any]:
    course = find_course(request.courseSlug)
    if not course:
        raise HTTPException(status_code=404, detail="No such course.")
    layer = find_layer(course, request.layer)
    if not layer:
        raise HTTPException(status_code=404, detail="No such layer.")
    if request.mode not in {"lesson", "remediation"}:
        raise HTTPException(status_code=400, detail="mode must be lesson or remediation")
    result = build_lesson(course, layer, request.mode, request.weakConcepts)
    if request.mode == "lesson":
        enriched = llm_enrich(
            f"Teach the essence of layer {layer['layer']}: {layer['title']}",
            json.dumps(layer)[:6000],
        )
        if enriched:
            result["markdown"] = f"{result['markdown']}\n\n### Atlas adds\n{enriched}"
    return result


@app.post("/overview")
def overview(request: RetestRequest) -> dict[str, Any]:
    course = find_course(request.courseSlug)
    if not course:
        raise HTTPException(status_code=404, detail="No such course.")
    return build_overview(course)


@app.post("/message")
def message(request: MessageRequest) -> dict[str, Any]:
    return build_reply(request.message, request.enrolled, request.progress)


@app.post("/retest")
def retest(request: RetestRequest) -> dict[str, Any]:
    course = find_course(request.courseSlug)
    if not course:
        raise HTTPException(status_code=404, detail="No such course.")
    layer = find_layer(course, request.layer)
    if not layer:
        raise HTTPException(status_code=404, detail="No such layer.")
    seed = request.seed if request.seed is not None else random.randrange(2**31)
    return generate_quiz(course, layer, seed)


@app.post("/execute")
def execute(
    request: ExecuteRequest,
    x_internal_token: str | None = Header(default=None),
) -> dict[str, Any]:
    # Optional shared secret: set SOCRATIC_INTERNAL_TOKEN to require the header.
    required = os.environ.get("SOCRATIC_INTERNAL_TOKEN")
    if required and x_internal_token != required:
        raise HTTPException(status_code=401, detail="Invalid internal token.")
    return execute_code(request.language, request.code)


@app.get("/srs/preview")
def srs_preview() -> dict[str, Any]:
    """Exposes the scheduling constants so clients and docs agree."""
    return {
        "algorithm": "SM-2",
        "initialEase": 2.5,
        "minimumEase": 1.3,
        "firstInterval": 1,
        "secondInterval": 6,
        "lapsePenalty": 0.2,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=int(os.environ.get("PORT", 8000)), reload=True)
