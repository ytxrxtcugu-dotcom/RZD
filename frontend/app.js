const SURVEY_API = 'http://212.113.99.102:3000/api/surveys';

const surveyFactors = [
    "Состояние рабочего места", "Обеспеченность ресурсами", "Режим труда",
    "Уровень заработной платы", "Зависимость оплаты труда от результатов работы",
    "Социальный пакет от компании", "Соблюдение работодателем социальных гарантий",
    "Возможности карьерного роста", "Организация обучения в компании",
    "Отношение непосредственного руководителя", "Атмосфера в коллективе, отношения с коллегами",
    "Корпоративные культурно-массовые и спортивные мероприятия", "Признание заслуг",
    "Информирование сотрудников"
];

const SVG_ATTR = 'class="icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"';
const ICONS = {
    arrowLeft: `<svg ${SVG_ATTR}><path d="m15 18-6-6 6-6"/></svg>`,
    arrowRight: `<svg ${SVG_ATTR}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
    chevronRight: `<svg ${SVG_ATTR}><path d="m9 18 6-6-6-6"/></svg>`,
    close: `<svg ${SVG_ATTR}><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    checkCircle: `<svg class="icon icon--fill" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m7.8 12.4 2.9 2.9 5.6-6.3"/></svg>`
};

const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));

class SurveyApp {
    constructor() {
        this.ratings = {};
        this.currentUser = null;
        this.selectedDepartment = null;
        this.confirmedPath = [];
        this.currentPath = [];
        this.selectedDepartmentPath = [];
        this.searchQuery = '';
        this.lastFocus = null;
        this._onKey = null;
        this.init();
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        const surveyContainer = document.getElementById('surveyContainer');
        if (loginForm) this.initLoginPage(loginForm);
        else if (surveyContainer) this.initMainPage();
    }

