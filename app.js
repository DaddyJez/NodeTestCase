const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let settings = [];
let decompositionCache = [];

// API Endpoints
app.get('/api/settings', (req, res) => res.json(settings));
app.post('/api/settings', (req, res) => {
    // Проверка формата месяцев
    const invalid = req.body.some(param =>
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(param.month)
    );
    if (invalid) {
        return res.status(400).json({ error: "Неверный формат месяца. Используйте YYYY-MM" });
    }
    settings = req.body;
    res.json({ success: true });
});

app.get('/api/decomposition', (req, res) => {
    const aggregated = settings.reduce((acc, { month, value }) => {
        acc[month] = (acc[month] || 0) + Number(value);
        return acc;
    }, {});

    // 2. Определяем временной диапазон
    const months = Object.keys(aggregated).sort();
    const [startYear, startMonth] = months[0]?.split('-').map(Number) || [0, 0];
    const [endYear, endMonth] = months[months.length - 1]?.split('-').map(Number) || [0, 0];

    // 3. Расширяем диапазон до минимального года
    let days = [];
    const startDate = new Date(startYear, startMonth - 1, 1);
    let endDate = new Date(endYear, endMonth, 0);

    // 4. Гарантируем минимум 365 дней
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + 364);
    if (endDate < minEndDate) endDate = minEndDate;

    // 5. Генерируем все дни в диапазоне
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const monthKey = `${year}-${month}`;

        // 6. Рассчитываем значение для дня
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyValue = aggregated[monthKey]
            ? (aggregated[monthKey] / daysInMonth).toFixed(2)
            : 0;

        days.push({
            date: `${year}-${month}-${day}`,
            value: dailyValue
        });
    }
    decompositionCache = days;
    res.json(days);
});

app.get('/api/composition', (req, res) => {
    if (decompositionCache.length === 0) {
        return res.status(400).json({ error: "Сначала создайте декомпозицию" });
    }

    const monthlyData = decompositionCache.reduce((acc, { date, value }) => {
        const month = date.slice(0, 7);
        acc[month] = (acc[month] || 0) + parseFloat(value);
        return acc;
    }, {});

    const allMonths = [];
    const start = new Date(decompositionCache[0].date);
    const end = new Date(decompositionCache[decompositionCache.length - 1].date);

    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        allMonths.push(month);
    }

    // Формируем результат
    const result = allMonths.map(month => ({
        month,
        value: monthlyData[month]?.toFixed(2) || '0.00'
    }));

    res.json(result);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
