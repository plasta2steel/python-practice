# Python Practice Platform / Python练习平台

A local Python practice platform with a Web UI, designed for self-directed learning across three directions: Data/AI/ML, Web Backend, and Automation.

纯本地 Python 练习平台，支持三大方向：数据/AI/机器学习、Web 后端、自动化。

## Features

- **135 exercises** across 3 directions + 15 shared basics, with smooth difficulty progression
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
│   ├── shared/basics/      # 15 shared fundamentals (★-★★★)
│   ├── data-ai/
│   │   ├── numpy-basics/   # 4 exercises (★-★★) — NumPy入门
│   │   ├── pandas-basics/  # 6 exercises (★-★★) — Pandas入门
│   │   ├── data-processing/# 10 exercises (★★★-★★★★)
│   │   ├── intermediate/   # 10 exercises (★★★-★★★★)
│   │   ├── visualization/  # 8 exercises (★★★-★★★★)
│   │   └── machine-learning/ # 10 exercises (★★★★-★★★★★)
│   ├── web-backend/
│   │   ├── flask-basics/   # 6 exercises (★-★★) — Flask入门
│   │   ├── http-basics/    # 10 exercises (★★-★★★)
│   │   ├── database/       # 7 exercises (★★★-★★★★)
│   │   ├── fastapi/        # 8 exercises (★★★-★★★★)
│   │   └── auth-middleware/ # 5 exercises (★★★★-★★★★★)
│   └── automation/
│       ├── os-basics/      # 6 exercises (★-★★) — 文件系统入门
│       ├── file-system/    # 10 exercises (★★-★★★)
│       ├── cli-tools/      # 7 exercises (★★-★★★)
│       ├── http-scraping/  # 8 exercises (★★-★★★)
│       └── automation-projects/ # 5 exercises (★★★-★★★★)
├── data/progress.json      # Local progress storage
├── obsidian/               # Obsidian vault templates
│   ├── 练习模板.md
│   └── 进度总览.md
└── 启动.bat / 启动.ps1     # Windows launchers
```

## Directions

| Direction | Focus | Exercises | Difficulty Range |
|-----------|-------|-----------|------------------|
| Shared Basics | Python fundamentals | 15 | ★ - ★★★ |
| Data / AI / ML | NumPy, pandas, visualization, ML | 48 | ★ - ★★★★★ |
| Web Backend | Flask, HTTP, databases, FastAPI, auth | 36 | ★ - ★★★★★ |
| Automation | os/pathlib, filesystem, CLI, scraping | 36 | ★ - ★★★★ |

## Difficulty Progression

```
★☆☆☆☆  15题  ← 入门热身，熟悉工具
★★☆☆☆  29题  ← 基础应用，建立信心
★★★☆☆  60题  ← 核心技能，主战场
★★★★☆  29题  ← 进阶挑战
★★★★★   2题  ← 综合项目
```

## Bridge Exercises (桥接题)

每个方向都新增了入门桥接题，帮助从 basics 平滑过渡：

| Direction | Bridge Category | What It Teaches |
|-----------|-----------------|-----------------|
| data-ai | numpy-basics | import、array创建、切片、运算 |
| data-ai | pandas-basics | Series、DataFrame、选列、筛选 |
| web-backend | flask-basics | 路由、参数、JSON响应、请求处理 |
| automation | os-basics | getcwd、listdir、文件读写、pathlib |

做完 basics 后，先刷对应方向的桥接题，再进入核心题目。

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
