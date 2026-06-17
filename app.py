import os
import json
import yaml
import subprocess
import tempfile
from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

EXERCISES_DIR = os.path.join(os.path.dirname(__file__), "exercises")
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "progress.json")

DIRECTIONS = {
    "data-ai": {
        "name": "数据 / AI / 机器学习",
        "description": "Python是AI的母语。学习numpy、pandas、matplotlib、scikit-learn，从数据分析到机器学习。",
        "icon": "chart-line",
        "categories": ["basics", "intermediate", "data-processing", "visualization", "machine-learning"],
    },
    "web-backend": {
        "name": "Web 后端开发",
        "description": "用FastAPI构建现代Web API，学习数据库操作、JWT认证、异步任务。",
        "icon": "server",
        "categories": ["basics", "http-basics", "fastapi", "database", "auth-middleware"],
    },
    "automation": {
        "name": "自动化运维 / 脚本 / 工具",
        "description": "把日常工作变成代码。爬虫、CLI工具、文件操作、定时任务。",
        "icon": "terminal",
        "categories": ["basics", "file-system", "http-scraping", "cli-tools", "automation-projects"],
    },
}


def load_exercises():
    """Load all exercise YAML files."""
    exercises = {}
    for root, dirs, files in os.walk(EXERCISES_DIR):
        for f in files:
            if f.endswith(".yaml") or f.endswith(".yml"):
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8") as fh:
                        ex = yaml.safe_load(fh)
                        if ex and "id" in ex:
                            # Determine direction from path
                            rel = os.path.relpath(path, EXERCISES_DIR)
                            parts = rel.split(os.sep)
                            if parts[0] == "shared":
                                ex["_direction"] = "shared"
                            else:
                                ex["_direction"] = parts[0]
                            ex["_file"] = rel
                            exercises[ex["id"]] = ex
                except Exception:
                    pass
    return exercises


ALL_EXERCISES = load_exercises()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/directions")
def get_directions():
    return jsonify(DIRECTIONS)


@app.route("/api/exercises")
def get_exercises():
    direction = request.args.get("direction")
    category = request.args.get("category")
    difficulty = request.args.get("difficulty", type=int)
    search = request.args.get("search", "")

    result = []
    for ex in ALL_EXERCISES.values():
        # Filter by direction: include shared + direction-specific
        if direction and ex["_direction"] not in ("shared", direction):
            continue
        if category and ex.get("category") != category:
            continue
        if difficulty and ex.get("difficulty") != difficulty:
            continue
        if search and search.lower() not in ex.get("title", "").lower() and search.lower() not in ex.get("description", "").lower():
            continue
        result.append({k: v for k, v in ex.items() if not k.startswith("_")})

    result.sort(key=lambda x: (x.get("difficulty", 0), x.get("id", "")))
    return jsonify(result)


@app.route("/api/exercises/<exercise_id>")
def get_exercise(exercise_id):
    ex = ALL_EXERCISES.get(exercise_id)
    if not ex:
        return jsonify({"error": "Exercise not found"}), 404
    return jsonify({k: v for k, v in ex.items() if not k.startswith("_")})


@app.route("/api/run", methods=["POST"])
def run_code():
    data = request.get_json()
    code = data.get("code", "")
    if not code.strip():
        return jsonify({"output": "", "error": "", "execution_time": 0})

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
            f.write(code)
            tmp_path = f.name

        result = subprocess.run(
            ["python", tmp_path],
            capture_output=True,
            text=True,
            timeout=30,
            encoding="utf-8",
        )

        return jsonify({
            "output": result.stdout,
            "error": result.stderr,
            "execution_time": 0,
        })
    except subprocess.TimeoutExpired:
        return jsonify({
            "output": "",
            "error": "代码执行超时（30秒限制）",
            "execution_time": 30,
        })
    except Exception as e:
        return jsonify({
            "output": "",
            "error": str(e),
            "execution_time": 0,
        })
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@app.route("/api/progress")
def get_progress():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception:
        return jsonify({"exercises": {}, "stats": {"total_completed": 0, "streak_days": 0, "last_practice_date": None}})


@app.route("/api/progress", methods=["POST"])
def update_progress():
    data = request.get_json()
    exercise_id = data.get("exercise_id")
    status = data.get("status", "completed")
    code = data.get("code", "")

    if not exercise_id:
        return jsonify({"error": "exercise_id required"}), 400

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except Exception:
        progress = {"exercises": {}, "stats": {"total_completed": 0, "streak_days": 0, "last_practice_date": None}}

    from datetime import datetime
    now = datetime.now().isoformat()

    if exercise_id not in progress["exercises"]:
        progress["exercises"][exercise_id] = {"attempts": 0, "status": "not-started"}

    entry = progress["exercises"][exercise_id]
    entry["attempts"] = entry.get("attempts", 0) + 1
    entry["status"] = status
    entry["code"] = code
    entry["last_attempt"] = now
    if status == "completed":
        entry["completed_date"] = now

    # Update stats
    completed = sum(1 for e in progress["exercises"].values() if e.get("status") == "completed")
    progress["stats"]["total_completed"] = completed
    progress["stats"]["last_practice_date"] = now

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

    return jsonify({"ok": True})


@app.route("/api/stats")
def get_stats():
    direction = request.args.get("direction")
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            progress = json.load(f)
    except Exception:
        return jsonify({"total": 0, "completed": 0, "percentage": 0, "by_category": {}})

    # Count exercises for this direction
    direction_exercises = {eid: ex for eid, ex in ALL_EXERCISES.items()
                          if ex["_direction"] in ("shared", direction or "")}

    total = len(direction_exercises)
    completed = 0
    by_category = {}

    for eid, ex in direction_exercises.items():
        cat = ex.get("category", "unknown")
        if cat not in by_category:
            by_category[cat] = {"total": 0, "completed": 0}
        by_category[cat]["total"] += 1

        if eid in progress["exercises"] and progress["exercises"][eid].get("status") == "completed":
            completed += 1
            by_category[cat]["completed"] += 1

    return jsonify({
        "total": total,
        "completed": completed,
        "percentage": round(completed / total * 100) if total > 0 else 0,
        "by_category": by_category,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
