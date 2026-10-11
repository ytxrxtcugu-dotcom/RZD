const surveyFactors = [
    "Состояние рабочего места", "Обеспеченность ресурсами", "Режим труда",
    "Уровень заработной платы", "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании", "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста", "Организация обучения в компании",
    "Отношение непосредственного руководителя", "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия", "Признание заслуг",
    "Информирование сотрудников"
];

const ICONS = {
    user: `<svg style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    arrowLeft: `<svg style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6"/></svg>`,
    close: `<svg style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6 6 18M6 6l12 12"/></svg>`,
    checkCircle: `<svg style="width:100%;height:100%" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>`
};

class SurveyApp {
    constructor() {
        this.ratings = {};
        this.currentUser = null;
        this.selectedDepartment = null;
        this.init();
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        const surveyContainer = document.getElementById('surveyContainer');

        if (loginForm) {
            this.initLoginPage(loginForm);
        } else if (surveyContainer) {
            this.initMainPage();
        }
    }

    initLoginPage(loginForm) {
        if (sessionStorage.getItem('userLoggedIn') === 'true') {
            window.location.href = 'index.html';
            return;
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const department = this.selectedDepartment;
            
            if (!department) {
                alert('Пожалуйста, выберите подразделение из списка');
                return;
            }

            if (fullName && department) {
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userData', JSON.stringify({ fullName, department }));
                window.location.href = 'index.html';
            }
        });
    }

    // ================= МОДАЛКА ВЫБОРА ПОДРАЗДЕЛЕНИЯ ================= //
    openDepartmentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'departmentModal';
        modal.innerHTML = `
            <div class="modal-surface">
                <div class="modal-header">
                    <h2>Подразделение</h2>
                    <button class="btn-ghost" style="padding: 4px;" onclick="app.closeDepartmentModal()">
                        ${ICONS.close}
                    </button>
                </div>
                <div class="breadcrumbs" id="breadcrumbs"></div>
                <div class="modal-body" id="departmentList"></div>
                <div class="modal-footer">
                    <button class="btn-ghost" onclick="app.closeDepartmentModal()">Отмена</button>
                    <button class="btn-primary-small" onclick="app.confirmDepartment()">Выбрать</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.currentPath = [];
        this.selectedDepartmentPath = [];
        this.renderDepartmentLevel();
    }

    closeDepartmentModal() {
        const modal = document.getElementById('departmentModal');
        if (modal) modal.remove();
    }

    renderDepartmentLevel() {
        const listContainer = document.getElementById('departmentList');
        const breadcrumbs = document.getElementById('breadcrumbs');
        
        breadcrumbs.innerHTML = '';
        if (this.currentPath.length > 0) {
            breadcrumbs.innerHTML = `<span class="breadcrumb-link" onclick="app.navigateTo(-1)">ОАО «РЖД»</span>`;
            this.currentPath.forEach((item, index) => {
                breadcrumbs.innerHTML += ` <span style="color: var(--text-muted)">/</span> <span class="breadcrumb-link" onclick="app.navigateTo(${index})">${item}</span>`;
            });
        } else {
            breadcrumbs.innerHTML = `<span>ОАО «РЖД»</span>`;
        }
        
        // rzdStructure берется из глобальной области (внешний файл данных)
        let data = typeof rzdStructure !== 'undefined' ? rzdStructure : {};
        for (let i = 0; i < this.currentPath.length; i++) {
            data = data[this.currentPath[i]];
        }
        
        listContainer.innerHTML = '';
        
        if (typeof data === 'object' && !Array.isArray(data)) {
            Object.keys(data).forEach(key => {
                const hasChildren = typeof data[key] === 'object' && Object.keys(data[key]).length > 0;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'list-item';
                
                if (hasChildren) {
                    itemDiv.innerHTML = `<span>${key}</span> <span style="color: var(--text-muted)">${ICONS.chevronRight}</span>`;
                    itemDiv.onclick = () => {
                        this.currentPath.push(key);
                        this.selectedDepartmentPath = [];
                        this.renderDepartmentLevel();
                    };
                } else {
                    itemDiv.innerHTML = `<span>${key}</span>`;
                    itemDiv.onclick = () => {
                        this.selectedDepartmentPath = [...this.currentPath, key];
                        this.highlightSelected(itemDiv);
                    };
                }
                listContainer.appendChild(itemDiv);
            });
        } else if (Array.isArray(data)) {
            data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'list-item';
                itemDiv.innerHTML = `<span>${item}</span>`;
                itemDiv.onclick = () => {
                    this.selectedDepartmentPath = [...this.currentPath, item];
                    this.highlightSelected(itemDiv);
                };
                listContainer.appendChild(itemDiv);
            });
        }
    }

    highlightSelected(element) {
        document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    }

    navigateTo(index) {
        this.currentPath = index === -1 ? [] : this.currentPath.slice(0, index + 1);
        this.selectedDepartmentPath = [];
        this.renderDepartmentLevel();
    }

    confirmDepartment() {
        if (this.selectedDepartmentPath.length > 0) {
            const department = this.selectedDepartmentPath[this.selectedDepartmentPath.length - 1];
            const textEl = document.getElementById('selectedDepartmentText');
            textEl.textContent = department;
            textEl.style.color = 'var(--text-main)';
            this.selectedDepartment = department;
        }
        this.closeDepartmentModal();
    }
    // ================================================================ //

    initMainPage() {
        if (sessionStorage.getItem('userLoggedIn') !== 'true') {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = JSON.parse(sessionStorage.getItem('userData'));
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }

        this.renderDashboard();
    }

    renderDashboard() {
        const container = document.getElementById('surveyContainer');
        if (!container) return;

        const isCompleted = sessionStorage.getItem('surveyCompleted') === 'true';

        if (isCompleted) {
            container.innerHTML = `
                <div class="survey-card" style="border-color: #38A169;">
                    <h3 class="survey-title">Удовлетворенность условиями труда</h3>
                    <p class="survey-desc">Вы уже прошли этот опрос. Спасибо за участие!</p>
                    <div style="color: #38A169; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 20px;">${ICONS.checkCircle}</div> Завершено
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="survey-card">
                    <h3 class="survey-title">Удовлетворенность условиями труда</h3>
                    <p class="survey-desc">Опрос состоит из 14 ключевых факторов оценки рабочих мест и инфраструктуры.</p>
                    <button class="btn-action" onclick="app.startSurvey()">Начать опрос</button>
                </div>
            `;
        }
    }

    startSurvey() {
        const mainContainer = document.querySelector('main.container');
        if (!mainContainer) return;

        const factorsHTML = surveyFactors.map((factor, index) => `
            <div class="survey-card" style="margin-bottom: 20px; padding: 24px;">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 20px; color: #1A202C;">
                    ${index + 1}. ${factor}
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <input type="range" min="0" max="10" value="0" step="1" 
                           style="flex-grow: 1; accent-color: #E21A1A; cursor: pointer;"
                           onchange="app.updateRating(${index}, this.value)"
                           oninput="app.updateRatingDisplay(${index}, this.value)">
                    <div id="rating-${index}" style="font-size: 24px; font-weight: 700; color: #E21A1A; min-width: 40px; text-align: center;">0</div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px; color: #718096; margin-top: 12px; font-weight: 500;">
                    <span>Не удовлетворен</span>
                    <span>Полностью удовлетворен</span>
                </div>
            </div>
        `).join('');

        mainContainer.style.opacity = '0';
        
        setTimeout(() => {
            mainContainer.innerHTML = `
                <div style="margin-bottom: 32px;">
                    <button class="btn-ghost" onclick="window.location.reload()" style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px;">
                        ${ICONS.arrowLeft} Назад
                    </button>
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; color: #1A202C;">Оценка факторов</h2>
                    <p style="color: #718096; margin: 0; font-size: 15px;">Оцените каждый пункт от 0 до 10 баллов.</p>
                </div>
                ${factorsHTML}
                <div style="margin-top: 40px; text-align: left;">
                    <button class="btn-action" onclick="app.completeSurvey()" style="padding: 16px 32px; font-size: 16px;">Закончить опрос</button>
                </div>
            `;
            mainContainer.style.transition = 'opacity 0.3s ease';
            mainContainer.style.opacity = '1';
        }, 150);

        this.ratings = {};
    }

    updateRating(index, value) {
        this.ratings[index] = parseInt(value);
    }

    updateRatingDisplay(index, value) {
        const display = document.getElementById(`rating-${index}`);
        if (display) display.textContent = value;
    }

    async completeSurvey() {
        if (Object.keys(this.ratings).length !== surveyFactors.length) {
            alert('Пожалуйста, оцените все пункты перед отправкой.');
            return;
        }
        
        const totalScore = Object.values(this.ratings).reduce((a, b) => a + b, 0);
        const averageScore = (totalScore / surveyFactors.length).toFixed(1);
        
        const results = {
            user: this.currentUser,
            ratings: this.ratings,
            averageScore: averageScore,
            timestamp: new Date().toISOString()
        };
        
        try {
            const response = await fetch('http://212.113.99.102:3000/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });
            
            if (response.ok) {
                sessionStorage.setItem('surveyCompleted', 'true');
                const mainContainer = document.querySelector('main.container');
                
                mainContainer.innerHTML = `
                    <div class="survey-card" style="text-align: center; padding: 80px 24px;">
                        <div style="color: #38A169; width: 80px; height: 80px; margin: 0 auto 24px;">
                            ${ICONS.checkCircle}
                        </div>
                        <h2 style="color: #1A202C; margin-bottom: 16px; font-size: 24px;">Анкета успешно сохранена</h2>
                        <p style="color: #718096; margin-bottom: 40px; font-size: 16px;">Сотрудник: <b>${this.currentUser.fullName}</b><br>Ваш средний балл: <strong style="color: #2D3748;">${results.averageScore}/10</strong></p>
                        <button class="btn-ghost" onclick="window.location.reload()" style="padding: 12px 24px;">Вернуться на главную</button>
                    </div>
                `;
            } else {
                alert('Ошибка при сохранении данных на сервере.');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Сбой сети. Проверьте подключение.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurveyApp();
});