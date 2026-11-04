"""ASGI entrypoint: `uvicorn main:app --port 8000`."""

from socratic_pipeline import app  # noqa: F401  (re-exported for uvicorn)
