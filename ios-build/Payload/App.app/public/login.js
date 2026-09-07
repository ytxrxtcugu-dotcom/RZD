// Функция генерации администраторов для всех подразделений
function generateAdminCredentials() {
    const credentials = {
        'admin': {
            password: 'rzd2026',
            role: 'superadmin',
            path: []
        }
    };

    // Трансэнерго
    credentials['tranenergo'] = { password: 'tran2026', role: 'filial', path: ['Трансэнерго'] };
    credentials['tranenergo_org'] = { password: 'tranorg2026', role: 'director', path: ['Трансэнерго', 'Орган управления'] };
    credentials['mosdir'] = { password: 'mosdir2026', role: 'director', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению'] };
    credentials['mosdir_org'] = { password: 'mosdirorg2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Орган управления МОСК ДЭ'] };
    credentials['mos_lin_otdel'] = { password: 'moslin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Московский линейный отдел'] };
    credentials['ryaz_lin_otdel'] = { password: 'ryazlin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Рязанский линейный отдел'] };
    credentials['tul_lin_otdel'] = { password: 'tullin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Тульский линейный отдел'] };
    credentials['orl_lin_otdel'] = { password: 'orllin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Орловско-Курский линейный отдел'] };
    credentials['smol_lin_otdel'] = { password: 'smollin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Смоленский линейный отдел'] };
    credentials['kaluga_lin_otdel'] = { password: 'kalugalin2026', role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Калужско-Брянский линейный отдел'] };
    
    // Дистанции электроснабжения
    credentials['msk_kursk_dist'] = { password: 'dist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Московско-Курская дистанция электроснабжения (I группа)'] };
    credentials['zhd_dist'] = { password: 'zhd2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Железнодорожная дистанция электроснабжения (I группа)'] };
    credentials['pank_dist'] = { password: 'pank2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Панковская дистанция электроснабжения (I группа)'] };
    credentials['myt_dist'] = { password: 'myt2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Мытищинская дистанция электроснабжения (I группа)'] };
    credentials['lobn_dist'] = { password: 'lobn2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Лобненская дистанция электроснабжения (I группа)'] };
    credentials['pokr_dist'] = { password: 'pokr2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Покровско-Стрешневская дистанция электроснабжения (I группа)'] };
    credentials['msk_smol_dist'] = { password: 'smol2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Московско-Смоленская дистанция электроснабжения (I группа)'] };
    credentials['vnuk_dist'] = { password: 'vnuk2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Внуковская дистанция электроснабжения (I группа)'] };
    credentials['tul_dist'] = { password: 'tuldist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Тульская дистанция электроснабжения (I группа)'] };
    credentials['orl_dist'] = { password: 'orldist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Орловская дистанция электроснабжения (I группа)'] };
    credentials['kursk_dist'] = { password: 'kurskdist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Курская дистанция электроснабжения (I группа)'] };
    credentials['pavel_dist'] = { password: 'paveldist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Московско-Павелецкая дистанция электроснабжения (I группа)'] };
    credentials['ozher_dist'] = { password: 'ozher2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Ожерельевская дистанция электроснабжения (II группа)'] };
    credentials['ryaz_dist'] = { password: 'ryazdist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Рязанская дистанция электроснабжения (I группа)'] };
    credentials['lyub_dist'] = { password: 'lyubdist2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Люберецкая дистанция электроснабжения (I группа)'] };
    credentials['smolensk_dist'] = { password: 'smolensk2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Смоленская дистанция электроснабжения (I группа)'] };
    credentials['bryansk_dist'] = { password: 'bryansk2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Брянская дистанция электроснабжения (I группа)'] };
    credentials['vyazma_dist'] = { password: 'vyazma2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Вяземская дистанция электроснабжения'] };
    credentials['tech_center'] = { password: 'tech2026', role: 'local', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Технический центр электрификации и электроснабжения'] };

    // Центральная дирекция по ремонту пути
    credentials['cdrp'] = { password: 'cdrp2026', role: 'filial', path: ['Центральная дирекция по ремонту пути'] };
    credentials['cdrp_org'] = { password: 'cdrporg2026', role: 'director', path: ['Центральная дирекция по ремонту пути', 'Орган управления'] };
    credentials['cdrp_mosorg'] = { password: 'cdrpmos2026', role: 'director', path: ['Центральная дирекция по ремонту пути', 'Орган управления Московской дирекции по ремонту пути'] };
    credentials['pms_103'] = { password: 'pms1032026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Опытная путевая машинная станция № 103'] };
    credentials['pms_68'] = { password: 'pms682026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Опытная путевая машинная станция № 68'] };
    credentials['pms_99'] = { password: 'pms992026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Опытная путевая машинная станция № 99'] };
    credentials['pms_101'] = { password: 'pms1012026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 101'] };
    credentials['pms_104'] = { password: 'pms1042026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 104'] };
    credentials['pms_12'] = { password: 'pms122026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 12'] };
    credentials['pms_55'] = { password: 'pms552026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 55'] };
    credentials['pms_58'] = { password: 'pms582026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 58'] };
    credentials['pms_96'] = { password: 'pms962026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 96'] };
    credentials['pms_97'] = { password: 'pms972026', role: 'local', path: ['Центральная дирекция по ремонту пути', 'Путевая машинная станция № 97'] };

    // Центральная дирекция по тепловодоснабжению
    credentials['cdtv'] = { password: 'cdtv2026', role: 'filial', path: ['Центральная дирекция по тепловодоснабжению'] };
    credentials['cdtv_org'] = { password: 'cdtvorg2026', role: 'director', path: ['Центральная дирекция по тепловодоснабжению', 'Орган управления'] };
    credentials['cdtv_mos'] = { password: 'cdtvmos2026', role: 'director', path: ['Центральная дирекция по тепловодоснабжению', 'Московская дирекция по тепловодоснабжению'] };
    credentials['cdtv_msk_kursk'] = { password: 'cdtvkursk2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Московско-Курский территориальный участок'] };
    credentials['cdtv_msk_ryaz'] = { password: 'cdtvryaz2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Московско-Рязанский территориальный участок'] };
    credentials['cdtv_msk_smol'] = { password: 'cdtvsmol2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Московско-Смоленский территориальный участок'] };
    credentials['cdtv_tul'] = { password: 'cdtvtul2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Тульский территориальный участок'] };
    credentials['cdtv_smolensk'] = { password: 'cdtvsmolensk2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Смоленский территориальный участок'] };
    credentials['cdtv_bryansk'] = { password: 'cdtvbryansk2026', role: 'linear', path: ['Центральная дирекция по тепловодоснабжению', 'Брянский территориальный участок'] };

    // Центральная дирекция инфраструктуры
    credentials['cdi'] = { password: 'cdi2026', role: 'filial', path: ['Центральная дирекция инфраструктуры'] };
    credentials['cdi_org'] = { password: 'cdiorg2026', role: 'director', path: ['Центральная дирекция инфраструктуры', 'Орган управления'] };
    credentials['cdi_mos'] = { password: 'cdimos2026', role: 'director', path: ['Центральная дирекция инфраструктуры', 'Московская дирекция инфраструктуры'] };
    credentials['cdi_pm'] = { password: 'cdipm2026', role: 'director', path: ['Центральная дирекция инфраструктуры', 'Дирекция по эксплуатации путевых машин'] };
    credentials['cdi_diag'] = { password: 'cdidiag2026', role: 'director', path: ['Центральная дирекция инфраструктуры', 'Дирекция диагностики и мониторинга инфраструктуры'] };
    credentials['vchd_oz'] = { password: 'vchdoz2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Орехово-Зуево (I группа)'] };
    credentials['vchd_bir'] = { password: 'vchdbir2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Бирюлево (I группа)'] };
    credentials['vchd_bek'] = { password: 'vchdbek2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Бекасово (I группа)'] };
    credentials['vchd_tul'] = { password: 'vchdtul2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Тула (I группа)'] };
    credentials['vchd_ryaz'] = { password: 'vchdryaz2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Рязань (I группа)'] };
    credentials['vchd_bryansk'] = { password: 'vchdbryansk2026', role: 'local', path: ['Центральная дирекция инфраструктуры', 'Эксплуатационное вагонное депо Брянск (I группа)'] };

    // Трансинформ
    credentials['traninform'] = { password: 'traninform2026', role: 'filial', path: ['Трансинформ'] };
    credentials['gvc'] = { password: 'gvc2026', role: 'director', path: ['Трансинформ', 'Главный вычислительный центр'] };
    credentials['mivc'] = { password: 'mivc2026', role: 'director', path: ['Трансинформ', 'Московский информационно-вычислительный центр'] };

    // Центральная станция связи
    credentials['css'] = { password: 'css2026', role: 'filial', path: ['Центральная станция связи'] };
    credentials['css_org'] = { password: 'cssorg2026', role: 'director', path: ['Центральная станция связи', 'Орган управления'] };
    credentials['css_ctu'] = { password: 'cssctu2026', role: 'director', path: ['Центральная станция связи', 'Центр управления технологической сетью связи'] };

    // Московская дирекция связи
    credentials['mossvyaz'] = { password: 'mossvyaz2026', role: 'director', path: ['Московская дирекция связи'] };
    credentials['mossvyaz_org'] = { password: 'mossvyazorg2026', role: 'linear', path: ['Московская дирекция связи', 'Орган управления'] };
    credentials['ryaz_rcs'] = { password: 'ryazrcs2026', role: 'local', path: ['Московская дирекция связи', 'Московско-Рязанский региональный центр связи'] };
    credentials['kursk_rcs'] = { password: 'kurskrcs2026', role: 'local', path: ['Московская дирекция связи', 'Московско-Курский региональный центр связи'] };
    credentials['smol_rcs'] = { password: 'smolrcs2026', role: 'local', path: ['Московская дирекция связи', 'Московско-Смоленский региональный центр связи'] };
    credentials['tul_rcs'] = { password: 'tulrcs2026', role: 'local', path: ['Московская дирекция связи', 'Тульский региональный центр связи'] };
    credentials['ryazan_rcs'] = { password: 'ryazanrcs2026', role: 'local', path: ['Московская дирекция связи', 'Рязанский региональный центр связи'] };
    credentials['orel_rcs'] = { password: 'orelrcs2026', role: 'local', path: ['Московская дирекция связи', 'Орловско-Курский региональный центр связи'] };
    credentials['smolensk_rcs'] = { password: 'smolenskrcs2026', role: 'local', path: ['Московская дирекция связи', 'Смоленский региональный центр связи'] };
    credentials['bryansk_rcs'] = { password: 'bryanskrcs2026', role: 'local', path: ['Московская дирекция связи', 'Брянский региональный центр связи'] };

    return credentials;
}

const ADMIN_CREDENTIALS = generateAdminCredentials();

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    if (ADMIN_CREDENTIALS[username] && ADMIN_CREDENTIALS[username].password === password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        sessionStorage.setItem('adminRole', ADMIN_CREDENTIALS[username].role);
        sessionStorage.setItem('adminPath', JSON.stringify(ADMIN_CREDENTIALS[username].path));
        
        window.location.href = '/admin.html';
    } else {
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = '/admin.html';
    }
}

checkAuth();