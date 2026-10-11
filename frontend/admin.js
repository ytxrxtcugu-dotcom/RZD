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

// Короткие подписи осей радара (по порядку surveyFactors)
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
        this.isDemo = false;
        this.query = '';
        this.init();
    }

    init() { this.setupAuth(); }

    setupAuth() {
        const loginScreen = document.getElementById('adminLoginScreen');
        const appScreen = document.getElementById('adminApp');
        const loginForm = document.getElementById('adminLoginForm');
        const errorMsg = document.getElementById('loginError');

        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            loginScreen.style.display = 'none';
            appScreen.style.display = 'flex';
            this.initializeApp();
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUsername').value;
            const pass = document.getElementById('adminPassword').value;

            // ВНИМАНИЕ: проверка на клиенте не обеспечивает защиту (см. аудит).
            const validCredentials = { 'admin': 'admin', 'root': 'password' };

            if (validCredentials[user] && validCredentials[user] === pass) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                loginScreen.style.display = 'none';
                appScreen.style.display = 'flex';
                this.initializeApp();
            } else {
                errorMsg.style.display = 'block';
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.reload();
        });
    }

    async initializeApp() {
        this.setupNavigation();
        await this.fetchData();
        document.getElementById('demoBanner').hidden = !this.isDemo;
        this.renderDashboard();
        this.renderEmployeesTable();
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
    }

    async fetchData() {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(`${API_BASE}/api/surveys`, { signal: controller.signal });
            if (response.ok) this.surveys = await response.json();
        } catch (error) {
            console.warn('Сервер недоступен, загружены демо-данные');
        } finally {
            clearTimeout(timer);
        }

        if (!Array.isArray(this.surveys) || this.surveys.length === 0) {
            this.isDemo = true;
            this.surveys = [
                { user: { fullName: 'Иванов И.И.', department: 'Дирекция тяги' }, averageScore: 8.5, ratings: { 0: 8, 1: 9, 2: 7, 3: 8 }, timestamp: new Date().toISOString() },
                { user: { fullName: 'Петров П.П.', department: 'Аппарат управления' }, averageScore: 6.2, ratings: { 0: 6, 1: 5, 2: 8, 3: 4 }, timestamp: new Date(Date.now() - 86400000).toISOString() },
                { user: { fullName: 'Сидорова А.В.', department: 'Дирекция тяги' }, averageScore: 9.1, ratings: { 0: 9, 1: 10, 2: 8, 3: 9 }, timestamp: new Date(Date.now() - 172800000).toISOString() },
                { user: { fullName: 'Смирнов В.А.', department: 'Дирекция инфраструктуры' }, averageScore: 4.5, ratings: { 0: 4, 1: 3, 2: 5, 3: 4 }, timestamp: new Date(Date.now() - 259200000).toISOString() }
            ];
        }
    }

    score(survey) { return parseFloat(survey.averageScore); }

    renderDashboard() {
        const valid = this.surveys.filter((s) => !Number.isNaN(this.score(s)));
        document.getElementById('totalSurveys').textContent = this.surveys.length;

        const avg = valid.length ? valid.reduce((sum, s) => sum + this.score(s), 0) / valid.length : 0;
        document.getElementById('avgCompanyScore').textContent = avg.toFixed(1);

        // Методика: промоутеры — средний балл ≥ 9, критики — ≤ 6. [ТРЕБУЕТСЯ ПРОВЕРКА обоснования порогов]
        const promoters = valid.filter((s) => this.score(s) >= 9).length;
        const detractors = valid.filter((s) => this.score(s) <= 6).length;
        const enps = valid.length ? Math.round(((promoters - detractors) / valid.length) * 100) : 0;
        const enpsEl = document.getElementById('enpsScore');
        enpsEl.textContent = enps > 0 ? `+${enps}` : String(enps);
        enpsEl.style.color = enps >= 20 ? 'var(--ok)' : (enps > 0 ? 'var(--warn)' : 'var(--bad)');

        this.calculateAdvancedMetrics();
        this.initTrendChart();
        this.initRadarChart();
    }

    factorAverages() {
        const sums = {};
        this.surveys.forEach((s) => {
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
        this.surveys.forEach((s) => {
            const dept = s.user?.department;
            const v = this.score(s);
            if (!dept || Number.isNaN(v)) return;
            (deptScores[dept] ||= { sum: 0, count: 0 });
            deptScores[dept].sum += v;
            deptScores[dept].count += 1;
        });

        let topDept = '-', maxScore = 0;
        for (const [dept, d] of Object.entries(deptScores)) {
            const avg = d.sum / d.count;
            if (avg > maxScore) { maxScore = avg; topDept = dept; }
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
        const parsed = this.surveys
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

        const canvas = document.getElementById('trendChart');
        const ctx = canvas.getContext('2d');
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

    renderEmployeesTable() {
        const tbody = document.getElementById('employeesTableBody');
        const q = this.query;
        const rows = this.surveys.filter((s) => {
            if (!q) return true;
            return `${s.user?.fullName ?? ''} ${s.user?.department ?? ''}`.toLowerCase().includes(q);
        });

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="data-table__empty">Ничего не найдено</td></tr>';
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
                    <td>${esc(survey.user?.department)}</td>
                    <td><span class="score-badge ${badgeClass}">${Number.isNaN(score) ? '—' : score.toFixed(1)}</span></td>
                    <td>${esc(date)}</td>
                </tr>`;
        }).join('');
    }

    exportToExcel() {
        // Кавычки по RFC 4180 + защита от формул (=, +, -, @) при открытии в Excel
        const cell = (value) => {
            let s = String(value ?? '');
            if (/^[=+\-@]/.test(s)) s = `'${s}`;
            return `"${s.replace(/"/g, '""')}"`;
        };
        const rows = [['ФИО', 'Подразделение', 'Средний балл', 'Дата прохождения'].map(cell).join(';')];

        this.surveys.forEach((survey) => {
            const date = new Date(survey.timestamp).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            rows.push([survey.user?.fullName, survey.user?.department, survey.averageScore, date].map(cell).join(';'));
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