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
    user: `<svg class="icon" style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    chevronRight: `<svg class="icon" style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18 6-6-6-6"/></svg>`,
    arrowLeft: `<svg class="icon" style="width:24px;height:24px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 18-6-6 6-6"/></svg>`,
    checkCircle: `<svg class="icon" style="width:100%;height:100%" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 4L12 14.01l-3-3"/></svg>`
};

class SurveyApp {
    constructor() {
        this.ratings = {};
        this.currentUser = null;
        this.init();
    }

    init() {
        // Определяем, на какой мы странице по наличию элементов
        const loginForm = document.getElementById('loginForm');
        const surveyContainer = document.getElementById('surveyContainer');

        if (loginForm) {
            this.initLoginPage(loginForm);
        } else if (surveyContainer) {
            this.initMainPage();
        }
    }

    initLoginPage(loginForm) {
        // Если пользователь уже авторизован, кидаем на главную
        if (sessionStorage.getItem('userLoggedIn') === 'true') {
            window.location.href = 'index.html';
            return;
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            
            if (username) {
                // Имитация авторизации
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userData', JSON.stringify({ fullName: username }));
                window.location.href = 'index.html'; // Переход на главную
            }
        });
    }

    initMainPage() {
        // Проверка авторизации
        if (sessionStorage.getItem('userLoggedIn') !== 'true') {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = JSON.parse(sessionStorage.getItem('userData'));
        
        // Кнопка выхода
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
                    <p class="survey-desc">Пройдите ежеквартальный опрос для оценки качества рабочих мест и инфраструктуры.</p>
                    <button class="btn-action" onclick="app.startSurvey()">Начать опрос</button>
                </div>
            `;
        }
    }

    startSurvey() {
        const mainContainer = document.querySelector('main.container');
        if (!mainContainer) return;

        // Генерируем премиальные карточки для каждого вопроса
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

        // Плавно заменяем контент страницы на опрос
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
                    <button class="btn-action" onclick="app.completeSurvey()" style="padding: 16px 32px; font-size: 16px;">Отправить результаты</button>
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
        if (display) {
            display.textContent = value;
        }
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
        
        // Отправка на бэкенд
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
                        <p style="color: #718096; margin-bottom: 40px; font-size: 16px;">Благодарим за ваше время! Ваш средний балл: <strong style="color: #2D3748;">${results.averageScore}/10</strong></p>
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

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurveyApp();
});