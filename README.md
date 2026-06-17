# Python Practice Platform / Python练习平台

A local Python practice platform with a Web UI, designed for self-directed learning across three directions: Data/AI/ML, Web Backend, and Automation.

纯本地 Python 练习平台，支持三大方向：数据/AI/机器学习、Web 后端、自动化。

## Features

- **113 exercises** across 3 directions + 15 shared basics
- **Monaco Editor** (VS Code-grade code editor) in the browser
- **Auto-complete**: pass the expected output → auto-saves and locks the editor
- **Read-only mode**: once completed, your code is preserved and cannot be edited
- **AI Help**: inline AI assistance panel
- **Answer panel**: shows the reference solution when available
- **CFA-style progress indicators**: ● completed / ◐ attempted / ○ not-started
- **Direction filtering** and full-text search
- **Obsidian integration** templates

## Quick Start

```bash
# 1. Install dependencies
pip install flask

# 2. Start the server
python app.py

# 3. Open in browser
http://127.0.0.1:5000
```

Or double-click `启动.bat` / `启动.ps1` on Windows.

## Project Structure

```
python-practice-platform/
├── app.py                  # Flask server
├── requirements.txt
├── templates/index.html    # Frontend UI
├── static/
│   ├── css/style.css
│   └── js/app.js
├── exercises/
│   ├── shared/basics/      # 15 shared fundamentals
│   ├── data-ai/            # 38 exercises: Data Processing, ML, Visualization
│   ├── web-backend/        # 30 exercises: HTTP, Database, FastAPI, Auth
│   └── automation/         # 30 exercises: Files, CLI, HTTP scraping, Projects
├── data/progress.json      # Local progress storage
├── obsidian/               # Obsidian vault templates
│   ├── 练习模板.md
│   └── 进度总览.md
└── 启动.bat / 启动.ps1     # Windows launchers
```

## Directions

| Direction | Focus | Exercises |
|-----------|-------|-----------|
| [Shared Basics] | Python fundamentals | 15 |
| Data / AI / ML | NumPy, pandas, visualization, ML | 38 |
| Web Backend | HTTP, databases, FastAPI, auth | 30 |
| Automation | Filesystem, CLI, scraping, projects | 30 |

## Exercise YAML Format

```yaml
id: basics-01
title: Hello World
difficulty: ★☆☆☆☆
direction: shared
category: basics
description: |
  编写一个程序，输出 'Hello, World!'
expected_output: |
  Hello, World!
hint: 使用 print() 函数
solution: |
  print('Hello, World!')
```

## Tech Stack

- **Backend**: Python 3 + Flask
- **Frontend**: Monaco Editor (CDN), vanilla JS
- **Storage**: Local JSON file (`data/progress.json`)
- **Environment**: Local-only (no deployment needed)
