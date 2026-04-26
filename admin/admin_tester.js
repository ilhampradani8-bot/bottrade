const backtestBtn = document.getElementById('startBacktestBtn');
const loader = document.getElementById('loader');
const form = document.getElementById('backtestForm');
const resultArea = document.getElementById('resultArea');
const backtestReportDiv = document.getElementById('backtestReport');
const portfolioDetailsDiv = document.getElementById('portfolioDetails');
const transactionHistoryBody = document.getElementById('transactionHistory');

// API Configuration
const API_URL = '/api';

// Chart.js Instances
let growthChart = null;
let priceChart = null;
let inventoryData = [];

/**
 * Memuat inventori data dari database untuk menyesuaikan input secara dinamis.
 */
/**
 * Memuat daftar koin dari Binance (Real-time) dan inventori data lokal.
 */
async function loadInitialData() {
    try {
        const [coinsRes, invRes] = await Promise.all([
            fetch(`${API_URL}/coins`),
            fetch(`${API_URL}/inventory`)
        ]);
        
        const coins = await coinsRes.json();
        inventoryData = await invRes.json();
        
        const pairSelect = document.getElementById('pair');
        pairSelect.innerHTML = '';
        
        coins.forEach(coin => {
            const hasData = inventoryData.some(i => i.pair === coin.symbol);
            const option = document.createElement('option');
            option.value = coin.symbol;
            option.textContent = `${coin.name} ${hasData ? '✅' : '❌'}`;
            pairSelect.appendChild(option);
        });

        updateIntervalOptions();
        pairSelect.addEventListener('change', updateIntervalOptions);

    } catch (e) {
        console.error("Gagal memuat data awal", e);
    }
}

function updateIntervalOptions() {
    const pairSelect = document.getElementById('pair');
    const intervalSelect = document.getElementById('interval');
    const selectedPair = pairSelect.value;
    
    const availableIntervals = inventoryData
        .filter(item => item.pair === selectedPair)
        .map(item => item.interval);
    
    intervalSelect.innerHTML = '';
    
    if (availableIntervals.length > 0) {
        availableIntervals.forEach(intv => {
            const option = document.createElement('option');
            option.value = intv;
            option.textContent = intv === '5m' ? '5 Menit' : (intv === '1h' ? '1 Jam' : intv);
            intervalSelect.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.textContent = "Data Belum Tersedia";
        option.value = "";
        intervalSelect.appendChild(option);
    }

    updateRangeLimit();
}

function updateRangeLimit() {
    const pairSelect = document.getElementById('pair');
    const intervalSelect = document.getElementById('interval');
    const periodeInput = document.getElementById('periode');
    
    const selectedPair = pairSelect.value;
    const selectedInterval = intervalSelect.value;
    
    const item = inventoryData.find(i => i.pair === selectedPair && i.interval === selectedInterval);
    if (item) {
        const start = new Date(item.start_date);
        const end = new Date(item.end_date);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        periodeInput.max = diffDays;
        periodeInput.title = `Data tersedia maksimal ${diffDays} hari (${item.start_date} s/d ${item.end_date})`;
        if (parseInt(periodeInput.value) > diffDays) {
            periodeInput.value = diffDays;
        }
    }
}

loadInitialData();

/**
 * Inisialisasi Grafik Pertumbuhan Saldo
 */
function initGrowthChart(labels = [], data = []) {
    const ctx = document.getElementById('growthChart').getContext('2d');
    if (growthChart) growthChart.destroy();

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Value (IDR)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

/**
 * Inisialisasi Grafik Harga & Signal
 */
function initPriceChart(history = [], transactions = []) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (priceChart) priceChart.destroy();

    const labels = history.map(h => h.date);
    const prices = history.map(h => h.price);
    const sma20 = history.map(h => h.sma20);
    const bbUpper = history.map(h => h.bb_upper);
    const bbLower = history.map(h => h.bb_lower);

    // Buat dataset untuk Buy/Sell markers
    const buyMarkers = history.map(h => {
        const t = transactions.find(tr => tr.timestamp.startsWith(h.date) && tr.action === 'BUY');
        return t ? t.price : null;
    });

    const sellMarkers = history.map(h => {
        const t = transactions.find(tr => tr.timestamp.startsWith(h.date) && tr.action === 'SELL');
        return t ? t.price : null;
    });

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: '#94a3b8',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    zIndex: 5
                },
                {
                    label: 'BB Upper',
                    data: bbUpper,
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'BB Lower',
                    data: bbLower,
                    borderColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 1,
                    pointRadius: 0,
                    fill: '-1', // Fill to the previous dataset (BB Upper)
                    backgroundColor: 'rgba(59, 130, 246, 0.05)'
                },
                {
                    label: 'SMA 20',
                    data: sma20,
                    borderColor: 'rgba(234, 179, 8, 0.5)',
                    borderWidth: 1,
                    pointRadius: 0,
                    borderDash: [5, 5]
                },
                {
                    label: 'BUY',
                    data: buyMarkers,
                    borderColor: '#10b981',
                    backgroundColor: '#10b981',
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    showLine: false,
                    zIndex: 10
                },
                {
                    label: 'SELL',
                    data: sellMarkers,
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    pointStyle: 'triangle',
                    rotation: 180,
                    pointRadius: 8,
                    showLine: false,
                    zIndex: 10
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                tooltip: { backgroundColor: '#1e293b' }
            },
            scales: {
                x: { ticks: { color: '#64748b', maxTicksLimit: 8 } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
            }
        }
    });
}

