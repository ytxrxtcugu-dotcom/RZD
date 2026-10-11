const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const SCOPES = require('./scopes');

const app = express();
const PORT = process.env.PORT || 3000;
const SEP = ' / ';
const FACTORS_COUNT = 14;

app.set('trust proxy', 1);
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

app.use(cors());
app.use(express.json({ limit: '50kb' }));

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
    message: { success: false, message: 'Слишком много попыток входа. Попробуйте через 15 минут.' }
});
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 200,
    message: { success: false, message: 'Слишком много запросов с вашего IP.' }
});

const DATA_FILE = path.join(__dirname, 'surveys.json');
const LOG_FILE = path.join(__dirname, 'login_attempts.log');
const CREDENTIALS_FILE = process.env.CREDENTIALS_FILE || path.join(__dirname, 'credentials.txt');

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

// ---------- Учётные данные (из файла, вне git) ----------
function loadCredentials() {
    let text;
    try { text = fs.readFileSync(CREDENTIALS_FILE, 'utf8'); }
    catch (e) {
        console.error(`Не найден файл с паролями: ${CREDENTIALS_FILE}`);
        process.exit(1);
    }
    const map = new Map();
    const re = /логин:\s*(\w+)[\s/]*пароль:\s*(\S+)/gi;
    let m;
    while ((m = re.exec(text))) {
        if (!Object.prototype.hasOwnProperty.call(SCOPES, m[1])) {
            console.warn(`Логин «${m[1]}» отсутствует в scopes.js, пропущен`);
            continue;
        }
        map.set(m[1], sha(m[2]));
    }
    if (!map.size) { console.error('В файле паролей не найдено ни одной пары'); process.exit(1); }
    console.log(`Загружено администраторов: ${map.size}`);
    return map;
}
const ADMINS = loadCredentials();

// ---------- Структура подразделений (из departments.js) ----------
function loadStructure() {
    const code = fs.readFileSync(path.join(frontendPath, 'departments.js'), 'utf8');
    return vm.runInNewContext(code + '\n;rzdStructure', {});
}
const PATH_MAP = new Map();   // "путь / листа" -> название листа
const LEAF_INDEX = new Map(); // название листа -> [полные пути]

(function buildIndex() {
    const addLeaf = (pathArr, name) => {
        const full = [...pathArr, name].join(SEP);
        PATH_MAP.set(full, name);
        if (!LEAF_INDEX.has(name)) LEAF_INDEX.set(name, []);
        LEAF_INDEX.get(name).push(full);
    };
    const walk = (node, pathArr) => {
        if (Array.isArray(node)) { node.forEach((name) => addLeaf(pathArr, name)); return; }
        for (const key of Object.keys(node)) {
            const child = node[key];
            const hasChildren = typeof child === 'object' && child !== null && Object.keys(child).length > 0;
            if (hasChildren) walk(child, [...pathArr, key]); else addLeaf(pathArr, key);
        }
    };
    walk(loadStructure(), []);
    console.log(`Подразделений в структуре: ${PATH_MAP.size}`);
})();

// ---------- Утилиты ----------
function logAttempt(username, success, ip) {
    const line = `${new Date().toISOString()} | User: ${String(username).slice(0, 64)} | Status: ${success ? 'SUCCESS' : 'FAILED'} | IP: ${ip}\n`;
    try { fs.appendFileSync(LOG_FILE, line); } catch (e) { console.error('Ошибка записи лога:', e); }
}

function readSurveys() {
    try {
        if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) { console.error('Ошибка чтения surveys.json:', e); }
    return [];
}
function writeSurveys(surveys) {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(surveys, null, 2), 'utf8');
    fs.renameSync(tmp, DATA_FILE);
}

function inScope(survey, scope) {
    // Пустая область зарезервирована только для супер-администратора.
    if (!Array.isArray(scope) || scope.length === 0) return true;

    // Строгая изоляция: совпадает только точный путь подразделения.
    // Родительские подразделения НЕ получают анкеты дочерних подразделений.
    const allowedPath = scope.join(SEP);
    const u = survey.user || {};

    if (typeof u.departmentPath === 'string' && u.departmentPath) {
        return u.departmentPath.trim() === allowedPath;
    }

    // Старые анкеты без departmentPath: допускаем только точное совпадение
    // полного пути, восстановленного из уникального названия листа.
    // Не ищем совпадения по префиксу и не угадываем неоднозначные пути.
    const candidates = LEAF_INDEX.get(u.department) || [];
    const exactMatches = candidates.filter((candidate) => candidate === allowedPath);
    return exactMatches.length === 1;
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!ADMINS.has(payload.username)) throw new Error('unknown user');
        req.admin = { username: payload.username, scope: SCOPES[payload.username] };
        next();
    } catch (e) {
        res.status(401).json({ success: false, message: 'Требуется авторизация' });
    }
}

// ---------- API ----------
app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    const ip = req.ip || req.connection.remoteAddress;
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ success: false, message: 'Укажите логин и пароль' });
    }
    const login = username.trim();
    const stored = ADMINS.get(login);
    const ok = stored && crypto.timingSafeEqual(stored, sha(password));
    logAttempt(login, !!ok, ip);
    if (!ok) return res.status(401).json({ success: false, message: 'Неверный логин или пароль' });

    const token = jwt.sign({ username: login }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, username: login, token, scope: SCOPES[login] });
});

app.post('/api/surveys', apiLimiter, (req, res) => {
    const b = req.body || {};
    const u = b.user || {};
    const bad = (message) => res.status(400).json({ success: false, message });

    const fullName = typeof u.fullName === 'string' ? u.fullName.trim() : '';
    const department = typeof u.department === 'string' ? u.department.trim() : '';
    if (!fullName || fullName.length > 200) return bad('Некорректное ФИО');
    if (!department || department.length > 300) return bad('Некорректное подразделение');

    let departmentPath;
    if (u.departmentPath) {
        if (typeof u.departmentPath !== 'string' || PATH_MAP.get(u.departmentPath) !== department) {
            return bad('Некорректное подразделение');
        }
        departmentPath = u.departmentPath;
    }

    const ratings = {};
    let total = 0;
    for (let i = 0; i < FACTORS_COUNT; i++) {
        const v = b.ratings ? b.ratings[i] : undefined;
        if (!Number.isInteger(v) || v < 0 || v > 10) return bad('Некорректные оценки');
        ratings[i] = v;
        total += v;
    }

    const record = {
        user: departmentPath ? { fullName, department, departmentPath } : { fullName, department },
        ratings,
        averageScore: (total / FACTORS_COUNT).toFixed(1),
        timestamp: new Date().toISOString()
    };
    const surveys = readSurveys();
    surveys.push(record);
    writeSurveys(surveys);
    res.json({ success: true, message: 'Опрос успешно сохранен' });
});

app.get('/api/surveys', apiLimiter, requireAuth, (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(readSurveys().filter((s) => inScope(s, req.admin.scope)));
});

app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Фронтенд файлы не найдены');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен и доступен по адресу: http://localhost:${PORT}`);
});