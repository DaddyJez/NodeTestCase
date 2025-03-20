class BudgetApp {
    constructor() {
        this.localSettings = [];

        // Привязка контекста
        this.addParam = this.addParam.bind(this);
        this.deleteParam = this.deleteParam.bind(this);
        this.saveSettings = this.saveSettings.bind(this);

        this.initEventListeners();
        this.loadSettings();
    }

    initEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showTab(e.target.dataset.tab));
        });

        document.getElementById('paramMonth').addEventListener('keypress', (e) => {
            if(e.key === 'Enter') this.addParam();
        });
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            this.localSettings = await response.json();
            this.updateParamsList();
        } catch(error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    showTab(tabId) {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
            el.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');

        if(tabId === 'decomposition') this.loadDecomposition();
        if(tabId === 'composition') this.loadComposition();
    }

    addParam() {
        const value = parseFloat(document.getElementById('paramValue').value);
        const month = document.getElementById('paramMonth').value;

        if(!value || !month) return alert('Заполните все поля!');

        this.localSettings.push({ value, month });
        this.updateParamsList();
        document.getElementById('paramValue').value = '';
    }

    updateParamsList() {
        const list = document.getElementById('paramsList');
        list.innerHTML = this.localSettings.map((param, index) => `
      <div class="param-item">
        <span>${param.value} ₽ (${param.month})</span>
        <button class="btn-danger" onclick="budgetApp.deleteParam(${index})">Удалить</button>
      </div>
    `).join('');
    }

    deleteParam(index) {
        this.localSettings.splice(index, 1);
        this.updateParamsList();
    }

    async saveSettings() {
        try {
            if(this.localSettings.length === 0) {
                return alert('Добавьте хотя бы один параметр!');
            }

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.localSettings)
            });

            if(!response.ok) throw new Error('Ошибка сервера');

            alert('Настройки успешно сохранены!');
            this.showTab('decomposition');
        } catch(error) {
            console.error('Ошибка:', error);
            alert(`Ошибка сохранения: ${error.message}`);
        }
    }

    async loadDecomposition() {
        try {
            const response = await fetch('/api/decomposition');
            const days = await response.json();

            const table = document.getElementById('decompTable');
            const chunkSize = 9; // Колонок в строке
            const chunks = [];

            // Разбиваем дни на блоки по 14 дней
            for (let i = 0; i < days.length; i += chunkSize) {
                chunks.push(days.slice(i, i + chunkSize));
            }

            table.innerHTML = chunks.map(chunk => `
      <tr>
        ${chunk.map(day => `<th>${day.date.split('-')[2]}.${day.date.split('-')[1]}.${day.date.split('-')[0]}</th>`).join('')}
      </tr>
      <tr>
        ${chunk.map(day => `<td>${day.value}</td>`).join('')}
      </tr>
    `).join('');
        } catch(error) {
            console.error('Ошибка загрузки:', error);
        }
    }

    async loadComposition() {
        try {
            const response = await fetch('/api/composition');
            const composition = await response.json();

            const table = document.getElementById('compTable');

            table.innerHTML = `
      <tr>${composition.map(c => `<th>${c.month}</th>`).join('')}</tr>
      <tr>${composition.map(c => `<td>${c.value}</td>`).join('')}</tr>
    `;

        } catch(error) {
            console.error('Ошибка загрузки:', error);
        }
    }
}

// Инициализация приложения
window.budgetApp = new BudgetApp();
