const surveyFactors = [
    "Состояние рабочего места", "Обеспеченность ресурсами", "Режим труда",
    "Уровень заработной платы", "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании", "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста", "Организация обучения в компании",
    "Отношение непосредственного руководителя", "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия", "Признание заслуг",
    "Информирование сотрудников"
];

class AdminDashboard {
    constructor() {
        this.surveys = [];
        this.init();
    }

    init() {
        this.setupAuth();
    }

    setupAuth() {
        const loginScreen = document.getElementById('adminLoginScreen');
        const appScreen = document.getElementById('adminApp');
        const loginForm = document.getElementById('adminLoginForm');
        const errorMsg = document.getElementById('loginError');

        // Проверка сессии
        if (sessionStorage.getItem('adminLoggedIn') === 'true') {
            loginScreen.style.display = 'none';
            appScreen.style.display = 'flex';
            this.initializeApp();
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUsername').value;
            const pass = document.getElementById('adminPassword').value;

            // ЗДЕСЬ УКАЗАНЫ ПАРОЛИ
            const validCredentials = {
                'admin': 'admin',
                'root': 'password'
            };

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
        this.renderDashboard();
        this.renderEmployeesTable();
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-target]').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
                document.getElementById(`view-${e.currentTarget.dataset.target}`).classList.add('active');
            });
        });

        document.getElementById('exportBtn').addEventListener('click', () => this.exportToExcel());
    }

    async fetchData() {
        try {
            const response = await fetch('http://212.113.99.102:3000/api/surveys');
            if (response.ok) {
                this.surveys = await response.json();
            }
        } catch (error) {
            console.warn('Сервер недоступен, загружены демо-данные');
        }

        if (!this.surveys || this.surveys.length === 0) {
            this.surveys = [
                { user: { fullName: 'Иванов И.И.', department: 'Дирекция тяги' }, averageScore: 8.5, ratings: {0:8, 1:9, 2:7, 3:8}, timestamp: new Date().toISOString() },
                { user: { fullName: 'Петров П.П.', department: 'Аппарат управления' }, averageScore: 6.2, ratings: {0:6, 1:5, 2:8, 3:4}, timestamp: new Date(Date.now() - 86400000).toISOString() },
                { user: { fullName: 'Сидорова А.В.', department: 'Дирекция тяги' }, averageScore: 9.1, ratings: {0:9, 1:10, 2:8, 3:9}, timestamp: new Date(Date.now() - 172800000).toISOString() },
                { user: { fullName: 'Смирнов В.А.', department: 'Дирекция инфраструктуры' }, averageScore: 4.5, ratings: {0:4, 1:3, 2:5, 3:4}, timestamp: new Date(Date.now() - 259200000).toISOString() }
            ];
        }
    }

    renderDashboard() {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#718096';

        document.getElementById('totalSurveys').textContent = this.surveys.length;
        
        const totalScore = this.surveys.reduce((sum, survey) => sum + parseFloat(survey.averageScore), 0);
        const avgScore = this.surveys.length > 0 ? (totalScore / this.surveys.length).toFixed(1) : 0;
        document.getElementById('avgCompanyScore').textContent = avgScore;

        const promoters = this.surveys.filter(s => s.averageScore >= 9).length;
        const detractors = this.surveys.filter(s => s.averageScore <= 6).length;
        const enps = this.surveys.length > 0 ? Math.round(((promoters - detractors) / this.surveys.length) * 100) : 0;
        
        const enpsEl = document.getElementById('enpsScore');
        enpsEl.textContent = enps > 0 ? `+${enps}` : enps;
        enpsEl.style.color = enps >= 20 ? '#38A169' : (enps > 0 ? '#D69E2E' : '#E21A1A');

        this.calculateAdvancedMetrics();
        this.initTrendChart(avgScore);
        this.initRadarChart();
    }

    calculateAdvancedMetrics() {
        const deptScores = {};
        const factorScores = {};

        this.surveys.forEach(survey => {
            if (!deptScores[survey.user.department]) deptScores[survey.user.department] = { sum: 0, count: 0 };
            deptScores[survey.user.department].sum += parseFloat(survey.averageScore);
            deptScores[survey.user.department].count += 1;

            if (survey.ratings) {
                Object.entries(survey.ratings).forEach(([index, score]) => {
                    if (!factorScores[index]) factorScores[index] = { sum: 0, count: 0 };
                    factorScores[index].sum += parseInt(score);
                    factorScores[index].count += 1;
                });
            }
        });

        let topDept = '-';
        let maxScore = 0;
        for (const [dept, data] of Object.entries(deptScores)) {
            const avg = data.sum / data.count;
            if (avg > maxScore) { maxScore = avg; topDept = dept; }
        }
        document.getElementById('topDepartment').textContent = maxScore > 0 ? `${topDept} (${maxScore.toFixed(1)})` : '-';

        let worstFactor = '-';
        let minFactorScore = 11;
        let hasFactors = false;
        for (const [index, data] of Object.entries(factorScores)) {
            hasFactors = true;
            const avg = data.sum / data.count;
            if (avg < minFactorScore) { 
                minFactorScore = avg; 
                worstFactor = surveyFactors[index] || `Фактор ${index}`; 
            }
        }
        document.getElementById('problemArea').textContent = hasFactors ? `${worstFactor} (${minFactorScore.toFixed(1)})` : '-';
    }

    initTrendChart(currentAvg) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(226, 26, 26, 0.2)');
        gradient.addColorStop(1, 'rgba(226, 26, 26, 0)');

        const trendData = [6.5, 6.8, 7.0, 7.2, parseFloat(currentAvg) - 0.5, parseFloat(currentAvg)];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'],
                datasets: [{
                    data: trendData,
                    borderColor: '#E21A1A',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#E21A1A',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    initRadarChart() {
        const ctx = document.getElementById('radarChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Зарплата', 'Условия труда', 'Руководство', 'Коллектив', 'Карьера', 'Баланс'],
                datasets: [{
                    data: [7.5, 6.8, 8.2, 9.0, 7.1, 6.5],
                    backgroundColor: 'rgba(226, 26, 26, 0.2)',
                    borderColor: '#E21A1A',
                    pointBackgroundColor: '#E21A1A',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0,0,0,0.05)' },
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        pointLabels: { font: { size: 11 }, color: '#2D3748' },
                        ticks: { display: false, min: 0, max: 10 }
                    }
                }
            }
        });
    }

    renderEmployeesTable() {
        const tbody = document.getElementById('employeesTableBody');
        tbody.innerHTML = this.surveys.map(survey => {
            const score = parseFloat(survey.averageScore);
            let badgeClass = 'score-high';
            if (score <= 6) badgeClass = 'score-low';
            else if (score < 9) badgeClass = 'score-medium';

            const date = new Date(survey.timestamp).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
                <tr>
                    <td>${survey.user.fullName}</td>
                    <td>${survey.user.department}</td>
                    <td><span class="score-badge ${badgeClass}">${score.toFixed(1)}</span></td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    }

    exportToExcel() {
        const headers = ['ФИО', 'Подразделение', 'Средний балл', 'Дата прохождения'];
        const csvRows = [headers.join(';')];

        this.surveys.forEach(survey => {
            const date = new Date(survey.timestamp).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            csvRows.push([
                survey.user.fullName,
                survey.user.department,
                survey.averageScore,
                date
            ].join(';'));
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "rzd_survey_results.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminDashboard();
});