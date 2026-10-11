const API_BASE = 'http://212.113.99.102:3000';

const surveyFactors = [
    "Состояние рабочего места", "Обеспеченность ресурсами", "Режим труда",
    "Уровень заработной платы", "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании", "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста", "Организация обучения в компании",
    "Отношение непосредственного руководителя", "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия", "Признание заслуг",
    "Информирование сотрудников"
];

const factorShort = [
    "Рабочее место", "Ресурсы", "Режим труда", "Зарплата", "Оплата и результат",
    "Соцпакет", "Соцгарантии", "Карьера", "Обучение", "Руководитель",
    "Коллектив", "Мероприятия", "Признание", "Информирование"
];

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

class AdminDashboard {
    constructor() {
        this.surveys = [];
        this.charts = {};
        this.loadError = '';
        this.query = '';
        this.periodDays = 90;
        this.token = sessionStorage.getItem('adminToken') || '';
        this.init();
    }

    init() { this.setupAuth(); }

    showApp() {
        document.getElementById('adminLoginScreen').style.display = 'none';
        document.getElementById('adminApp').style.display = 'flex';
        this.initializeApp();
    }

    logout() {
        ['adminToken', 'adminUsername', 'adminScope'].forEach((k) => sessionStorage.removeItem(k));
        window.location.reload();
    }

