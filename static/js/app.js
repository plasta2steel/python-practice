// State
let currentDirection = null;
let currentExercise = null;
let allExercises = [];
let progressData = {};
let progressChart = null;
let monacoEditor = null;
let isReadOnly = false;

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadDirections();
    loadTheme();
    initMonaco();
    const saved = localStorage.getItem('direction');
    if (saved) selectDirection(saved);
});

// Monaco Editor
function initMonaco() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], function () {
        monacoEditor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: '',
            language: 'python',
            theme: 'vs-dark',
            fontSize: 14,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            suggest: {
                showKeywords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showModules: true,
            },
        });

        monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode());

        window.updateMonacoTheme = function (isDark) {
            monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
        };
    });
}

function setEditorReadOnly(readonly) {
    isReadOnly = readonly;
    if (monacoEditor) {
        monacoEditor.updateOptions({ readOnly: readonly });
    }
    document.getElementById('btn-run').disabled = readonly;
    document.getElementById('btn-reset').disabled = false;
    
    const indicator = document.getElementById('completion-indicator');
    if (readonly) {
        indicator.style.display = 'flex';
    } else {
        indicator.style.display = 'none';
    }
}

// Directions
async function loadDirections() {
    const res = await fetch('/api/directions');
    const data = await res.json();
    const container = document.getElementById('direction-cards');
    const icons = { 'data-ai': 'fa-chart-line', 'web-backend': 'fa-server', 'automation': 'fa-terminal' };
    container.innerHTML = Object.entries(data).map(([key, d]) => `
        <div class="direction-card" onclick="selectDirection('${key}')">
            <div class="icon"><i class="fas ${icons[key] || 'fa-code'}"></i></div>
            <h2>${d.name}</h2>
            <p>${d.description}</p>
            <div class="meta">
                <span><i class="fas fa-list"></i> ${d.categories.length} 阶段</span>
                <span><i class="fas fa-database"></i> 题库</span>
            </div>
        </div>
    `).join('');
}

async function selectDirection(key) {
    currentDirection = key;
    localStorage.setItem('direction', key);
    const res = await fetch('/api/directions');
    const dirs = await res.json();
    document.getElementById('direction-name').textContent = dirs[key].name;
    document.getElementById('direction-page').classList.remove('active');
    document.getElementById('practice-page').classList.add('active');
    await loadExercises();
}

function showDirectionPage() {
    document.getElementById('practice-page').classList.remove('active');
    document.getElementById('direction-page').classList.add('active');
}

// Exercises
async function loadExercises() {
    const res = await fetch(`/api/exercises?direction=${currentDirection}`);
    allExercises = await res.json();
    updateCategoryFilter();
    renderExerciseList();
    await loadProgress();
}

function updateCategoryFilter() {
    const categories = [...new Set(allExercises.map(e => e.category))];
    const select = document.getElementById('filter-category');
    select.innerHTML = '<option value="">全部分类</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function filterExercises() {
    const category = document.getElementById('filter-category').value;
    const difficulty = document.getElementById('filter-difficulty').value;
    const search = document.getElementById('search-input').value.toLowerCase();
    let filtered = allExercises;
    if (category) filtered = filtered.filter(e => e.category === category);
    if (difficulty) filtered = filtered.filter(e => e.difficulty === parseInt(difficulty));
    if (search) filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(search) || e.description.toLowerCase().includes(search)
    );
    renderExerciseList(filtered);
}

