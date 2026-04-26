const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 5000;
const saltRounds = 10;

app.use(cors());
app.use(express.json());
// Menyajikan semua file dari direktori root proyek
app.use(express.static(path.join(__dirname, '..'))); 

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Dani22334455',
    database: process.env.DB_NAME || 'bot_cuan',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

const pool = mysql.createPool(dbConfig).promise();

// --- KONFIGURASI PENGIRIMAN EMAIL (NODEMAILER) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'algojodua2@gmail.com', 
        pass: 'upfn cwaq rixe miey'   
    }
});

async function sendOtpEmail(email, otp) {
    const mailOptions = {
        from: '"Jurnal Cuan" <no-reply@jurnalcuan.com>',
        to: email,
        subject: 'Kode Verifikasi Anda',
        html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                <h2>Verifikasi Login</h2>
                <p>Gunakan kode di bawah ini untuk masuk ke akun Anda:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                    ${otp}
                </p>
                <p>Kode ini akan kedaluwarsa dalam 5 menit.</p>
                <p style="font-size: 0.9em; color: #888;">Jika Anda tidak meminta kode ini, mohon abaikan email ini.</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
}
// --- END KONFIGURASI PENGIRIMAN EMAIL ---


// --- Rute Penyajian Halaman Statis --- 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Rute ini penting agar pengguna bisa mengakses alat DB Editor
app.get('/db-editor', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'db-crud.html')); 
});


// === API OTENTIKASI & PENGGUNA ===

