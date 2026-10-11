const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Секретный ключ для JWT
const JWT_SECRET = crypto.randomBytes(32).toString('hex');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting для входа (5 попыток в 15 минут)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Слишком много попыток. Попробуйте через 15 минут.' },
    trustProxy: true // Добавьте эту строку
});

// Rate limiting для API (100 запросов в 15 минут)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Слишком много запросов.' },
    trustProxy: true // Добавьте эту строку
});

// Файл для хранения данных
const DATA_FILE = path.join(__dirname, 'surveys.json');
const LOG_FILE = path.join(__dirname, 'login_attempts.log');

// Функция хэширования
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Функция логирования
function logAttempt(username, success, ip) {
    const logEntry = `${new Date().toISOString()} | ${username} | ${success ? 'SUCCESS' : 'FAILED'} | ${ip}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
}

// Учетные данные (хэши паролей)
const ADMIN_HASHES = {
    'admin': hashPassword('rzd2026'),
    'tranenergo': hashPassword('tran2026'),
    'tranenergo_org': hashPassword('tranorg2026'),
    'mosdir': hashPassword('mosdir2026'),
    'mosdir_org': hashPassword('mosdirorg2026'),
    'mos_lin_otdel': hashPassword('moslin2026'),
    'ryaz_lin_otdel': hashPassword('ryazlin2026'),
    'tul_lin_otdel': hashPassword('tullin2026'),
    'orl_lin_otdel': hashPassword('orllin2026'),
    'smol_lin_otdel': hashPassword('smollin2026'),
    'kaluga_lin_otdel': hashPassword('kalugalin2026'),
    'msk_kursk_dist': hashPassword('dist2026'),
    'zhd_dist': hashPassword('zhd2026'),
    'pank_dist': hashPassword('pank2026'),
    'myt_dist': hashPassword('myt2026'),
    'lobn_dist': hashPassword('lobn2026'),
    'pokr_dist': hashPassword('pokr2026'),
    'msk_smol_dist': hashPassword('smol2026'),
    'vnuk_dist': hashPassword('vnuk2026'),
    'tul_dist': hashPassword('tuldist2026'),
    'orl_dist': hashPassword('orldist2026'),
    'kursk_dist': hashPassword('kurskdist2026'),
    'pavel_dist': hashPassword('paveldist2026'),
    'ozher_dist': hashPassword('ozher2026'),
    'ryaz_dist': hashPassword('ryazdist2026'),
    'lyub_dist': hashPassword('lyubdist2026'),
    'smolensk_dist': hashPassword('smolensk2026'),
    'bryansk_dist': hashPassword('bryansk2026'),
    'vyazma_dist': hashPassword('vyazma2026'),
    'tech_center': hashPassword('tech2026'),
    'cdrp': hashPassword('cdrp2026'),
    'cdrp_org': hashPassword('cdrporg2026'),
    'cdrp_mosorg': hashPassword('cdrpmos2026'),
    'pms_103': hashPassword('pms1032026'),
    'pms_68': hashPassword('pms682026'),
    'pms_99': hashPassword('pms992026'),
    'pms_101': hashPassword('pms1012026'),
    'pms_104': hashPassword('pms1042026'),
    'pms_12': hashPassword('pms122026'),
    'pms_55': hashPassword('pms552026'),
    'pms_58': hashPassword('pms582026'),
    'pms_96': hashPassword('pms962026'),
    'pms_97': hashPassword('pms972026'),
    'cdtv': hashPassword('cdtv2026'),
    'cdtv_org': hashPassword('cdtvorg2026'),
    'cdtv_mos': hashPassword('cdtvmos2026'),
    'cdtv_msk_kursk': hashPassword('cdtvkursk2026'),
    'cdtv_msk_ryaz': hashPassword('cdtvryaz2026'),
    'cdtv_msk_smol': hashPassword('cdtvsmol2026'),
    'cdtv_tul': hashPassword('cdtvtul2026'),
    'cdtv_smolensk': hashPassword('cdtvsmolensk2026'),
    'cdtv_bryansk': hashPassword('cdtvbryansk2026'),
    'cdi': hashPassword('cdi2026'),
    'cdi_org': hashPassword('cdiorg2026'),
    'cdi_mos': hashPassword('cdimos2026'),
    'cdi_pm': hashPassword('cdipm2026'),
    'cdi_diag': hashPassword('cdidiag2026'),
    'vchd_oz': hashPassword('vchdoz2026'),
    'vchd_bir': hashPassword('vchdbir2026'),
    'vchd_bek': hashPassword('vchdbek2026'),
    'vchd_tul': hashPassword('vchdtul2026'),
    'vchd_ryaz': hashPassword('vchdryaz2026'),
    'vchd_bryansk': hashPassword('vchdbryansk2026'),
    'traninform': hashPassword('traninform2026'),
    'gvc': hashPassword('gvc2026'),
    'mivc': hashPassword('mivc2026'),
    'css': hashPassword('css2026'),
    'css_org': hashPassword('cssorg2026'),
    'css_ctu': hashPassword('cssctu2026'),
    'mossvyaz': hashPassword('mossvyaz2026'),
    'mossvyaz_org': hashPassword('mossvyazorg2026'),
    'ryaz_rcs': hashPassword('ryazrcs2026'),
    'kursk_rcs': hashPassword('kurskrcs2026'),
    'smol_rcs': hashPassword('smolrcs2026'),
    'tul_rcs': hashPassword('tulrcs2026'),
    'ryazan_rcs': hashPassword('ryazanrcs2026'),
    'orel_rcs': hashPassword('orelrcs2026'),
    'smolensk_rcs': hashPassword('smolenskrcs2026'),
    'bryansk_rcs': hashPassword('bryanskrcs2026'),
    'direct_tyaga': hashPassword('tyaga2026'),
    'mos_tyaga': hashPassword('mostyaga2026'),
    'td_lihobory': hashPassword('lihobory2026'),
    'td_orehovo': hashPassword('orehovo2026'),
    'td_ryazan': hashPassword('tdryazan2026'),
    'dzv': hashPassword('dzv2026'),
    'mos_dzv': hashPassword('mosdzv2026'),
    'belorussky': hashPassword('belorussky2026'),
    'kazansky': hashPassword('kazansky2026'),
    'yaroslavsky': hashPassword('yaroslavsky2026'),
    'kursky': hashPassword('kursky2026'),
    'kievsky': hashPassword('kievsky2026'),
    'paveletsky': hashPassword('paveletsky2026'),
    'dss': hashPassword('dss2026'),
    'mos_dss': hashPassword('mosdss2026'),
    'dss_podmoskovnaya': hashPassword('podmoskovnaya2026'),
    'dss_belokamennaya': hashPassword('belokamennaya2026'),
    'cdud': hashPassword('cdud2026'),
    'mos_cdud': hashPassword('moscdud2026'),
    'mos_kursk_center': hashPassword('kurskcenter2026'),
    'ryazan_center': hashPassword('ryazancenter2026'),
    'tula_center': hashPassword('tulacenter2026'),
    'drtps': hashPassword('drtps2026'),
    'mos_drtps': hashPassword('mosdrtps2026'),
    'pu_rybnoe': hashPassword('rybnoe2026'),
    'pu_uzlovaya': hashPassword('uzlovaya2026'),
    'pu_smolensk': hashPassword('pusmolensk2026'),
    'pu_orel': hashPassword('porel2026'),
    'cdutsk': hashPassword('cdutsk2026'),
    'mos_cdutsk': hashPassword('moscdutsk2026'),
    'mmch': hashPassword('mmch2026'),
    'omch': hashPassword('omch2026'),
    'bsmch': hashPassword('bsmch2026'),
    'cdpo': hashPassword('cdpo2026'),
    'mos_cdpo': hashPassword('moscdpo2026'),
    'dpo_mck': hashPassword('dpomck2026'),
    'dpo_mcd': hashPassword('dpomcd2026'),
    'cdmvps': hashPassword('cdmvps2026'),
    'mos_cdmvps': hashPassword('moscdmvps2026'),
    'mvps_zhd': hashPassword('mvpszhd2026'),
    'mvps_domodedovo': hashPassword('mvpsdomodedovo2026'),
    'mvps_bryansk': hashPassword('mvpsbryansk2026'),
    'dkrroee': hashPassword('dkrroee2026'),
    'memz': hashPassword('memz2026'),
    'mos_cfto': hashPassword('moscfto2026'),
    'kursk_afto': hashPassword('kurskafto2026'),
    'ryazan_afto': hashPassword('ryazanafto2026'),
    'tula_afto': hashPassword('tulaafto2026'),
    'mdzezs': hashPassword('mdzezs2026'),
    'bryansk_dist_gs': hashPassword('bryanskgz2026'),
    'dss_mzd': hashPassword('dssmzd2026'),
    'berezovaya': hashPassword('berezovaya2026'),
    'sinezerki': hashPassword('sinezerki2026')
};

// API для входа
app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    if (ADMIN_HASHES[username] && ADMIN_HASHES[username] === hashPassword(password)) {
        logAttempt(username, true, ip);
        
        // Создаем JWT токен
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
        
        res.json({ success: true, username, token });
    } else {
        logAttempt(username, false, ip);
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// Функция для чтения данных
function readSurveys() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Ошибка чтения файла:', error);
    }
    return [];
}

// Функция для записи данных
function writeSurveys(surveys) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(surveys, null, 2));
}

// API для сохранения результатов опроса
app.post('/api/surveys', apiLimiter, (req, res) => {
    const survey = req.body;
    
    const surveys = readSurveys();
    surveys.push(survey);
    writeSurveys(surveys);
    
    res.json({ success: true, message: 'Опрос сохранен' });
});

// API для получения всех результатов
app.get('/api/surveys', apiLimiter, (req, res) => {
    const surveys = readSurveys();
    res.json(surveys);
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});