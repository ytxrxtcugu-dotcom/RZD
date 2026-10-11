const surveyFactors = [
    "Состояние рабочего места", "Обеспеченность ресурсами", "Режим труда",
    "Уровень заработной платы", "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании", "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста", "Организация обучения в компании",
    "Отношение непосредственного руководителя", "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия", "Признание заслуг",
    "Информирование сотрудников"
];

// SVG Иконки
const ICONS = {
    user: `<svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    chevronRight: `<svg class="icon" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`,
    arrowLeft: `<svg class="icon" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`,
    clipboard: `<svg class="icon" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    checkCircle: `<svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>`,
    close: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`
};

class SurveyApp {
    constructor() {
        this.ratings = {};
        this.currentUser = null;
        this.online = navigator.onLine;
        this.init();
        this.setupOnlineCheck();
    }

    setupOnlineCheck() {
        window.addEventListener('online', () => {
            this.online = true;
            const banner = document.getElementById('offlineBanner');
            if(banner) banner.classList.remove('visible');
        });
        
        window.addEventListener('offline', () => {
            this.online = false;
            this.showOfflineBanner();
        });
    }

    showOfflineBanner() {
        let banner = document.getElementById('offlineBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'offlineBanner';
            banner.className = 'offline-banner';
            banner.textContent = 'Нет подключения к сети. Данные не будут сохранены.';
            document.body.appendChild(banner);
        }
        // Force reflow
        void banner.offsetWidth;
        banner.style.display = 'block';
        setTimeout(() => banner.classList.add('visible'), 10);
    }

    init() {
        // Убираем искусственную задержку в 3 секунды. 
        // Показываем сплеш минимально для отрисовки, затем сразу логику.
        const splashScreen = document.getElementById('splashScreen');
        const mainContent = document.getElementById('mainContent');
        
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainContent.style.display = 'block';
                this.checkLoginStatus();
            }, 150); // Ждем конец CSS-анимации
        }, 500); 
    }

    checkLoginStatus() {
        const userLoggedIn = sessionStorage.getItem('userLoggedIn');
        const userData = sessionStorage.getItem('userData');
        
        if (userLoggedIn === 'true' && userData) {
            this.currentUser = JSON.parse(userData);
            this.renderMenu();
        } else {
            this.renderLoginForm();
        }
    }

    renderLoginForm() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="container">
                <div class="card">
                    <h1>Вход в систему</h1>
                    <p style="margin-bottom: 32px;">Пожалуйста, укажите свои данные для прохождения опроса.</p>
                    
                    <div class="form-group">
                        <label for="fullName">Фамилия Имя Отчество</label>
                        <input type="text" id="fullName" placeholder="Иванов Иван Иванович" autocomplete="name">
                    </div>
                    
                    <div class="form-group">
                        <label>Подразделение</label>
                        <button type="button" class="btn-select" onclick="app.openDepartmentModal()">
                            <span id="selectedDepartmentText" style="color: var(--color-text-muted);">Выберите из списка</span>
                            ${ICONS.chevronRight}
                        </button>
                    </div>
                    
                    <button class="btn" onclick="app.login()">Продолжить</button>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="/login.html" style="color: var(--color-text-muted); text-decoration: none; font-size: 0.75rem;">
                            Вход для администратора
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    openDepartmentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'departmentModal';
        modal.innerHTML = `
            <div class="modal-surface">
                <div class="modal-header">
                    <h2>Подразделение</h2>
                    <button class="btn-ghost" style="padding: 4px; border:none;" onclick="app.closeDepartmentModal()">
                        ${ICONS.close}
                    </button>
                </div>
                <div class="breadcrumbs" id="breadcrumbs"></div>
                <div class="modal-body" id="departmentList"></div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="app.closeDepartmentModal()">Отмена</button>
                    <button class="btn" onclick="app.confirmDepartment()">Выбрать</button>
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
                breadcrumbs.innerHTML += ` <span style="color: var(--color-border)">/</span> <span class="breadcrumb-link" onclick="app.navigateTo(${index})">${item}</span>`;
            });
        } else {
            breadcrumbs.innerHTML = `<span>ОАО «РЖД»</span>`;
        }
        
        let data = rzdStructure;
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
                    itemDiv.innerHTML = `<span>${key}</span> <span style="color: var(--color-text-muted)">${ICONS.chevronRight}</span>`;
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
            textEl.style.color = 'var(--color-text-main)';
            this.selectedDepartment = department;
        }
        this.closeDepartmentModal();
    }

    login() {
        const fullName = document.getElementById('fullName').value.trim();
        const department = this.selectedDepartment;
        
        if (!fullName || !department) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        this.currentUser = { fullName, department };
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.renderMenu();
    }

    renderMenu() {
        const mainContent = document.getElementById('mainContent');
        const isCompleted = sessionStorage.getItem('surveyCompleted') === 'true';
        
        mainContent.innerHTML = `
            <div class="container">
                <div class="menu-header">
                    <div class="user-info">
                        <div class="user-avatar">${ICONS.user}</div>
                        <div>
                            <div style="font-weight: 500;">${this.currentUser.fullName}</div>
                            <p>${this.currentUser.department}</p>
                        </div>
                    </div>
                    <button class="btn-ghost" style="padding: 6px 12px; border-radius: var(--radius-sm);" onclick="app.logout()">Выход</button>
                </div>
                
                <h2 style="margin-bottom: 16px;">Доступные опросы</h2>
                
                <div class="survey-item ${isCompleted ? 'completed' : ''}" onclick="${isCompleted ? '' : 'app.startSurvey()'}">
                    <div class="survey-icon">
                        ${isCompleted ? ICONS.checkCircle : ICONS.clipboard}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; margin-bottom: 4px;">Удовлетворенность условиями труда</div>
                        <p style="margin-bottom: 8px;">Оцените ключевые факторы рабочего процесса</p>
                        <span class="badge ${isCompleted ? 'badge-done' : 'badge-active'}">
                            ${isCompleted ? 'Пройден' : 'Ожидает прохождения'}
                        </span>
                    </div>
                    ${!isCompleted ? `<div style="color: var(--color-border)">${ICONS.chevronRight}</div>` : ''}
                </div>
            </div>
        `;
    }

    logout() {
        sessionStorage.clear();
        this.currentUser = null;
        this.selectedDepartment = null;
        this.renderLoginForm();
    }

    startSurvey() {
        const mainContent = document.getElementById('mainContent');
        
        const factorsHTML = surveyFactors.map((factor, index) => `
            <div class="question-block">
                <div class="question-title">${index + 1}. ${factor}</div>
                <div class="slider-wrapper">
                    <input type="range" min="0" max="10" value="0" step="1"
                           onchange="app.updateRating(${index}, this.value)"
                           oninput="app.updateRatingDisplay(${index}, this.value)">
                    <div class="score-display" id="rating-${index}">0</div>
                </div>
                <div class="slider-labels">
                    <span>Не удовлетворен</span>
                    <span>Полностью удовлетворен</span>
                </div>
            </div>
        `).join('');
        
        mainContent.innerHTML = `
            <div class="container">
                <button class="btn-ghost" style="border:none; padding:0; margin-bottom: 24px; display:inline-flex; align-items:center; gap:4px;" onclick="app.renderMenu()">
                    ${ICONS.arrowLeft} Назад
                </button>
                
                <div class="survey-header">
                    <h1>Анкета сотрудника</h1>
                    <p>Оцените факторы от 0 до 10 баллов.</p>
                </div>
                
                <div class="card" style="padding: 24px;">
                    ${factorsHTML}
                    
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--color-border);">
                        <button class="btn" onclick="app.completeSurvey()">Отправить результаты</button>
                    </div>
                </div>
            </div>
        `;
        this.ratings = {};
    }

    updateRating(index, value) {
        this.ratings[index] = parseInt(value);
        this.updateRatingDisplay(index, value);
    }

    updateRatingDisplay(index, value) {
        const display = document.getElementById(`rating-${index}`);
        if (display) {
            display.textContent = value;
            const val = parseInt(value);
            
            // Строгая, не кричащая семантика цвета
            if (val === 0) {
                display.style.backgroundColor = 'var(--color-bg)';
                display.style.color = 'var(--color-text-main)';
                display.style.borderColor = 'var(--color-border)';
            } else if (val <= 4) {
                display.style.backgroundColor = '#FEF2F2';
                display.style.color = 'var(--color-danger)';
                display.style.borderColor = '#FCA5A5';
            } else if (val <= 7) {
                display.style.backgroundColor = '#FFFBEB';
                display.style.color = 'var(--color-warning)';
                display.style.borderColor = '#FCD34D';
            } else {
                display.style.backgroundColor = '#ECFDF5';
                display.style.color = 'var(--color-success)';
                display.style.borderColor = '#6EE7B7';
            }
        }
    }

    completeSurvey() {
        if (Object.keys(this.ratings).length !== surveyFactors.length) {
            alert('Пожалуйста, проставьте оценку для всех пунктов.');
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
        
        this.saveResults(results);
    }

    async saveResults(results) {
        if (!navigator.onLine) {
            alert('Сбой сети. Проверьте подключение.');
            return;
        }
        try {
            const response = await fetch('https://rzd-survey.duckdns.org/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionStorage.setItem('surveyCompleted', 'true');
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = `
                    <div class="container" style="text-align: center; padding-top: 64px;">
                        <div style="color: var(--color-success); width: 64px; height: 64px; margin: 0 auto 24px;">
                            ${ICONS.checkCircle}
                        </div>
                        <h2>Анкета успешно сохранена</h2>
                        <p style="margin-bottom: 32px;">Благодарим за ваше время. Средний балл: ${results.averageScore}/10</p>
                        <button class="btn" style="width: auto;" onclick="app.renderMenu()">Вернуться на главную</button>
                    </div>
                `;
            } else {
                alert('Сбой при сохранении на сервере.');
            }
        } catch (error) {
            console.error(error);
            alert('Ошибка передачи данных.');
        }
    }
}

const app = new SurveyApp();