app.post('/api/request-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email wajib diisi.' });
    }
    try {
        const [users] = await pool.query('SELECT id FROM pengguna WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email tidak terdaftar.' });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(otp, saltRounds);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await pool.query('REPLACE INTO otps (email, otp_hash, expires_at) VALUES (?, ?, ?)', [email, otpHash, expiresAt]);
        try {
            await sendOtpEmail(email, otp);
        } catch (emailErr) {
            console.error("Gagal mengirim email OTP, mungkin kredensial salah:", emailErr.message);
        }
        console.log(`[DEBUG] Mengirim OTP ${otp} ke email ${email}`); // Tambahkan log untuk memudahkan debug jika email gagal
        res.status(200).json({ message: 'OTP telah diproses. (Cek terminal jika email tidak masuk)' });
    } catch (error) {
        console.error("Gagal mengirim OTP:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengirim OTP.' });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Email dan OTP wajib diisi.' });
    }
    try {
        const [otpRecords] = await pool.query('SELECT * FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1', [email]);
        if (otpRecords.length === 0) {
            return res.status(401).json({ message: 'OTP salah atau tidak ditemukan.' });
        }
        const record = otpRecords[0];
        if (new Date() > new Date(record.expires_at)) {
            return res.status(401).json({ message: 'Kode OTP telah kedaluwarsa. Silakan minta lagi.' });
        }
        const match = await bcrypt.compare(otp, record.otp_hash);
        if (!match) {
            return res.status(401).json({ message: 'Kode OTP salah.' });
        }
        const [users] = await pool.query('SELECT id, nama_pengguna, email FROM pengguna WHERE email = ?', [email]);
        const user = users[0];
        await pool.query('DELETE FROM otps WHERE id = ?', [record.id]);
        await pool.query('UPDATE pengguna SET login_terakhir = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        res.json({ message: 'Login berhasil! Mengarahkan...', username: user.nama_pengguna });
    } catch (error) {
        console.error("Gagal verifikasi OTP:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat verifikasi.' });
    }
});

app.post('/api/register', async (req, res) => {
    const { nama_pengguna, email, password, nama_lengkap } = req.body;
    if (!nama_pengguna || !email || !password) {
        return res.status(400).json({ message: 'Nama pengguna, email, dan kata sandi wajib diisi.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = 'INSERT INTO pengguna (nama_pengguna, email, kata_sandi_hash, nama_lengkap) VALUES (?, ?, ?, ?)';
        await pool.query(query, [nama_pengguna, email, hashedPassword, nama_lengkap || null]);
        res.status(201).json({ message: 'Pendaftaran berhasil! Silakan login.' });
    } catch (error) {
        console.error("KESALAHAN SAAT PENDAFTARAN:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Nama pengguna atau email sudah terdaftar.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});


// === API UNTUK DB-CRUD.HTML (DATABASE EDITOR) ===

// Cek status koneksi DB
app.get('/api/status', async (req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'connected' }); } catch (e) { res.status(500).json({ status: 'disconnected', message: e.message }); }});

// Dapatkan semua nama tabel
app.get('/api/tables', async (req, res) => { try { const [rows] = await pool.query('SHOW TABLES'); res.json(rows.map(r => Object.values(r)[0])); } catch (e) { res.status(500).json({ message: e.message }); }});

// Dapatkan skema dan primary key dari sebuah tabel
app.get('/api/schema/:tableName', async (req, res) => { try { const { tableName } = req.params; const [schema] = await pool.query(`DESCRIBE ??`, [tableName]); const pkQuery = `SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`; const [pkRows] = await pool.query(pkQuery, [tableName]); const pk = pkRows.length > 0 ? pkRows[0].Column_name : null; res.json({ schema, primaryKey: pk }); } catch (e) { res.status(500).json({ message: e.message }); }});

// Eksekusi query SQL mentah
app.post('/api/execute-sql', async (req, res) => { try { const { query } = req.body; if (!query) { return res.status(400).json({ message: 'Query tidak boleh kosong.' }); } const [results] = await pool.query(query); if (Array.isArray(results)) { res.json({ data: results }); } else { res.json({ message: `OK, ${results.affectedRows} baris terpengaruh.` }); } } catch (e) { res.status(400).json({ message: e.message }); }});

// Tambah baris baru
app.post('/api/add-row/:tableName', async (req, res) => { try { const { tableName } = req.params; await pool.query(`INSERT INTO ?? SET ?`, [tableName, req.body]); res.status(201).json({ message: 'Baris berhasil ditambahkan.' }); } catch (e) { res.status(500).json({ message: e.message }); }});

// Update satu sel
app.post('/api/update-cell', async (req, res) => { try { const { tableName, pkColumn, pkValue, columnName, newValue } = req.body; await pool.query(`UPDATE ?? SET ?? = ? WHERE ?? = ?`, [tableName, columnName, newValue, pkColumn, pkValue]); res.json({ message: 'Sel berhasil diperbarui.' }); } catch (e) { res.status(500).json({ message: e.message }); }});

// Hapus baris
app.delete('/api/delete-row', async (req, res) => { try { const { tableName, pkColumn, pkValue } = req.body; await pool.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, pkColumn, pkValue]); res.json({ message: 'Baris berhasil dihapus.' }); } catch (e) { res.status(500).json({ message: e.message }); }});

// Ubah nama kolom
app.post('/api/rename-column', async (req, res) => { try { const { tableName, oldName, newName, type } = req.body; await pool.query(`ALTER TABLE ?? CHANGE COLUMN ?? ?? ${type}`, [tableName, oldName, newName]); res.json({ message: `Kolom berhasil diganti namanya.` }); } catch (e) { res.status(500).json({ message: e.message }); }});

// Tambah kolom baru
app.post('/api/add-column', async (req, res) => { try { const { tableName, columnName, columnType } = req.body; await pool.query(`ALTER TABLE ?? ADD COLUMN ?? ${columnType}`, [tableName, columnName]); res.json({ message: 'Kolom baru berhasil ditambahkan.' }); } catch (e) { res.status(500).json({ message: e.message }); }});


// --- INISIALISASI & START SERVER ---

async function initializeDatabase() {
    console.log("Memeriksa dan menyiapkan tabel yang diperlukan...");
    try {
        const createOtpTableQuery = `
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                otp_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createOtpTableQuery);
        console.log("Tabel 'otps' sudah siap.");

        const createPenggunaTableQuery = `
            CREATE TABLE IF NOT EXISTS pengguna (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_pengguna VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                kata_sandi_hash VARCHAR(255) NOT NULL,
                nama_lengkap VARCHAR(100),
                dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                login_terakhir DATETIME
            );
        `;
        await pool.query(createPenggunaTableQuery);
        console.log("Tabel 'pengguna' sudah siap.");

    } catch (error) {
        console.error("Gagal menginisialisasi tabel database:", error);
        process.exit(1); 
    }
}

app.listen(port, async () => {
    await initializeDatabase();
    console.log(`✅ Server siap dan berjalan di http://localhost:${port}`);
});