    setupAuth() {
        const loginForm = document.getElementById('adminLoginForm');
        const errorMsg = document.getElementById('loginError');

        if (this.token) this.showApp();

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value.trim();
            const password = document.getElementById('adminPassword').value;
            errorMsg.style.display = 'none';

            try {
                const response = await fetch(`${API_BASE}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json().catch(() => ({}));
                if (response.ok && data.success) {
                    this.token = data.token;
                    sessionStorage.setItem('adminToken', data.token);
                    sessionStorage.setItem('adminUsername', data.username);
                    sessionStorage.setItem('adminScope', JSON.stringify(data.scope || []));
                    this.showApp();
                } else {
                    errorMsg.textContent = data.message || 'Неверный логин или пароль';
                    errorMsg.style.display = 'block';
                }
            } catch (err) {
                errorMsg.textContent = 'Сервер недоступен';
                errorMsg.style.display = 'block';
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    async initializeApp() {
        this.setupNavigation();
        this.renderScope();
        await this.fetchData();
        const banner = document.getElementById('demoBanner');
        banner.textContent = this.loadError;
        banner.hidden = !this.loadError;
        this.renderDashboard();
        this.renderEmployeesTable();
    }

    renderScope() {
        let scope = [];
        try { scope = JSON.parse(sessionStorage.getItem('adminScope') || '[]'); } catch { scope = []; }
        const user = sessionStorage.getItem('adminUsername') || '';
        const el = document.getElementById('scopeInfo');
        el.textContent = scope.length
            ? `Вы вошли как ${user}. Область данных: ${scope.join(' / ')}`
            : `Вы вошли как ${user}. Область данных: все подразделения`;
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-target]').forEach((item) => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item[data-target]').forEach((nav) => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.querySelectorAll('.view-section').forEach((view) => view.classList.remove('active'));
                document.getElementById(`view-${e.currentTarget.dataset.target}`).classList.add('active');
            });
        });
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToExcel());
        document.getElementById('employeeSearch').addEventListener('input', (e) => {
            this.query = e.target.value.trim().toLowerCase();
            this.renderEmployeesTable();
        });
        document.getElementById('periodFilter').addEventListener('change', (e) => {
            this.periodDays = e.target.value === 'all' ? 'all' : Number(e.target.value);
            this.renderDashboard();
            this.renderEmployeesTable();
        });
    }

    async fetchData() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(`${API_BASE}/api/surveys`, {
                signal: controller.signal,
                headers: { Authorization: `Bearer ${this.token}` }
            });
            if (response.status === 401) { this.logout(); return; }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.surveys = Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn('Не удалось загрузить данные', error);
            this.surveys = [];
            this.loadError = 'Не удалось загрузить данные с сервера. Обновите страницу или повторите позже.';
        } finally {
            clearTimeout(timer);
        }
    }

    score(survey) { return parseFloat(survey.averageScore); }

    currentSurveys() {
        if (this.periodDays === 'all') return this.surveys;
        const now = Date.now();
        const cutoff = now - this.periodDays * 24 * 60 * 60 * 1000;
        return this.surveys.filter((s) => {
            const time = new Date(s.timestamp).getTime();
            return Number.isFinite(time) && time >= cutoff && time <= now;
        });
    }

    previousPeriodSurveys() {
        if (this.periodDays === 'all') return [];
        const now = Date.now();
        const duration = this.periodDays * 24 * 60 * 60 * 1000;
        const end = now - duration;
        const start = end - duration;
        return this.surveys.filter((s) => {
            const time = new Date(s.timestamp).getTime();
            return Number.isFinite(time) && time >= start && time < end;
        });
    }

    averageScore(surveys) {
        const valid = surveys.map((s) => this.score(s)).filter(Number.isFinite);
        return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
    }

    renderDashboard() {
        const surveys = this.currentSurveys();
        const valid = surveys.filter((s) => Number.isFinite(this.score(s)));
        document.getElementById('totalSurveys').textContent = surveys.length;

        const avg = this.averageScore(surveys);
        document.getElementById('avgCompanyScore').textContent = avg === null ? '—' : avg.toFixed(1);

        // Внутренний индекс на основе среднего балла анкеты, а не классический eNPS.
        const promoters = valid.filter((s) => this.score(s) >= 9).length;
        const detractors = valid.filter((s) => this.score(s) <= 6).length;
        const index = valid.length ? Math.round(((promoters - detractors) / valid.length) * 100) : null;
        const indexEl = document.getElementById('enpsScore');
        indexEl.textContent = index === null ? '—' : (index > 0 ? `+${index}` : String(index));
        indexEl.style.color = index === null ? '' : (index >= 20 ? 'var(--ok)' : (index > 0 ? 'var(--warn)' : 'var(--bad)'));

        let low = 0, totalRatings = 0;
        surveys.forEach((survey) => Object.values(survey.ratings || {}).forEach((value) => {
            const rating = Number(value);
            if (!Number.isFinite(rating)) return;
            totalRatings++;
            if (rating >= 0 && rating <= 4) low++;
        }));
        document.getElementById('lowScoreShare').textContent = totalRatings ? `${Math.round(low / totalRatings * 100)}%` : '—';

        const previous = this.averageScore(this.previousPeriodSurveys());
        const changeEl = document.getElementById('avgChange');
        if (this.periodDays === 'all' || avg === null || previous === null) {
            changeEl.textContent = '—';
            changeEl.style.color = '';
        } else {
            const change = avg - previous;
            changeEl.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}`;
            changeEl.style.color = change > 0 ? 'var(--ok)' : (change < 0 ? 'var(--bad)' : '');
        }

        this.calculateAdvancedMetrics();
        this.initTrendChart();
        this.initRadarChart();
        this.initDistributionChart();
    }

    factorAverages() {
        const sums = {};
        this.currentSurveys().forEach((s) => {
            if (!s.ratings) return;
            Object.entries(s.ratings).forEach(([index, score]) => {
                const v = parseInt(score, 10);
                if (Number.isNaN(v)) return;
                (sums[index] ||= { sum: 0, count: 0 });
                sums[index].sum += v;
                sums[index].count += 1;
            });
        });
        return sums;
    }

    calculateAdvancedMetrics() {
        const deptScores = {};
        this.currentSurveys().forEach((s) => {
            const dept = s.user?.department;
            const key = s.user?.departmentPath || dept;
            const v = this.score(s);
            if (!dept || Number.isNaN(v)) return;
            (deptScores[key] ||= { name: dept, sum: 0, count: 0 });
            deptScores[key].sum += v;
            deptScores[key].count += 1;
        });

        let topDept = '-', maxScore = 0;
        for (const d of Object.values(deptScores)) {
            const avg = d.sum / d.count;
            if (avg > maxScore) { maxScore = avg; topDept = d.name; }
        }
        document.getElementById('topDepartment').textContent = maxScore > 0 ? `${topDept} (${maxScore.toFixed(1)})` : '-';

        let worst = '-', min = 11, has = false;
        for (const [index, d] of Object.entries(this.factorAverages())) {
            has = true;
            const avg = d.sum / d.count;
            if (avg < min) { min = avg; worst = surveyFactors[index] || `Фактор ${index}`; }
        }
        document.getElementById('problemArea').textContent = has ? `${worst} (${min.toFixed(1)})` : '-';
    }

    buildTrend() {
        const parsed = this.currentSurveys()
            .map((s) => ({ d: new Date(s.timestamp), v: this.score(s) }))
            .filter((x) => !Number.isNaN(x.d.getTime()) && !Number.isNaN(x.v))
            .sort((a, b) => a.d - b.d);

        const months = new Set(parsed.map((x) => `${x.d.getFullYear()}-${x.d.getMonth()}`));
        const byMonth = months.size >= 3;
        const groups = new Map();
        parsed.forEach((x) => {
            const key = byMonth ? `${x.d.getFullYear()}-${x.d.getMonth()}` : x.d.toISOString().slice(0, 10);
            if (!groups.has(key)) groups.set(key, { date: x.d, sum: 0, count: 0 });
            const g = groups.get(key);
            g.sum += x.v;
            g.count += 1;
        });

        const fmt = byMonth ? { month: 'short', year: '2-digit' } : { day: '2-digit', month: 'short' };
        const items = [...groups.values()];
        return {
            labels: items.map((g) => g.date.toLocaleDateString('ru-RU', fmt)),
            values: items.map((g) => Number((g.sum / g.count).toFixed(2)))
        };
    }

    initTrendChart() {
        if (typeof Chart === 'undefined') return;
        Chart.defaults.font.family = "'Manrope', sans-serif";
        Chart.defaults.color = '#5C6370';

        const ctx = document.getElementById('trendChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(226, 26, 26, 0.22)');
        gradient.addColorStop(1, 'rgba(226, 26, 26, 0)');

        const { labels, values } = this.buildTrend();
        this.charts.trend?.destroy();
        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: values, borderColor: '#E21A1A', backgroundColor: gradient, borderWidth: 3,
                    tension: 0.4, fill: true, pointBackgroundColor: '#FFFFFF', pointBorderColor: '#E21A1A',
                    pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#10131A', padding: 12, cornerRadius: 8, displayColors: false } },
                scales: {
                    y: { beginAtZero: true, max: 10, grid: { color: 'rgba(19,22,27,0.06)' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    initRadarChart() {
        if (typeof Chart === 'undefined') return;
        const averages = this.factorAverages();
        const data = surveyFactors.map((_, i) => averages[i] ? Number((averages[i].sum / averages[i].count).toFixed(2)) : 0);

        this.charts.radar?.destroy();
        this.charts.radar = new Chart(document.getElementById('radarChart').getContext('2d'), {
            type: 'radar',
            data: {
                labels: factorShort,
                datasets: [{
                    data, backgroundColor: 'rgba(226, 26, 26, 0.16)', borderColor: '#E21A1A',
                    pointBackgroundColor: '#E21A1A', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        min: 0, max: 10,
                        angleLines: { color: 'rgba(19,22,27,0.08)' },
                        grid: { color: 'rgba(19,22,27,0.08)' },
                        pointLabels: { font: { size: 10 }, color: '#2D3340' },
                        ticks: { display: false, stepSize: 2 }
                    }
                }
            }
        });
    }

    initDistributionChart() {
        if (typeof Chart === 'undefined') return;
        const ranges = [
            { label: '0–4', min: 0, max: 4 },
            { label: '5–6', min: 5, max: 6 },
            { label: '7–8', min: 7, max: 8 },
            { label: '9–10', min: 9, max: 10 }
        ];
        const counts = [0, 0, 0, 0];
        this.currentSurveys().forEach((survey) => Object.values(survey.ratings || {}).forEach((value) => {
            const rating = Number(value);
            if (!Number.isInteger(rating) || rating < 0 || rating > 10) return;
            const index = ranges.findIndex((range) => rating >= range.min && rating <= range.max);
            if (index >= 0) counts[index]++;
        }));
        this.charts.distribution?.destroy();
        this.charts.distribution = new Chart(document.getElementById('distributionChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ranges.map((range) => range.label),
                datasets: [{ label: 'Количество оценок', data: counts, borderRadius: 6, backgroundColor: ['#D94848', '#D9A441', '#7894B8', '#3B9875'] }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `Оценок: ${context.parsed.y}` } } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
            }
        });
    }

    renderEmployeesTable() {
        const tbody = document.getElementById('employeesTableBody');
        const q = this.query;
        const rows = this.currentSurveys().filter((s) => {
            if (!q) return true;
            return `${s.user?.fullName ?? ''} ${s.user?.department ?? ''}`.toLowerCase().includes(q);
        });

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="data-table__empty">Нет данных для вашей области</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((survey) => {
            const score = this.score(survey);
            let badgeClass = 'score-high';
            if (score <= 6) badgeClass = 'score-low';
            else if (score < 9) badgeClass = 'score-medium';

            const date = new Date(survey.timestamp).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <tr>
                    <td>${esc(survey.user?.fullName)}</td>
                    <td title="${esc(survey.user?.departmentPath || '')}">${esc(survey.user?.department)}</td>
                    <td><span class="score-badge ${badgeClass}">${Number.isNaN(score) ? '—' : score.toFixed(1)}</span></td>
                    <td>${esc(date)}</td>
                </tr>`;
        }).join('');
    }

    exportToExcel() {
        const cell = (value) => {
            let s = String(value ?? '');
            if (/^[=+\-@]/.test(s)) s = `'${s}`;
            return `"${s.replace(/"/g, '""')}"`;
        };
        const rows = [['ФИО', 'Подразделение', 'Полный путь', 'Средний балл', 'Дата прохождения'].map(cell).join(';')];

        this.currentSurveys().forEach((survey) => {
            const date = new Date(survey.timestamp).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            rows.push([survey.user?.fullName, survey.user?.department, survey.user?.departmentPath, survey.averageScore, date]
                .map(cell).join(';'));
        });

        const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rzd_survey_results.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminDashboard();
});