function renderDetails(targetDiv, data) {
    targetDiv.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center py-2 border-b border-white/5';
        let colorClass = 'text-slate-300';
        if (key.includes('Keuntungan') && value.includes('-')) colorClass = 'text-red-400';
        else if (key.includes('Keuntungan') && !value.includes('0.00')) colorClass = 'text-emerald-400';

        item.innerHTML = `
            <span class="text-sm text-slate-400">${key}</span>
            <span class="font-semibold ${colorClass}">${value}</span>
        `;
        targetDiv.appendChild(item);
    }
}

function renderTransactions(transactions) {
    transactionHistoryBody.innerHTML = '';
    if (!transactions || transactions.length === 0) {
        transactionHistoryBody.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500">Tidak ada transaksi tercatat.</td></tr>';
        return;
    }

    transactions.forEach(t => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition-colors';
        
        const actionColor = t.action === 'BUY' ? 'text-emerald-400' : 'text-red-400';
        const formattedPrice = new Intl.NumberFormat('id-ID').format(t.price);
        const formattedIdr = new Intl.NumberFormat('id-ID').format(t.amount_idr);
        const formattedTotal = new Intl.NumberFormat('id-ID').format(t.total_portfolio);
        
        let profitDisplay = '-';
        if (t.action === 'SELL' && t.profit_idr !== undefined) {
            const pColor = t.profit_idr >= 0 ? 'text-emerald-400' : 'text-red-400';
            profitDisplay = `<span class="${pColor}">${t.profit_idr >= 0 ? '+' : ''}${new Intl.NumberFormat('id-ID').format(t.profit_idr)}</span>`;
        }

        row.innerHTML = `
            <td class="py-4 text-xs font-mono text-slate-400">${t.timestamp}</td>
            <td class="py-4 font-bold ${actionColor}">${t.action}</td>
            <td class="py-4 font-mono">${formattedPrice}</td>
            <td class="py-4">${formattedIdr}</td>
            <td class="py-4 font-bold">${profitDisplay}</td>
            <td class="py-4 font-bold text-blue-400">${formattedTotal}</td>
        `;
        transactionHistoryBody.appendChild(row);
    });
}

backtestBtn.addEventListener('click', async () => {
    backtestBtn.disabled = true;
    loader.style.display = 'block';
    resultArea.style.opacity = '0.5';
    backtestBtn.textContent = 'Simulating...';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/start_backtest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Server Error');
        
        if (result.history) {
            initGrowthChart(result.history.map(h => h.date), result.history.map(h => h.value));
            initPriceChart(result.history, result.transactions);
        }

        renderDetails(backtestReportDiv, result["Laporan Backtest"]);
        renderDetails(portfolioDetailsDiv, result["Detail Portofolio Akhir"]);
        renderTransactions(result.transactions);
        
        resultArea.style.opacity = '1';
        resultArea.classList.remove('translate-y-4');

    } catch (error) {
        console.error("Backtest error:", error);
        alert(`Error: ${error.message}`);
    } finally {
        backtestBtn.disabled = false;
        loader.style.display = 'none';
        backtestBtn.textContent = 'Jalankan Simulasi';
    }
});
