const syncBtn = document.getElementById('syncBtn');
const logArea = document.getElementById('logArea');
const pairSelect = document.getElementById('pair');
const intervalSelect = document.getElementById('interval');
const daysInput = document.getElementById('days');

const API_URL = '/api';

function addLog(msg, isError = false) {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = `mb-1 ${isError ? 'text-red-400' : 'text-emerald-400'}`;
    div.innerHTML = `<span class="text-slate-600">[${time}]</span> ${msg}`;
    logArea.appendChild(div);
    logArea.scrollTop = logArea.scrollHeight;
}

async function loadCoins() {
    try {
        const response = await fetch(`${API_URL}/coins`);
        const coins = await response.json();
        pairSelect.innerHTML = '';
        coins.forEach(coin => {
            const option = document.createElement('option');
            option.value = coin.symbol;
            option.textContent = coin.name;
            pairSelect.appendChild(option);
        });
        addLog("Daftar koin berhasil dimuat.");
    } catch (e) {
        addLog("Gagal memuat daftar koin", true);
    }
}

loadCoins();

syncBtn.addEventListener('click', async () => {
    const pair = pairSelect.value;
    const interval = intervalSelect.value;
    const days = daysInput.value;

    syncBtn.disabled = true;
    syncBtn.innerHTML = "⏳ Proses Mengambil Data...";
    addLog(`Meminta data ${pair} interval ${interval} selama ${days} hari...`);

    try {
        const response = await fetch(`${API_URL}/fetch_data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pair, days: parseInt(days), interval }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Server Error');

        addLog(`✅ Sukses: ${result.message}`);
        syncBtn.classList.replace('bg-emerald-600', 'bg-blue-600');
        syncBtn.innerHTML = "Berhasil! Ambil Lagi?";
        
        setTimeout(() => {
            syncBtn.classList.replace('bg-blue-600', 'bg-emerald-600');
            syncBtn.innerHTML = "Ambil & Simpan ke DB";
            syncBtn.disabled = false;
        }, 3000);

    } catch (error) {
        addLog(`❌ Gagal: ${error.message}`, true);
        syncBtn.innerHTML = "Gagal! Coba Lagi";
        syncBtn.disabled = false;
    }
});
