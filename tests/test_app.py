import json
import pytest
from app import app as flask_app


@pytest.fixture
def client():
    """Flask test client fixture."""
    flask_app.config["TESTING"] = True
    with flask_app.test_client() as client:
        yield client


# ── Index ─────────────────────────────────────────────────────────────

def test_index_returns_200(client):
    resp = client.get("/")
    assert resp.status_code == 200


# ── Directions API ────────────────────────────────────────────────────

def test_directions_returns_3_directions(client):
    resp = client.get("/api/directions")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 3
    for key in ("data-ai", "web-backend", "automation"):
        assert key in data


# ── Exercises API ─────────────────────────────────────────────────────

def test_exercises_returns_exercises(client):
    resp = client.get("/api/exercises")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_exercises_filters_by_direction(client):
    resp = client.get("/api/exercises?direction=data-ai")
    assert resp.status_code == 200
    data = resp.get_json()
    # All returned exercises should be shared or data-ai
    for ex in data:
        # The _direction field is stripped from the response,
        # but category should belong to data-ai categories
        assert ex.get("category") in (
            "basics", "numpy-basics", "pandas-basics",
            "intermediate", "data-processing", "visualization",
            "machine-learning",
        ) or ex.get("direction") == "shared"


# ── Run API ───────────────────────────────────────────────────────────

def test_run_blocks_dangerous_code(client):
    resp = client.post(
        "/api/run",
        data=json.dumps({"code": "import subprocess\nsubprocess.run(['ls'])"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["output"] == ""
    assert "安全检查未通过" in data["error"] or "subprocess" in data["error"]


def test_run_executes_safe_code(client):
    resp = client.post(
        "/api/run",
        data=json.dumps({"code": "print('hello')"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "hello" in data["output"]
    assert data["error"] == ""


# ── Progress API ──────────────────────────────────────────────────────

def test_progress_get_returns_default(client):
    resp = client.get("/api/progress")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "exercises" in data
    assert "stats" in data