    showToast(message) {
        document.querySelector('.toast')?.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('is-leaving'), 3200);
        setTimeout(() => toast.remove(), 3600);
    }

    // ================= СТРАНИЦА ВХОДА ================= //
    initLoginPage(loginForm) {
        if (sessionStorage.getItem('userLoggedIn') === 'true') {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('departmentTrigger')
            .addEventListener('click', () => this.openDepartmentModal());

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const department = this.selectedDepartment;

            if (!department) {
                this.showToast('Пожалуйста, выберите подразделение из списка');
                document.getElementById('departmentTrigger').focus();
                return;
            }
            if (fullName) {
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('userData', JSON.stringify({
                    fullName,
                    department,
                    departmentPath: this.confirmedPath.join(' / ')
                }));
                window.location.href = 'index.html';
            }
        });
    }

    // ================= МОДАЛКА ВЫБОРА ПОДРАЗДЕЛЕНИЯ ================= //
    openDepartmentModal() {
        if (document.getElementById('departmentModal')) return;
        this.lastFocus = document.activeElement;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'departmentModal';
        modal.innerHTML = `
            <div class="modal-surface" role="dialog" aria-modal="true" aria-labelledby="departmentModalTitle" tabindex="-1">
                <div class="modal-header">
                    <h2 id="departmentModalTitle">Подразделение</h2>
                    <button type="button" class="icon-btn" data-action="close" aria-label="Закрыть">${ICONS.close}</button>
                </div>
                <div class="modal-search">
                    <input type="search" id="departmentSearch" placeholder="Поиск на этом уровне" aria-label="Поиск на этом уровне" autocomplete="off">
                </div>
                <nav class="breadcrumbs" id="breadcrumbs" aria-label="Путь по структуре"></nav>
                <div class="modal-body" id="departmentList"></div>
                <div class="modal-footer">
                    <button type="button" class="btn-ghost" data-action="close">Отмена</button>
                    <button type="button" class="btn-primary-small" id="departmentConfirm" disabled>Выбрать</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.body.classList.add('is-locked');

        this.currentPath = [];
        this.selectedDepartmentPath = [];
        this.searchQuery = '';

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('[data-action="close"]')) this.closeDepartmentModal();
        });
        modal.querySelector('#departmentConfirm').addEventListener('click', () => this.confirmDepartment());
        modal.querySelector('#departmentSearch').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim().toLowerCase();
            this.renderDepartmentLevel();
        });

        this._onKey = (e) => {
            if (e.key === 'Escape') { this.closeDepartmentModal(); return; }
            if (e.key === 'Tab') this.trapFocus(e, modal);
        };
        document.addEventListener('keydown', this._onKey);

        this.renderDepartmentLevel();
        modal.querySelector('.modal-surface').focus();
    }

    closeDepartmentModal() {
        document.getElementById('departmentModal')?.remove();
        document.body.classList.remove('is-locked');
        if (this._onKey) document.removeEventListener('keydown', this._onKey);
        this._onKey = null;
        if (this.lastFocus && typeof this.lastFocus.focus === 'function') this.lastFocus.focus();
    }

    trapFocus(e, modal) {
        const nodes = [...modal.querySelectorAll('button:not([disabled]), input')];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    getLevelEntries() {
        // rzdStructure берётся из departments.js
        let data = typeof rzdStructure !== 'undefined' ? rzdStructure : {};
        for (const key of this.currentPath) data = data[key];
        if (Array.isArray(data)) return data.map((label) => ({ label, hasChildren: false }));
        return Object.keys(data).map((label) => ({
            label,
            hasChildren: typeof data[label] === 'object' && data[label] !== null && Object.keys(data[label]).length > 0
        }));
    }

    renderDepartmentLevel() {
        const list = document.getElementById('departmentList');
        const crumbs = document.getElementById('breadcrumbs');
        if (!list || !crumbs) return;

        crumbs.replaceChildren();
        const makeCrumb = (text, index) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'breadcrumb-link';
            b.textContent = text;
            b.addEventListener('click', () => this.navigateTo(index));
            return b;
        };
        const sep = () => {
            const s = document.createElement('span');
            s.className = 'breadcrumbs__sep';
            s.textContent = '/';
            s.setAttribute('aria-hidden', 'true');
            return s;
        };
        crumbs.appendChild(makeCrumb('ОАО «РЖД»', -1));
        this.currentPath.forEach((item, index) => { crumbs.appendChild(sep()); crumbs.appendChild(makeCrumb(item, index)); });

        const q = this.searchQuery;
        const entries = this.getLevelEntries().filter((e) => !q || e.label.toLowerCase().includes(q));
        list.replaceChildren();

        if (!entries.length) {
            const p = document.createElement('p');
            p.className = 'modal-empty';
            p.textContent = 'Ничего не найдено';
            list.appendChild(p);
        }

        const selectedKey = this.selectedDepartmentPath.join('\u0001');
        entries.forEach((entry) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'list-item';
            const label = document.createElement('span');
            label.textContent = entry.label;
            btn.appendChild(label);

            if (entry.hasChildren) {
                const chev = document.createElement('span');
                chev.className = 'list-item__chevron';
                chev.innerHTML = ICONS.chevronRight;
                btn.appendChild(chev);
                btn.addEventListener('click', () => {
                    this.currentPath.push(entry.label);
                    this.selectedDepartmentPath = [];
                    this.resetSearch();
                    this.renderDepartmentLevel();
                    list.scrollTop = 0;
                });
            } else {
                const path = [...this.currentPath, entry.label];
                if (path.join('\u0001') === selectedKey) btn.classList.add('selected');
                btn.addEventListener('click', () => {
                    this.selectedDepartmentPath = path;
                    this.highlightSelected(btn);
                });
            }
            list.appendChild(btn);
        });
        this.updateConfirmState();
    }

    resetSearch() {
        this.searchQuery = '';
        const input = document.getElementById('departmentSearch');
        if (input) input.value = '';
    }

    highlightSelected(element) {
        document.querySelectorAll('#departmentList .list-item').forEach((el) => el.classList.remove('selected'));
        element.classList.add('selected');
        this.updateConfirmState();
    }

    updateConfirmState() {
        const btn = document.getElementById('departmentConfirm');
        if (btn) btn.disabled = this.selectedDepartmentPath.length === 0;
    }

    navigateTo(index) {
        this.currentPath = index === -1 ? [] : this.currentPath.slice(0, index + 1);
        this.selectedDepartmentPath = [];
        this.resetSearch();
        this.renderDepartmentLevel();
    }

    confirmDepartment() {
        if (this.selectedDepartmentPath.length > 0) {
            const department = this.selectedDepartmentPath[this.selectedDepartmentPath.length - 1];
            const textEl = document.getElementById('selectedDepartmentText');
            textEl.textContent = department;
            textEl.classList.remove('is-placeholder');
            this.selectedDepartment = department;
            this.confirmedPath = [...this.selectedDepartmentPath];
        }
        this.closeDepartmentModal();
    }

    // ================= ГЛАВНАЯ СТРАНИЦА ================= //
    initMainPage() {
        if (sessionStorage.getItem('userLoggedIn') !== 'true') {
            window.location.href = 'login.html';
            return;
        }
        try { this.currentUser = JSON.parse(sessionStorage.getItem('userData')); }
        catch { this.currentUser = null; }
        if (!this.currentUser || !this.currentUser.fullName) {
            sessionStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'login.html';
        });

        this.renderUser();
        this.renderDashboard();
    }

    renderUser() {
        const { fullName, departmentPath, department } = this.currentUser;
        const parts = fullName.split(/\s+/).filter(Boolean);
        const given = parts.length >= 2 ? parts.slice(1).join(' ') : fullName;
        const initials = parts.slice(0, 2).map((w) => w[0].toUpperCase()).join('');

        document.getElementById('userName').textContent = fullName;
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('userChip').hidden = false;
        document.getElementById('heroTitle').textContent = `Здравствуйте, ${given}`;
        document.getElementById('heroDept').textContent = departmentPath || department || '';
    }

    renderDashboard() {
        const container = document.getElementById('surveyContainer');
        if (!container) return;
        container.className = 'survey-grid';
        const isCompleted = sessionStorage.getItem('surveyCompleted') === 'true';

        if (isCompleted) {
            container.innerHTML = `
                <article class="survey-card survey-card--done">
                    <span class="status-pill status-pill--done">Завершено</span>
                    <h3 class="survey-title">Удовлетворенность условиями труда</h3>
                    <p class="survey-desc">Вы уже прошли этот опрос. Спасибо за участие!</p>
                </article>`;
        } else {
            container.innerHTML = `
                <article class="survey-card">
                    <span class="status-pill">Доступен</span>
                    <h3 class="survey-title">Удовлетворенность условиями труда</h3>
                    <p class="survey-desc">Опрос состоит из 14 ключевых факторов оценки рабочих мест и инфраструктуры.</p>
                    <button type="button" class="btn-action" id="startSurveyBtn">Начать опрос ${ICONS.arrowRight}</button>
                </article>`;
            document.getElementById('startSurveyBtn').addEventListener('click', () => this.startSurvey());
        }
    }

    showHome() {
        document.getElementById('hero').hidden = false;
        this.renderDashboard();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startSurvey() {
        const container = document.getElementById('surveyContainer');
        document.getElementById('hero').hidden = true;
        container.className = '';
        this.ratings = {};

        const factorsHTML = surveyFactors.map((factor, index) => `
            <article class="factor" data-index="${index}">
                <div class="factor__head">
                    <span class="factor__num">${String(index + 1).padStart(2, '0')}</span>
                    <h3 class="factor__title" id="factor-title-${index}">${esc(factor)}</h3>
                </div>
                <div class="factor__control">
                    <input class="slider" type="range" min="0" max="10" value="0" step="1"
                           data-index="${index}" aria-labelledby="factor-title-${index}">
                    <output class="factor__value" id="rating-${index}" aria-live="off">—</output>
                </div>
                <div class="factor__scale"><span>Не удовлетворен</span><span>Полностью удовлетворен</span></div>
            </article>`).join('');

        container.innerHTML = `
            <div class="survey-view">
                <button type="button" class="btn-ghost" id="backBtn">${ICONS.arrowLeft} Назад</button>
                <h1 class="survey-view__title">Оценка факторов</h1>
                <p class="survey-view__lead">Оцените каждый пункт от 0 до 10 баллов.</p>

                <div class="survey-bar">
                    <span class="survey-bar__label" id="progressLabel">Оценено 0 из ${surveyFactors.length}</span>
                    <div class="progress" id="progress" role="progressbar" aria-label="Прогресс опроса"
                         aria-valuemin="0" aria-valuemax="${surveyFactors.length}" aria-valuenow="0">
                        <div class="progress__fill" id="progressFill"></div>
                    </div>
                </div>

                ${factorsHTML}

                <div class="survey-actions">
                    <button type="button" class="btn-action" id="finishBtn">Закончить опрос</button>
                </div>
            </div>`;

        document.getElementById('backBtn').addEventListener('click', () => this.showHome());
        document.getElementById('finishBtn').addEventListener('click', () => this.completeSurvey());
        container.querySelectorAll('.slider').forEach((slider) => {
            const handler = () => this.handleSlider(slider);
            ['input', 'change', 'click'].forEach((ev) => slider.addEventListener(ev, handler));
        });
        window.scrollTo({ top: 0 });
    }

    handleSlider(slider) {
        const index = Number(slider.dataset.index);
        const value = slider.value;
        this.updateRating(index, value);
        this.updateRatingDisplay(index, value);
        slider.style.setProperty('--pct', `${Number(value) * 10}%`);
        const card = slider.closest('.factor');
        card.classList.add('is-rated');
        card.classList.remove('is-missing');
        this.updateProgress();
    }

    updateRating(index, value) { this.ratings[index] = parseInt(value, 10); }

    updateRatingDisplay(index, value) {
        const display = document.getElementById(`rating-${index}`);
        if (display) display.textContent = value;
    }

    updateProgress() {
        const done = Object.keys(this.ratings).length;
        const total = surveyFactors.length;
        document.getElementById('progressLabel').textContent = `Оценено ${done} из ${total}`;
        document.getElementById('progressFill').style.width = `${(done / total) * 100}%`;
        document.getElementById('progress').setAttribute('aria-valuenow', String(done));
    }

    async completeSurvey() {
        const unrated = surveyFactors.map((_, i) => i).filter((i) => !(i in this.ratings));
        if (unrated.length) {
            unrated.forEach((i) => document.querySelector(`.factor[data-index="${i}"]`)?.classList.add('is-missing'));
            document.querySelector(`.factor[data-index="${unrated[0]}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.showToast('Пожалуйста, оцените все пункты перед отправкой');
            return;
        }

        const totalScore = Object.values(this.ratings).reduce((a, b) => a + b, 0);
        const averageScore = (totalScore / surveyFactors.length).toFixed(1);
        const results = {
            user: this.currentUser,
            ratings: this.ratings,
            averageScore,
            timestamp: new Date().toISOString()
        };

        const btn = document.getElementById('finishBtn');
        btn.disabled = true;
        try {
            const response = await fetch(SURVEY_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            sessionStorage.setItem('surveyCompleted', 'true');
            document.getElementById('surveyContainer').innerHTML = `
                <div class="result">
                    <div class="result__icon">${ICONS.checkCircle}</div>
                    <h1 class="result__title">Анкета успешно сохранена</h1>
                    <p class="result__who">Сотрудник: <b>${esc(this.currentUser.fullName)}</b></p>
                    <p class="result__score">${esc(averageScore)}<small> / 10</small></p>
                    <button type="button" class="btn-ghost" id="homeBtn">Вернуться на главную</button>
                </div>`;
            document.getElementById('homeBtn').addEventListener('click', () => this.showHome());
            window.scrollTo({ top: 0 });
        } catch (error) {
            console.error('Ошибка:', error);
            this.showToast('Не удалось сохранить анкету. Проверьте подключение и повторите.');
            btn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurveyApp();
});