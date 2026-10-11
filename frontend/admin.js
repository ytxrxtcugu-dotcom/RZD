document.addEventListener('DOMContentLoaded', () => {
    // Общие настройки шрифтов для всех графиков
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#718096';

    // 1. График трендов (Плавная линия с градиентом)
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    
    // Создаем "дорогой" градиент для графика
    const gradientFill = trendCtx.createLinearGradient(0, 0, 0, 300);
    gradientFill.addColorStop(0, 'rgba(226, 26, 26, 0.2)'); // РЖД красный (полупрозрачный)
    gradientFill.addColorStop(1, 'rgba(226, 26, 26, 0)');

    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'],
            datasets: [{
                label: 'Индекс удовлетворенности (%)',
                data: [65, 68, 72, 71, 75, 78, 82, 80, 85],
                borderColor: '#E21A1A',
                backgroundColor: gradientFill,
                borderWidth: 3,
                tension: 0.4, // Плавность линии (сплайн)
                fill: true,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#E21A1A',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }
                },
                x: {
                    grid: { display: false, drawBorder: false }
                }
            }
        }
    });

    // 2. Радарный график (Оценка по категориям)
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: [
                'Зарплата', 
                'Условия труда', 
                'Руководство', 
                'Коллектив', 
                'Карьера', 
                'Баланс работы и жизни'
            ],
            datasets: [{
                label: 'Текущий квартал',
                data: [7.5, 6.8, 8.2, 9.0, 7.1, 6.5],
                backgroundColor: 'rgba(226, 26, 26, 0.2)',
                borderColor: '#E21A1A',
                pointBackgroundColor: '#E21A1A',
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    angleLines: { color: 'rgba(0,0,0,0.05)' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    pointLabels: {
                        font: { size: 11, family: "'Inter', sans-serif" },
                        color: '#2D3748'
                    },
                    ticks: { display: false, min: 0, max: 10 }
                }
            }
        }
    });
});