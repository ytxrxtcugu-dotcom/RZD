// Роли и пути для отображения
const ADMIN_ROLES = {
    'admin': { role: 'superadmin', path: [] },
    'tranenergo': { role: 'filial', path: ['Трансэнерго'] },
    'ryaz_lin_otdel': { role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Рязанский линейный отдел'] },
    'tul_lin_otdel': { role: 'linear', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению', 'Тульский линейный отдел'] },
    'mosdir': { role: 'director', path: ['Трансэнерго', 'Московская дирекция по энергообеспечению'] },
    'direct_tyaga': { role: 'filial', path: ['Дирекция тяги'] },
    'cdud': { role: 'filial', path: ['Центральная дирекция управления движением'] },
    'cdi': { role: 'filial', path: ['Центральная дирекция инфраструктуры'] },
    'cdrp': { role: 'filial', path: ['Центральная дирекция по ремонту пути'] },
    'cdtv': { role: 'filial', path: ['Центральная дирекция по тепловодоснабжению'] },
    'dzv': { role: 'filial', path: ['Дирекция железнодорожных вокзалов'] },
    'dss': { role: 'filial', path: ['Дирекция скоростного сообщения'] },
    'cdmvps': { role: 'filial', path: ['Центральная дирекция моторвагонного подвижного состава'] },
    'cdpo': { role: 'filial', path: ['Центральная дирекция пассажирских обустройств'] },
    'cdutsk': { role: 'filial', path: ['Центральная дирекция по управлению терминально-складским комплексом'] },
    'drtps': { role: 'filial', path: ['Дирекция по ремонту тягового подвижного состава'] },
    'dkrroee': { role: 'filial', path: ['Дирекция капитального ремонта и реконструкции объектов электрификации и электроснабжения железных дорог'] },
    'mos_cfto': { role: 'director', path: ['Центр фирменного транспортного обслуживания', 'Московский территориальный центр фирменного транспортного обслуживания'] },
    'kursk_afto': { role: 'local', path: ['Центр фирменного транспортного обслуживания', 'Московский территориальный центр фирменного транспортного обслуживания', 'Московско-Курское агентство фирменного транспортного обслуживания'] },
    'ryazan_afto': { role: 'local', path: ['Центр фирменного транспортного обслуживания', 'Московский территориальный центр фирменного транспортного обслуживания', 'Рязанское агентство фирменного транспортного обслуживания'] },
    'tula_afto': { role: 'local', path: ['Центр фирменного транспортного обслуживания', 'Московский территориальный центр фирменного транспортного обслуживания', 'Тульское агентство фирменного транспортного обслуживания'] },
    'mdzezs': { role: 'director', path: ['Железные дороги - филиалы ОАО "РЖД"', 'Московская железная дорога', 'Московская дирекция по эксплуатации зданий и сооружений'] },
    'bryansk_dist_gs': { role: 'local', path: ['Железные дороги - филиалы ОАО "РЖД"', 'Московская железная дорога', 'Московская дирекция по эксплуатации зданий и сооружений', 'Брянская дистанция гражданских сооружений'] },
    'dss_mzd': { role: 'filial', path: ['Дирекция социальной сферы Московской железной дороги'] },
    'berezovaya': { role: 'local', path: ['Дирекция социальной сферы Московской железной дороги', 'Дирекция социальной сферы', 'Пансионат с лечением "Березовая роща"'] },
    'sinezerki': { role: 'local', path: ['Дирекция социальной сферы Московской железной дороги', 'Дирекция социальной сферы', 'Санаторий-профилакторий "Синезёрки"'] }
};

async function handleLogin(event) {
    event.preventDefault();
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!usernameField || !passwordField) return;

    const username = usernameField.value.trim();
    const password = passwordField.value;
    
    try {
        // Запрос отправляется на локальный бэкенд через относительный путь
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminUsername', username);
            
            const roleInfo = ADMIN_ROLES[username] || { role: 'local', path: [username] };
            sessionStorage.setItem('adminRole', roleInfo.role);
            sessionStorage.setItem('adminPath', JSON.stringify(roleInfo.path));
            
            window.location.href = '/admin.html';
        } else {
            if (errorMessage) {
                errorMessage.style.display = 'block';
                setTimeout(() => errorMessage.style.display = 'none', 3000);
            }
            passwordField.value = '';
            passwordField.focus();
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка подключения к серверу');
    }
}