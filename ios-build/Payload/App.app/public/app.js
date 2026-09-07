// Массив с факторами опроса из ТЗ
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

class SurveyApp {
    constructor() {
        this.ratings = {};
        this.currentUser = null;
        this.currentPath = [];
        this.selectedDepartmentPath = [];
        this.selectedDepartment = null;
        this.init();
    }

    init() {
        this.showSplashScreen();
    }

    showSplashScreen() {
        const splashScreen = document.getElementById('splashScreen');
        const mainContent = document.getElementById('mainContent');
        
        splashScreen.style.display = 'flex';
        mainContent.style.display = 'none';
        
        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainContent.style.display = 'block';
            this.checkLoginStatus();
        }, 3000);
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
                <div class="login-form-container">
                    <div class="login-form-header">
                        <div class="login-logo-wrapper">
                            <div class="login-logo-circle">
                                <img src="images/RZDlogo.png" alt="РЖД" class="login-logo-img">
                            </div>
                        </div>
                        <h1>Вход для сотрудников</h1>
                        <p>Введите ваши данные для входа в систему</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="fullName">Фамилия, Имя, Отчество:</label>
                        <input type="text" id="fullName" placeholder="Иванов Иван Иванович" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Наименование предприятия:</label>
                        <button type="button" class="btn-select-department" onclick="app.openDepartmentModal()">
                            <span id="selectedDepartmentText">Выберите подразделение</span>
                            <span class="btn-select-arrow">▼</span>
                        </button>
                    </div>
                    
                    <button class="btn" onclick="app.login()">Войти</button>
                    
                    <div class="admin-link">
                        <a href="/login.html">🔐 Вход для администратора</a>
                    </div>
                </div>
            </div>
        `;
    }

    openDepartmentModal() {
        const modal = document.createElement('div');
        modal.className = 'department-modal';
        modal.id = 'departmentModal';
        modal.innerHTML = `
            <div class="department-modal-content">
                <div class="department-modal-header">
                    <h3>Выберите подразделение</h3>
                    <button class="modal-close" onclick="app.closeDepartmentModal()">✕</button>
                </div>
                <div class="department-modal-body">
                    <div class="breadcrumbs" id="breadcrumbs"></div>
                    <div class="department-list" id="departmentList"></div>
                </div>
                <div class="department-modal-footer">
                    <button class="btn-cancel" onclick="app.closeDepartmentModal()">Отмена</button>
                    <button class="btn-confirm" onclick="app.confirmDepartment()">Подтвердить</button>
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
            breadcrumbs.innerHTML = '<span onclick="app.navigateTo(-1)">Главная</span>';
            this.currentPath.forEach((item, index) => {
                breadcrumbs.innerHTML += ` → <span onclick="app.navigateTo(${index})">${item}</span>`;
            });
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
                itemDiv.className = 'department-item';
                
                if (hasChildren) {
                    itemDiv.innerHTML = `
                        <span>${key}</span>
                        <span class="item-arrow">›</span>
                    `;
                    itemDiv.onclick = () => {
                        this.currentPath.push(key);
                        this.selectedDepartmentPath = [];
                        this.renderDepartmentLevel();
                    };
                } else {
                    itemDiv.innerHTML = `
                        <span>${key}</span>
                        <button class="item-select">Выбрать</button>
                    `;
                    itemDiv.querySelector('.item-select').onclick = (e) => {
                        e.stopPropagation();
                        this.selectedDepartmentPath = [...this.currentPath, key];
                        this.highlightSelected(itemDiv);
                    };
                }
                listContainer.appendChild(itemDiv);
            });
        } else if (Array.isArray(data)) {
            data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'department-item';
                itemDiv.innerHTML = `
                    <span>${item}</span>
                    <button class="item-select">Выбрать</button>
                `;
                itemDiv.querySelector('.item-select').onclick = (e) => {
                    e.stopPropagation();
                    this.selectedDepartmentPath = [...this.currentPath, item];
                    this.highlightSelected(itemDiv);
                };
                listContainer.appendChild(itemDiv);
            });
        }
    }

    highlightSelected(element) {
        document.querySelectorAll('.department-item').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
    }

    navigateTo(index) {
        if (index === -1) {
            this.currentPath = [];
        } else {
            this.currentPath = this.currentPath.slice(0, index + 1);
        }
        this.selectedDepartmentPath = [];
        this.renderDepartmentLevel();
    }

    confirmDepartment() {
        if (this.selectedDepartmentPath.length > 0) {
            const department = this.selectedDepartmentPath[this.selectedDepartmentPath.length - 1];
            document.getElementById('selectedDepartmentText').textContent = department;
            this.selectedDepartment = department;
        }
        this.closeDepartmentModal();
    }

    getSelectedDepartment() {
        return this.selectedDepartment;
    }

    login() {
        const fullName = document.getElementById('fullName').value;
        const department = this.getSelectedDepartment();
        
        if (!fullName) {
            alert('Пожалуйста, введите ФИО');
            return;
        }
        
        if (!department) {
            alert('Пожалуйста, выберите предприятие');
            return;
        }
        
        this.currentUser = { fullName, department };
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userData', JSON.stringify(this.currentUser));
        this.renderMenu();
    }

    renderMenu() {
        const mainContent = document.getElementById('mainContent');
        const surveyCompleted = sessionStorage.getItem('surveyCompleted');
        const isCompleted = surveyCompleted === 'true';
        
        mainContent.innerHTML = `
            <div class="container">
                <div class="menu-container">
                    <div class="menu-header">
                        <div class="menu-user-info">
                            <div class="user-avatar">👤</div>
                            <div>
                                <h3>${this.currentUser.fullName}</h3>
                                <p>${this.currentUser.department}</p>
                            </div>
                        </div>
                        <button class="btn-logout" onclick="app.logout()">Выйти</button>
                    </div>
                    
                    <h2 class="menu-title">Доступные опросы</h2>
                    
                    <div class="survey-list">
                        <div class="survey-list-item ${isCompleted ? 'completed' : 'available'}" 
                             onclick="${isCompleted ? '' : 'app.startSurvey()'}">
                            <div class="survey-status-icon">
                                ${isCompleted ? '✅' : '📝'}
                            </div>
                            <div class="survey-info">
                                <h3>Опрос удовлетворенности работой</h3>
                                <p>Оцените вашу удовлетворенность работой в компании ОАО «РЖД»</p>
                                <span class="survey-status ${isCompleted ? 'status-completed' : 'status-available'}">
                                    ${isCompleted ? 'Пройден' : 'Не пройден'}
                                </span>
                            </div>
                            ${!isCompleted ? '<div class="survey-arrow">→</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    logout() {
        sessionStorage.removeItem('userLoggedIn');
        sessionStorage.removeItem('userData');
        this.currentUser = null;
        this.selectedDepartment = null;
        this.renderLoginForm();
    }

    startSurvey() {
        this.renderSurveyForm();
    }

    renderSurveyForm() {
        const mainContent = document.getElementById('mainContent');
        let factorsHTML = '';
        
        surveyFactors.forEach((factor, index) => {
            factorsHTML += `
                <div class="factor-item">
                    <div class="factor-name">${index + 1}. ${factor}</div>
                    <div class="rating-container">
                        <input type="range" class="rating-slider" min="0" max="10" value="0" step="1"
                               onchange="app.updateRating(${index}, this.value)"
                               oninput="app.updateRatingDisplay(${index}, this.value)">
                        <span class="rating-value" id="rating-${index}">0</span>
                    </div>
                    <div class="rating-labels">
                        <span>Совсем не удовлетворен</span>
                        <span>Полностью удовлетворен</span>
                    </div>
                </div>
            `;
        });
        
        mainContent.innerHTML = `
            <div class="container">
                <div class="survey-form">
                    <button class="btn-back" onclick="app.renderMenu()">← Назад</button>
                    
                    <div class="survey-header">
                        <h2>Опрос удовлетворенности работой</h2>
                        <div class="user-info">
                            <p><strong>Работник:</strong> ${this.currentUser.fullName}</p>
                            <p><strong>Предприятие:</strong> ${this.currentUser.department}</p>
                        </div>
                    </div>
                    
                    <p class="question-text">
                        Насколько Вы удовлетворены работой в компании ОАО «РЖД» 
                        (проведите оценку каждого фактора по бальной оценке от 0 до 10, 
                        где 0 – абсолютно не удовлетворен, 10 – полностью удовлетворен)
                    </p>
                    
                    ${factorsHTML}
                    
                    <div class="button-container">
                        <button class="btn" onclick="app.completeSurvey()">Завершить опрос</button>
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
            display.style.backgroundColor = this.getRatingColor(parseInt(value));
        }
    }

    getRatingColor(value) {
        if (value <= 3) return '#ff4444';
        if (value <= 5) return '#ff8800';
        if (value <= 7) return '#ffcc00';
        return '#44bb44';
    }

    completeSurvey() {
        if (Object.keys(this.ratings).length !== surveyFactors.length) {
            alert('Пожалуйста, оцените все факторы перед завершением опроса');
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
        try {
            const response = await fetch('http://212.113.99.102:3000/api/surveys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(results)
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionStorage.setItem('surveyCompleted', 'true');
                
                const mainContent = document.getElementById('mainContent');
                mainContent.innerHTML = `
                    <div class="container">
                        <div class="survey-form completion-message">
                            <div class="completion-icon">✅</div>
                            <h2>Спасибо за участие в опросе!</h2>
                            <p>Ваши ответы успешно сохранены.</p>
                            <p>Средний балл удовлетворенности: <strong>${results.averageScore}/10</strong></p>
                            <button class="btn" onclick="app.renderMenu()">Вернуться в меню</button>
                        </div>
                    </div>
                `;
            } else {
                alert('Ошибка при сохранении результатов');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при отправке данных');
        }
    }
}

const app = new SurveyApp();