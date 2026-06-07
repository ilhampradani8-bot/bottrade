const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from absolute path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());

const PORT = process.env.WHATSAPP_PORT || 5001;
const GROUP_ID = process.env.WHATSAPP_GROUP_ID; // e.g. "1203632389239823@g.us"

let sock = null;

async function connectToWhatsApp() {
    // MultiFileAuthState persists the login session so you scan QR only ONCE
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, 'auth_info'));

    // Fetch the latest WhatsApp Web version to prevent 405 Connection Failure
    let version = [2, 3000, 1037641644]; // Fallback modern version
    try {
        const latest = await fetchLatestBaileysVersion();
        if (latest && latest.version) {
            version = latest.version;
            console.log(`ℹ️ Fetched latest WhatsApp Web version from server: ${version.join('.')}`);
        }
    } catch (e) {
        console.log('⚠️ Failed to fetch latest version, using compatible fallback:', version.join('.'));
    }

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        browser: ['TradingSafe Bot', 'Chrome', '20.0.0'],
        defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n📸 SCAN THIS QR CODE WITH WHATSAPP ON YOUR PHONE:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('⚠️ WhatsApp connection closed. Reconnecting in 5 seconds...', lastDisconnect?.error);
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('\n✅ WHATSAPP CONNECTED & READY 24/7!');
            if (!GROUP_ID) {
                console.log('💡 TIP: Add the Bot to your group, then type "!groupid" in the group chat to get the Group ID!');
            } else {
                console.log(`🎯 Configured WhatsApp Group ID: ${GROUP_ID}`);
            }
        }
    });

    // Event 1: Welcome message when a new participant joins the group (Anti-Ban delayed)
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update;
        
        if (action === 'add') {
            for (const participant of participants) {
                const jidNum = participant.split('@')[0];
                let welcomeMsg = "";

                if (id === "120363408324880520@g.us") {
                    // Investor Group (Indonesian)
                    welcomeMsg = `Selamat bergabung @${jidNum} di *Investor Group*! 🙏💼\n\nMohon sempatkan untuk membaca *Deskripsi Grup* kami, karena di sana terdapat link proposal lengkap mengenai proyek TradingSafe. Selamat berdiskusi! 📈🚀`;
                } else if (id === "120363409651722299@g.us") {
                    // DOWN Predictions Group (English)
                    welcomeMsg = `Hello @${jidNum}! Welcome to the *TradingSafe - Down Predictions* group! 📉🚀\n\nHere you will receive the most accurate 24-hour DOWN market prediction signals automatically. Happy trading! 🤝💼`;
                } else if (GROUP_ID && id === GROUP_ID) {
                    // Main UP Predictions Group (now English)
                    welcomeMsg = `Hello @${jidNum}! Welcome to the *TradingSafe - Up Predictions* group! 📈🚀\n\nHere you will receive the most accurate 24-hour UP market prediction signals automatically. Happy trading! 🤝💼`;
                }
 
                // Only send if the group has a configured welcome message
                if (welcomeMsg) {
                    try {
                        // Random delay of 2 to 5 seconds to look natural (Anti-Ban!)
                        const delay = Math.floor(Math.random() * 3000) + 2000;
                        await new Promise(resolve => setTimeout(resolve, delay));
 
                        await sock.sendMessage(id, {
                            text: welcomeMsg,
                            mentions: [participant]
                        });
                        console.log(`👋 Welcome message sent to ${participant} in group ${id}`);
                    } catch (err) {
                        console.error(`❌ Failed to send welcome message to ${participant} in group ${id}:`, err);
                    }
                }
            }
        }
    });

    // Event 2: Command helper to fetch group ID
    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && m.type === 'notify') {
            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || "";
            const from = message.key.remoteJid;

            if (text.trim().toLowerCase() === '!ping') {
                await sock.sendMessage(from, { text: 'Pong! Bot is active. 🏓' });
            }

            if (text.trim().toLowerCase() === '!groupid') {
                if (from.endsWith('@g.us')) {
                    await sock.sendMessage(from, { text: `Group ID ini adalah:\n*${from}*` });
                    console.log(`🎯 Group ID Requested & Dispatched for: ${from}`);
                } else {
                    await sock.sendMessage(from, { text: 'Perintah ini hanya dapat dijalankan di dalam grup!' });
                }
            }
        }
    });
}

// REST API for Rust Analysis Engine to trigger broadcast
app.post('/send', async (req, res) => {
    const { message, group_id, quoted_msg_id } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message payload is required' });
    }

    if (!sock) {
        return res.status(503).json({ error: 'WhatsApp service is not initialized yet' });
    }

    const targetGroupId = group_id || GROUP_ID;
    if (!targetGroupId) {
        return res.status(400).json({ error: 'Target Group ID is not configured' });
    }

    const options = {};
    if (quoted_msg_id) {
        options.quoted = {
            key: {
                remoteJid: targetGroupId,
                fromMe: true,
                id: quoted_msg_id
            },
            message: {
                conversation: ""
            }
        };
    }

    try {
        const sentMsg = await sock.sendMessage(targetGroupId, { text: message }, options);
        console.log(`📤 Message successfully broadcast to WhatsApp group ${targetGroupId}`);
        return res.json({ success: true, message_id: sentMsg.key.id });
    } catch (err) {
        console.error(`❌ Failed to send message to WhatsApp group ${targetGroupId}:`, err);
        return res.status(500).json({ error: err.toString() });
    }
});

app.get('/group-invites', async (req, res) => {
    if (!sock) {
        return res.status(503).json({ error: 'WhatsApp service is not initialized yet' });
    }
    const groups = {
        "Indonesian_Main_UP": "120363427987942506@g.us",
        "Indonesian_DOWN": "120363409651722299@g.us",
        "English_Main": "120363409228885921@g.us",
        "Investor": "120363408324880520@g.us",
        "Marketing": "120363426456935344@g.us"
    };

    const results = {};
    for (const [name, jid] of Object.entries(groups)) {
        try {
            const code = await sock.groupInviteCode(jid);
            results[name] = { jid, link: `https://chat.whatsapp.com/${code}` };
        } catch (err) {
            results[name] = { jid, error: err.toString() };
        }
    }
    return res.json(results);
});

app.post('/group-rename', async (req, res) => {
    const { group_id, name } = req.body;
    if (!group_id || !name) {
        return res.status(400).json({ error: 'group_id and name are required' });
    }
    if (!sock) {
        return res.status(503).json({ error: 'WhatsApp service is not initialized yet' });
    }
    try {
        await sock.groupUpdateSubject(group_id, name);
        console.log(`✏️ Group ${group_id} renamed to "${name}"`);
        return res.json({ success: true, message: `Group renamed to "${name}" successfully` });
    } catch (err) {
        console.error(`❌ Failed to rename group ${group_id}:`, err);
        return res.status(500).json({ error: err.toString() });
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Node.js WhatsApp Bridge is listening on http://127.0.0.1:${PORT}`);
});

connectToWhatsApp();