function renderExerciseList(exercises = allExercises) {
    const container = document.getElementById('exercise-list');
    container.innerHTML = exercises.map(ex => {
        const stars = '★'.repeat(ex.difficulty) + '☆'.repeat(5 - ex.difficulty);
        const progress = progressData[ex.id];
        const completed = progress?.status === 'completed';
        const attempted = progress?.status === 'attempted';
        let statusIcon = '';
        let statusClass = '';
        if (completed) {
            statusIcon = '●';
            statusClass = 'completed';
        } else if (attempted) {
            statusIcon = '◐';
            statusClass = 'attempted';
        } else {
            statusIcon = '○';
            statusClass = 'not-started';
        }
        return `
            <div class="exercise-item ${statusClass} ${currentExercise?.id === ex.id ? 'active' : ''}"
                 onclick="selectExercise('${ex.id}')">
                <div class="exercise-status ${statusClass}">${statusIcon}</div>
                <div class="exercise-info">
                    <div class="title">${ex.title}</div>
                    <div class="meta">
                        <span class="difficulty">${stars}</span>
                        <span>${ex.category}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectExercise(id) {
    const res = await fetch(`/api/exercises/${id}`);
    currentExercise = await res.json();
    
    document.getElementById('exercise-title').textContent = currentExercise.title;
    document.getElementById('exercise-desc').innerHTML = `<p>${currentExercise.description}</p>`;
    document.getElementById('btn-help').disabled = false;
    document.getElementById('btn-answer').disabled = false;
    document.getElementById('btn-reset').disabled = false;
    
    // Check if exercise is already completed
    const progress = progressData[id];
    const isCompleted = progress?.status === 'completed';
    const savedCode = progress?.code;
    
    if (isCompleted && savedCode) {
        // Load saved code and set read-only
        if (monacoEditor) monacoEditor.setValue(savedCode);
        setEditorReadOnly(true);
        document.getElementById('output-content').innerHTML = '<span class="success"><i class="fas fa-check-circle"></i> 此题已完成</span>';
    } else {
        // Load starter code
        if (monacoEditor) monacoEditor.setValue(currentExercise.starter_code || '');
        setEditorReadOnly(false);
        document.getElementById('output-content').innerHTML = '<p class="placeholder">点击"运行"按钮执行代码 (Ctrl+Enter)</p>';
    }
    
    // Show expected output
    const expectedDiv = document.getElementById('expected-output');
    if (currentExercise.expected_output) {
        expectedDiv.style.display = 'block';
        document.getElementById('expected-content').textContent = currentExercise.expected_output;
    } else {
        expectedDiv.style.display = 'none';
    }
    
    // Clear match status
    document.getElementById('match-status').style.display = 'none';
    document.getElementById('execution-time').textContent = '';
    
    // Update side panel content
    updateAIHelpContent();
    updateAnswerContent();
    
    renderExerciseList();
    if (monacoEditor) monacoEditor.focus();
}

// Code execution
async function runCode() {
    if (isReadOnly) return;
    
    const code = monacoEditor ? monacoEditor.getValue() : '';
    if (!code.trim()) return;

    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-run').innerHTML = '<i class="fas fa-spinner fa-spin"></i> 运行中...';
    document.getElementById('output-content').innerHTML = '<p>执行中...</p>';
    document.getElementById('match-status').style.display = 'none';

    try {
        const res = await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, exercise_id: currentExercise?.id })
        });
        const data = await res.json();

        let output = '';
        if (data.output) output += `<span class="success">${escapeHtml(data.output)}</span>`;
        if (data.error) output += `<span class="error">${escapeHtml(data.error)}</span>`;
        if (!output) output = '<span class="placeholder">(无输出)</span>';

        document.getElementById('output-content').innerHTML = output;
        document.getElementById('execution-time').textContent = data.execution_time ? `${data.execution_time.toFixed(2)}s` : '';

        const lastRunOutput = (data.output || '').trim();

        // Check if output matches expected
        if (currentExercise?.expected_output) {
            const expected = currentExercise.expected_output.trim();
            const matchStatus = document.getElementById('match-status');

            if (lastRunOutput === expected) {
                matchStatus.style.display = 'block';
                matchStatus.className = 'match-status match';
                matchStatus.innerHTML = '<i class="fas fa-check-circle"></i> 回答正确！';
                await markComplete(code);
                return;
            } else {
                matchStatus.style.display = 'block';
                matchStatus.className = 'match-status no-match';
                matchStatus.innerHTML = '<i class="fas fa-times-circle"></i> 回答错误，请继续修改';
            }
        }

        // Save attempt
        if (currentExercise) {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercise_id: currentExercise.id, status: 'attempted', code })
            });
            await loadProgress();
        }
    } catch (e) {
        document.getElementById('output-content').innerHTML = `<span class="error">Error: ${e.message}</span>`;
    }

    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-run').innerHTML = '<i class="fas fa-play"></i> 运行';
}

// Mark exercise as complete
async function markComplete(code) {
    if (!currentExercise) return;
    if (!code) code = monacoEditor ? monacoEditor.getValue() : '';

    try {
        const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercise_id: currentExercise.id, status: 'completed', code })
        });
        const data = await res.json();

        if (data.ok) {
            await loadProgress();
            renderExerciseList();
            
            // Set read-only mode
            setEditorReadOnly(true);
            
            // Auto-advance after 1.5 seconds
            setTimeout(() => {
                const currentIndex = allExercises.findIndex(e => e.id === currentExercise.id);
                if (currentIndex < allExercises.length - 1) {
                    selectExercise(allExercises[currentIndex + 1].id);
                }
            }, 1500);
        }
    } catch (e) {
        console.error('Failed to mark complete:', e);
    }
}

// Reset exercise
async function resetExercise() {
    if (!currentExercise) return;
    
    // Clear completion status
    await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: currentExercise.id, status: 'not-started', code: '' })
    });
    
    // Reset editor
    if (monacoEditor) monacoEditor.setValue(currentExercise.starter_code || '');
    setEditorReadOnly(false);
    document.getElementById('output-content').innerHTML = '<p class="placeholder">点击"运行"按钮执行代码 (Ctrl+Enter)</p>';
    document.getElementById('match-status').style.display = 'none';
    document.getElementById('execution-time').textContent = '';
    
    await loadProgress();
    renderExerciseList();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Progress
async function loadProgress() {
    const res = await fetch('/api/progress');
    const data = await res.json();
    progressData = data.exercises || {};
    renderExerciseList();
}

// Stats
async function showStats() {
    document.getElementById('stats-modal').style.display = 'flex';
    const res = await fetch(`/api/stats?direction=${currentDirection}`);
    const stats = await res.json();

    document.getElementById('stats-summary').innerHTML = `
        <div class="stat-card">
            <div class="value">${stats.completed}</div>
            <div class="label">已完成</div>
        </div>
        <div class="stat-card">
            <div class="value">${stats.total - stats.completed}</div>
            <div class="label">未完成</div>
        </div>
        <div class="stat-card">
            <div class="value">${stats.percentage}%</div>
            <div class="label">完成率</div>
        </div>
    `;

    const categories = Object.keys(stats.by_category);
    const completed = categories.map(c => stats.by_category[c].completed);
    const totals = categories.map(c => stats.by_category[c].total);

    if (progressChart) progressChart.destroy();
    const ctx = document.getElementById('progress-chart').getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                { label: '已完成', data: completed, backgroundColor: '#a6e3a1' },
                { label: '总题数', data: totals, backgroundColor: '#45475a' }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { labels: { color: '#cdd6f4' } } }
        }
    });
}

function closeStats() {
    document.getElementById('stats-modal').style.display = 'none';
}

// AI Help (inline)
function updateAIHelpContent() {
    if (!currentExercise) return;
    
    const code = monacoEditor ? monacoEditor.getValue() : '';
    const prompt = `请审查以下Python代码：

题目：${currentExercise.title}
要求：${currentExercise.description}

代码：
${code}

预期输出：
${currentExercise.expected_output || '无'}

请指出问题并给出改进建议（不要直接给出答案）。`;

    document.getElementById('ai-prompt-text').textContent = prompt;
}

function copyAIPrompt() {
    const text = document.getElementById('ai-prompt-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-ai');
        btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> 复制Prompt', 2000);
    });
}

function toggleAIHelp() {
    const panel = document.getElementById('ai-help-panel');
    const answerPanel = document.getElementById('answer-panel');
    const btn = document.getElementById('btn-help');
    const answerBtn = document.getElementById('btn-answer');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        answerPanel.style.display = 'none';
        btn.classList.add('active');
        answerBtn.classList.remove('active');
        updateAIHelpContent();
    } else {
        panel.style.display = 'none';
        btn.classList.remove('active');
    }
}

function updateAnswerContent() {
    if (!currentExercise) return;

    const solution = currentExercise.solution || currentExercise.answer;
    const answerText = solution || `暂无内置参考解答。\n\n你可以先对照预期输出检查：\n${currentExercise.expected_output || '本题无固定预期输出'}\n\n如果需要提示，请点击“AI帮助”复制审查prompt。`;
    document.getElementById('answer-text').textContent = answerText;
}

function toggleAnswer() {
    const panel = document.getElementById('answer-panel');
    const aiPanel = document.getElementById('ai-help-panel');
    const btn = document.getElementById('btn-answer');
    const aiBtn = document.getElementById('btn-help');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        aiPanel.style.display = 'none';
        btn.classList.add('active');
        aiBtn.classList.remove('active');
        updateAnswerContent();
    } else {
        panel.style.display = 'none';
        btn.classList.remove('active');
    }
}

// Theme
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') !== 'light';
    body.setAttribute('data-theme', isDark ? 'light' : '');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-icon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    if (window.updateMonacoTheme) window.updateMonacoTheme(!isDark);
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        document.getElementById('theme-icon').className = 'fas fa-sun';
    }
}
