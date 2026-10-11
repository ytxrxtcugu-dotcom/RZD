const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Корректная настройка доверия к прокси для rate-limit
app.set('trust proxy', 1);

// Секретный ключ для JWT
const JWT_SECRET = crypto.randomBytes(32).toString('hex');

// Middleware
app.use(cors());
app.use(express.json());

// Раздача статики из папки frontend (на уровень выше бэкенда)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Rate limiting для входа (максимум 5 попыток за 15 минут)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Слишком много попыток входа. Попробуйте через 15 минут.' }
});

// Rate limiting для общих API-запросов (100 запросов за 15 минут)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Слишком много запросов с вашего IP.' }
});

// Пути к файлам данных и логов
const DATA_FILE = path.join(__dirname, 'surveys.json');
const LOG_FILE = path.join(__dirname, 'login_attempts.log');

// Функция хэширования паролей
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Функция логирования попыток входа
function logAttempt(username, success, ip) {
    const logEntry = `${new Date().toISOString()} | User: ${username} | Status: ${success ? 'SUCCESS' : 'FAILED'} | IP: ${ip}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logEntry);
    } catch (err) {
        console.error('Ошибка записи лога:', err);
    }
}

// База хэшей паролей администраторов
const ADMIN_HASHES = {
    'admin': hashPassword('rzd2026'),
    'tranenergo': hashPassword('tran2026'),
    'tranenergo_org': hashPassword('tranorg2026'),
    'mosdir': hashPassword('mosdir2026'),
    'mosdir_org': hashPassword('mosdirorg2026'),
    'ryaz_lin_otdel': hashPassword('ryazlin2026'),
    'tul_lin_otdel': hashPassword('tullin2026'),
    'direct_tyaga': hashPassword('tyaga2026'),
    'cdud': hashPassword('cdud2026'),
    'cdi': hashPassword('cdi2026'),
    'cdrp': hashPassword('cdrp2026'),
    'cdtv': hashPassword('cdtv2026'),
    'dzv': hashPassword('dzv2026'),
    'dss': hashPassword('dss2026'),
    'cdmvps': hashPassword('cdmvps2026'),
    'cdpo': hashPassword('cdpo2026'),
    'cdutsk': hashPassword('cdutsk2026'),
    'drtps': hashPassword('drtps2026'),
    'dkrroee': hashPassword('dkrroee2026'),
    'mos_cfto': hashPassword('moscfto2026'),
    'mdzezs': hashPassword('mdzezs2026'),
    'dss_mzd': hashPassword('dssmzd2026'),
    'berezovaya': hashPassword('berezovaya2026'),
    'sinezerki': hashPassword('sinezerki2026')
};

// Функция чтения опросов
function readSurveys() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Ошибка чтения surveys.json:', error);
    }
    return [];
}

// Функция записи опросов
function writeSurveys(surveys) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(surveys, null, 2), 'utf8');
    } catch (error) {
        console.error('Ошибка записи surveys.json:', error);
    }
}

// --- API Роуты ---

// Авторизация администратора
app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Укажите логин и пароль' });
    }

    if (ADMIN_HASHES[username] && ADMIN_HASHES[username] === hashPassword(password)) {
        logAttempt(username, true, ip);
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, username, token });
    } else {
        logAttempt(username, false, ip);
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// Сохранение нового опроса
app.post('/api/surveys', apiLimiter, (req, res) => {
    const survey = req.body;
    
    if (!survey || !survey.user || !survey.ratings) {
        return res.status(400).json({ success: false, message: 'Некорректные данные опроса' });
    }

    const surveys = readSurveys();
    surveys.push(survey);
    writeSurveys(surveys);
    
    res.json({ success: true, message: 'Опрос успешно сохранен' });
});

// Получение списка всех опросов
app.get('/api/surveys', apiLimiter, (req, res) => {
    const surveys = readSurveys();
    res.json(surveys);
});

// Запасной роут для отдачи SPA (чтобы при обновлении страниц не было 404)
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Фронтенд файлы не найдены');
    }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен и доступен по адресу: http://localhost:${PORT}`);
});