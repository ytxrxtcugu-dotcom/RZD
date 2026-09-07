// Массив с факторами опроса
const surveyFactors = [
    "Состояние рабочего места",
    "Обеспеченность ресурсами",
    "Режим труда",
    "Уровень заработной платы",
    "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании",
    "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста",
    "Организация обучения в компании",
    "Отношение непосредственного руководителя",
    "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия",
    "Признание заслуг",
    "Информирование сотрудников"
];

function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn !== 'true') {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminUsername');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminPath');
    window.location.href = '/login.html';
}

function exportData() {
    fetch('http://212.113.99.102:3000/api/surveys')
        .then(response => response.json())
        .then(surveys => {
            const role = sessionStorage.getItem('adminRole');
            const adminPath = JSON.parse(sessionStorage.getItem('adminPath') || '[]');
            let filteredSurveys = surveys;
            
            if (role !== 'superadmin' && adminPath.length > 0) {
                const adminDept = adminPath[adminPath.length - 1];
                filteredSurveys = surveys.filter(s => s.user.department === adminDept);
            }
            
            const dataStr = JSON.stringify(filteredSurveys, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', 'surveys_export.json');
            linkElement.click();
        })
        .catch(error => {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка при экспорте данных');
        });
}

class AdminPanel {
    constructor() {
        this.surveys = [];
        this.factorsChart = null;
        this.trendChart = null;
        this.init();
    }

    async init() {
        if (!checkAdminAuth()) {
            return;
        }
        
        this.displayAdminInfo();
        
        await this.loadSurveys();
        this.renderMetrics();
        this.renderDangerZones();
        this.renderSurveysTable();
        this.renderCharts();
    }

    displayAdminInfo() {
        const role = sessionStorage.getItem('adminRole');
        const adminPath = JSON.parse(sessionStorage.getItem('adminPath') || '[]');
        const roleText = document.getElementById('adminRoleText');
        
        if (roleText) {
            if (role === 'superadmin') {
                roleText.textContent = 'Супер-администратор — видит все подразделения';
            } else {
                const deptName = adminPath[adminPath.length - 1] || '';
                const roleNames = {
                    'filial': 'Директор филиала',
                    'director': 'Руководитель дирекции',
                    'linear': 'Начальник линейного отдела',
                    'local': 'Начальник подразделения'
                };
                roleText.textContent = `${roleNames[role] || 'Администратор'}: ${deptName}`;
            }
        }
    }

    async loadSurveys() {
        try {
            const response = await fetch('http://212.113.99.102:3000/api/surveys');
            let surveys = await response.json();
            
            const role = sessionStorage.getItem('adminRole');
            const adminPath = JSON.parse(sessionStorage.getItem('adminPath') || '[]');
            
            if (role === 'superadmin' || adminPath.length === 0) {
                this.surveys = surveys;
                return;
            }
            
            const adminDept = adminPath[adminPath.length - 1];
            
            // Видит только опросы своего уровня
            this.surveys = surveys.filter(survey => {
                return survey.user.department === adminDept;
            });
        } catch (error) {
            console.error('Ошибка загрузки опросов:', error);
            this.surveys = [];
        }
    }

    renderMetrics() {
        const totalSurveys = this.surveys.length;
        
        if (totalSurveys === 0) {
            document.getElementById('totalSurveys').textContent = '0';
            document.getElementById('averageScore').textContent = '0/10';
            document.getElementById('dangerZonesCount').textContent = '0';
            document.getElementById('satisfactionPercent').textContent = '0%';
            return;
        }

        const averageScore = (this.surveys.reduce((sum, s) => sum + parseFloat(s.averageScore), 0) / totalSurveys).toFixed(1);
        
        const factorAverages = {};
        surveyFactors.forEach((factor, index) => {
            const scores = this.surveys.map(s => s.ratings[index]);
            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            factorAverages[index] = parseFloat(avg);
        });
        
        const dangerZonesCount = Object.values(factorAverages).filter(score => score < 5).length;
        const satisfactionPercent = Math.round((parseFloat(averageScore) / 10) * 100);
        
        document.getElementById('totalSurveys').textContent = totalSurveys;
        document.getElementById('averageScore').textContent = `${averageScore}/10`;
        document.getElementById('dangerZonesCount').textContent = dangerZonesCount;
        document.getElementById('satisfactionPercent').textContent = `${satisfactionPercent}%`;
    }

    renderDangerZones() {
        const dangerZonesList = document.getElementById('dangerZonesList');
        const dangerZonesSection = document.getElementById('dangerZonesSection');
        
        if (this.surveys.length === 0) {
            dangerZonesSection.style.display = 'none';
            return;
        }

        const factorAverages = {};
        surveyFactors.forEach((factor, index) => {
            const scores = this.surveys.map(s => s.ratings[index]);
            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            factorAverages[index] = parseFloat(avg);
        });

        const dangerZones = Object.keys(factorAverages).filter(index => factorAverages[index] < 5);
        
        if (dangerZones.length === 0) {
            dangerZonesSection.style.display = 'none';
            return;
        }
        
        dangerZonesSection.style.display = 'block';
        dangerZonesList.innerHTML = dangerZones.map(index => `
            <div class="danger-zone-item">
                <span class="factor-name">${surveyFactors[index]}</span>
                <span class="factor-score">${factorAverages[index]}/10</span>
            </div>
        `).join('');
    }

    renderSurveysTable() {
        const tableBody = document.getElementById('surveysTableBody');
        
        if (this.surveys.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px;">
                        Нет проведенных опросов
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.surveys.map((survey, index) => {
            const score = parseFloat(survey.averageScore);
            let scoreClass = 'good';
            if (score < 5) scoreClass = 'bad';
            else if (score < 7) scoreClass = 'medium';
            
            return `
                <tr>
                    <td><strong>${survey.user.fullName}</strong></td>
                    <td>${survey.user.department}</td>
                    <td><span class="score-badge ${scoreClass}">${survey.averageScore}/10</span></td>
                    <td>${new Date(survey.timestamp).toLocaleDateString('ru-RU')}</td>
                    <td>
                        <button class="btn-view" onclick="adminPanel.showSurveyDetails(${index})">
                            👁 Просмотр
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderCharts() {
        if (this.surveys.length === 0) return;
        
        this.renderFactorsChart();
        this.renderTrendChart();
    }

    renderFactorsChart() {
        const ctx = document.getElementById('factorsChart').getContext('2d');
        
        const factorAverages = surveyFactors.map((factor, index) => {
            const scores = this.surveys.map(s => s.ratings[index]);
            return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        });

        if (this.factorsChart) {
            this.factorsChart.destroy();
        }

        this.factorsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: surveyFactors,
                datasets: [{
                    label: 'Средняя оценка',
                    data: factorAverages,
                    backgroundColor: factorAverages.map(score => 
                        score < 5 ? '#F44336' : 
                        score < 7 ? '#FF9800' : '#4CAF50'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 10,
                        title: { display: true, text: 'Баллы' }
                    }
                }
            }
        });
    }

    renderTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        const sortedSurveys = [...this.surveys].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        const labels = sortedSurveys.map(s => 
            new Date(s.timestamp).toLocaleDateString('ru-RU')
        );
        const scores = sortedSurveys.map(s => parseFloat(s.averageScore));

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Средний балл',
                    data: scores,
                    borderColor: '#E21A1A',
                    backgroundColor: 'rgba(226, 26, 26, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: scores.map(score => 
                        score < 5 ? '#F44336' : 
                        score < 7 ? '#FF9800' : '#4CAF50'
                    ),
                    pointRadius: 8,
                    pointHoverRadius: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 10,
                        title: { display: true, text: 'Баллы' }
                    }
                }
            }
        });
    }

    showSurveyDetails(index) {
        const survey = this.surveys[index];
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>📋 Детали опроса</h2>
                
                <div class="modal-header-info">
                    <p><strong>👤 Работник:</strong> ${survey.user.fullName}</p>
                    <p><strong>🏢 Предприятие:</strong> ${survey.user.department}</p>
                    <p><strong>📅 Дата:</strong> ${new Date(survey.timestamp).toLocaleString('ru-RU')}</p>
                    <p><strong>⭐ Средний балл:</strong> ${survey.averageScore}/10</p>
                </div>
                
                <h3>Оценки по факторам:</h3>
                <div class="factors-details">
                    ${surveyFactors.map((factor, i) => {
                        const score = survey.ratings[i];
                        const isDanger = score < 5;
                        const isMedium = score >= 5 && score < 7;
                        
                        return `
                            <div class="factor-detail ${isDanger ? 'danger' : isMedium ? 'medium' : 'good'}">
                                <span>${factor}</span>
                                <strong>${score}/10</strong>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <button class="btn-close" onclick="this.closest('.modal').remove()">
                    Закрыть
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

const adminPanel = new AdminPanel();