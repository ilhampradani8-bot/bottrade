use std::error::Error;
use serde::Deserialize;
use serde_json::json;
use chrono::{Local};

#[derive(Debug, Deserialize)]
struct AiMarketingResponse {
    topic: String,
    caption: String,
    hours_until_next_post: u32,
}

pub async fn generate_target_hit_ad(
    groq_key: &str,
    model: &str,
    coin: &str,
    direction: &str,
    entry: f64,
    target: f64,
    duration_mins: Option<i64>,
    lang: &str,
) -> Result<String, Box<dyn Error>> {
    let coin_clean = coin.replace("USDT", "");
    let direction_str = if lang == "en" {
        if direction == "UP" { "🟢 UP (BULLISH)" } else { "🔴 DOWN (BEARISH)" }
    } else {
        if direction == "UP" { "🟢 NAIK (BULLISH)" } else { "🔴 TURUN (BEARISH)" }
    };
    let duration_str = match duration_mins {
        Some(mins) => {
            if lang == "en" {
                format!("{} minutes", mins)
            } else {
                format!("{} menit", mins)
            }
        }
        None => {
            if lang == "en" {
                "a few minutes".to_string()
            } else {
                "beberapa menit".to_string()
            }
        }
    };

    let performance_data = if lang == "en" {
        format!(
            "Coin: {}\nPosition: {}\nEntry Price: ${:.4}\nTarget Price: ${:.4}\nDuration: {}",
            coin_clean, direction_str, entry, target, duration_str
        )
    } else {
        format!(
            "Koin: {}\nPosisi: {}\nHarga Masuk: ${:.4}\nHarga Target: ${:.4}\nDurasi: {}",
            coin_clean, direction_str, entry, target, duration_str
        )
    };

    let target_channel = "X (Twitter) & Threads";
    let character_limit_desc = if lang == "en" {
        "VERY IMPORTANT: The text must be ultra-short (maximum 240 characters) to fit the 280-character limit on Twitter (X) and Threads."
    } else {
        "SANGAT PENTING: Teks harus ultra-singkat (maksimal 240 karakter) agar pas untuk batas 280 karakter di Twitter (X) dan Threads."
    };
    let tag = "#TradingSafe #Crypto";

    let promo_str = if lang == "en" {
        "🎁 FREE BETA access: invite 3 friends to join!"
    } else {
        "🎁 Akses BETA GRATIS: ajak 3 teman bergabung!"
    };
    
    let cta_str = if lang == "en" {
        "Click the link in bio to join!"
    } else {
        "Klik tautan di bio untuk join!"
    };

    let language_name = if lang == "en" { "English" } else { "Bahasa Indonesia" };

    let prompt = format!(
        "Role: Anda adalah Senior Copywriter FinTech, Pakar Pemasaran Kripto, dan Brand Strategist untuk TradingSafe (aplikasi asisten trading otomatis premium dengan desain modern bersih ala Apple).\n\n\
        Tugas Anda adalah membuat 1 caption media sosial ({}) yang menarik, elegan, dan meyakinkan untuk mempromosikan sinyal target hit yang baru saja diraih:\n\n\
        {}\n\n\
        Aturan Penulisan (WAJIB Diikuti):\n\
        1. GAYA BAHASA: Premium (Apple-vibe), profesional, dan mudah dipahami oleh khalayak umum. Gunakan emoji secara kreatif.\n\
        2. DILARANG MENGGUNAKAN BAHASA TEKNIS RUST/API/VPS: Jangan sebutkan kata-kata teknis komputer/sistem seperti 'Rust', 'latency', 'non-custodial', 'API key', 'database', 'VPS', 'backend'.\n\
        3. TATA LETAK: Sajikan data performa di atas dalam format bullet point yang bersih menggunakan emoji representatif.\n\
        4. INTEGRASI IDE ORIGINAL (DARI PROPOSAL): Jelaskan keunggulan asisten keuangan ini yang bekerja secara kalkulatif tanpa emosi keserakahan/ketakutan, transparan 100%, dan dana aman di dompet Anda sendiri.\n\
        5. PROMO AKTIF: Masukkan kalimat promosi berikut: \"{}\"\n\
        6. CALL TO ACTION (CTA): \"{}\"\n\
        7. HASHTAG WAJIB: Masukkan hanya tag `{}` di bagian paling akhir caption.\n\
        8. BATASAN PANJANG TEKS (KRUSIAL):\n\
           {}\n\
        9. FORMATTING: Hanya gunakan format bold `*teks*` untuk penekanan. JANGAN gunakan header markdown (#, ##), jangan gunakan list markdown (*, -), dan jangan gunakan link. Pastikan aman dikirim ke WhatsApp dan Telegram.\n\n\
        Hasilkan Caption dalam {}:",
        target_channel,
        performance_data,
        promo_str,
        cta_str,
        tag,
        character_limit_desc,
        language_name
    );

    let url = "https://api.groq.com/openai/v1/chat/completions";
    let payload = json!({
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    let client = reqwest::Client::new();
    let res = client.post(url)
        .header("Authorization", format!("Bearer {}", groq_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await?;
        return Err(format!("Groq API error status={}: {}", status, err_text).into());
    }

    let res_json: serde_json::Value = res.json().await?;
    if let Some(text) = res_json["choices"][0]["message"]["content"].as_str() {
        let mut caption = text.trim().to_string();
        caption = caption.replace("#threads", "").replace("#facebook", "");
        if !caption.contains("#TradingSafe") {
            caption = format!("{}\n\n#TradingSafe #Crypto", caption);
        }
        Ok(caption)
    } else {
        Err("Failed to parse text from Groq response".into())
    }
}

pub async fn generate_dynamic_marketing_post(
    groq_key: &str,
    model: &str,
    market_data: &str,
    recent_topics: &[String],
    lang: &str,
) -> Result<(String, String, u32), Box<dyn Error>> {
    let target_channel = "X (Twitter) & Threads";
    let character_limit_desc = if lang == "en" {
        "VERY IMPORTANT: The text must be ultra-short (maximum 240 characters) to fit the 280-character limit on Twitter (X) and Threads."
    } else {
        "SANGAT PENTING: Teks harus ultra-singkat (maksimal 240 karakter) agar pas untuk batas 280 karakter di Twitter (X) dan Threads."
    };
    let tag = "#TradingSafe #Crypto";

    let recent_topics_str = if recent_topics.is_empty() {
        "None/Belum ada".to_string()
    } else {
        recent_topics.join(", ")
    };

    let language_name = if lang == "en" { "English" } else { "Bahasa Indonesia" };

    let prompt = format!(
        "Role: Anda adalah AI Marketing Director dan Senior Copywriter untuk TradingSafe (aplikasi asisten trading otomatis premium dengan desain modern bersih ala Apple).\n\n\
        Tugas Anda adalah menghasilkan dua hal secara otomatis:\n\
        1. Konten iklan pemasaran (caption) premium khusus untuk media sosial {}.\n\
        2. Jadwal posting berikutnya (dalam jumlah jam dari sekarang, tentukan secara dinamis antara 5 hingga 8 jam).\n\n\
        Panduan Pembuatan Konten:\n\
        - Topik Konten: Pilih secara dinamis salah satu topik utama berikut untuk menjaga keberagaman ide pemasaran:\n\
          * Visi & Misi Perusahaan: Menghilangkan hambatan emosi (keserakahan & ketakutan) dengan asisten trading kalkulatif 24 jam. Demokratisasi alat trading kelas institusi untuk trader ritel dengan transparansi penuh.\n\
          * Keamanan Dana: Dana 100% tetap aman di dompet digital Anda sendiri tanpa pengalihan aset. Kami hanya jembatan teknologi pintar.\n\
          * Tanpa Bagi Hasil (No Profit Fee): Keanggotaan langganan bulanan tetap yang hemat, di mana 100% profit trading sepenuhnya menjadi milik Anda.\n\
          * Desain Antarmuka: Filosofi visual minimalis premium yang memanjakan mata, dirancang khusus untuk mengurangi kelelahan informasi saat memantau pasar.\n\
          * Transparansi Sinyal: Sinyal prediksi real-time yang dipublikasikan secara terbuka tanpa ada yang disembunyikan atau dihapus untuk kejujuran mutlak.\n\
          * Promo Komunitas: Akses uji rilis gratis dengan mengajak 3 teman bergabung dengan komunitas kami.\n\
        - HINDARI REPETISI TOPIK (LOG BARU): Daftar topik yang sudah diposting baru-baru ini: [{}]. JANGAN pilih topik dari daftar tersebut agar variasi konten selalu segar!\n\
        - Data Market Terkini: Sisipkan data pasar ini jika dirasa relevan dengan topik pilihan Anda: {}\n\
        - Penggunaan Emoji: Gunakan emoji yang relevan untuk mempercantik tulisan.\n\
        - DILARANG MENGGUNAKAN BAHASA TEKNIS RUST/API/VPS: Jangan sebutkan kata-kata teknis komputer/sistem seperti 'Rust', 'latency', 'non-custodial', 'API key', 'database', 'VPS', 'backend'.\n\
        - HASHTAG WAJIB: Masukkan hanya tag `{}` di bagian paling bawah.\n\
        - BATASAN PANJANG TEKS (KRUSIAL):\n\
           {}\n\
        - Batasan Formatting: Hanya gunakan format bold `*teks*` untuk penekanan. JANGAN gunakan header markdown (#, ##), jangan gunakan list markdown (*, -), dan jangan gunakan link. Pastikan polos dan spasi paragraf rapi.\n\
        - Bahasa: {}.\n\n\
        Format Output yang WAJIB dihasilkan adalah JSON valid dengan skema berikut:\n\
        {{\n\
          \"topic\": \"topik yang dipilih dari daftar di atas\",\n\
          \"caption\": \"isi teks caption iklan di sini (dalam {})\",\n\
          \"hours_until_next_post\": 6\n\
        }}\n\n\
        Hasilkan output JSON sekarang:",
        target_channel,
        recent_topics_str,
        market_data,
        tag,
        character_limit_desc,
        language_name,
        language_name
    );

    let url = "https://api.groq.com/openai/v1/chat/completions";
    let payload = json!({
        "model": model,
        "response_format": { "type": "json_object" },
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    let client = reqwest::Client::new();
    let res = client.post(url)
        .header("Authorization", format!("Bearer {}", groq_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await?;
        return Err(format!("Groq API error status={}: {}", status, err_text).into());
    }

    let res_json: serde_json::Value = res.json().await?;
    let content_raw = res_json["choices"][0]["message"]["content"].as_str()
        .ok_or("No content in response choices")?;

    let parsed: AiMarketingResponse = serde_json::from_str(content_raw)?;
    
    // Validasi agar hours_until_next_post berada dalam range 5 hingga 8 jam (3 - 5 postingan sehari)
    let hours = if parsed.hours_until_next_post < 5 || parsed.hours_until_next_post > 8 {
        let random_hour = (Local::now().timestamp() % 4) as u32 + 5; // 5, 6, 7, atau 8
        random_hour
    } else {
        parsed.hours_until_next_post
    };

    let mut caption = parsed.caption.trim().to_string();
    caption = caption.replace("#threads", "").replace("#facebook", "");
    if !caption.contains("#TradingSafe") {
        caption = format!("{}\n\n#TradingSafe #Crypto", caption);
    }

    Ok((caption, parsed.topic, hours))
}

pub fn get_fallback_target_hit_ad(coin: &str, direction: &str, entry: f64, target: f64, duration_mins: Option<i64>, lang: &str) -> String {
    let coin_clean = coin.replace("USDT", "");
    if lang == "en" {
        let direction_str = if direction == "UP" { "🟢 UP" } else { "🔴 DOWN" };
        let duration_str = match duration_mins {
            Some(mins) => format!("{}m", mins),
            None => "quick".to_string(),
        };

        format!(
            "🎯 *TARGET HIT: {}!*\n\n\
            📈 Position: {}\n\
            💵 Entry: ${:.4}\n\
            🎯 Target: ${:.4}\n\
            ⏱️ Duration: {}\n\n\
            🎁 FREE BETA access: invite 3 friends!\n\n\
            #TradingSafe #Crypto",
            coin_clean, direction_str, entry, target, duration_str
        )
    } else {
        let direction_str = if direction == "UP" { "🟢 NAIK" } else { "🔴 TURUN" };
        let duration_str = match duration_mins {
            Some(mins) => format!("{}m", mins),
            None => "cepat".to_string(),
        };

        format!(
            "🎯 *TARGET HIT: {}!*\n\n\
            📈 Posisi: {}\n\
            💵 Masuk: ${:.4}\n\
            🎯 Target: ${:.4}\n\
            ⏱️ Durasi: {}\n\n\
            🎁 Akses BETA GRATIS: invite 3 teman!\n\n\
            #TradingSafe #Crypto",
            coin_clean, direction_str, entry, target, duration_str
        )
    }
}

pub fn get_fallback_marketing_post(lang: &str) -> (String, u32) {
    let now = Local::now();
    let pilar_index = (now.timestamp() % 4) as usize;
    let tag = "#TradingSafe #Crypto";

    let caption = if lang == "en" {
        match pilar_index {
            0 => format!(
                "🛡️ *Safe & Transparent Trading*\n\n\
                TradingSafe vision: bringing a 100% transparent professional AI trading assistant for retail traders, free from emotion & manipulation.\n\n\
                🎁 Invite 3 friends for free BETA access!\n\n\
                {}", tag
            ),
            1 => format!(
                "⚡ *Instant Execution, No Delay*\n\n\
                TradingSafe is designed with millisecond execution speed to lock in positions before the market turns around.\n\n\
                🎁 Invite 3 friends for free BETA access!\n\n\
                {}", tag
            ),
            2 => format!(
                "💎 *Funds Stay in Your Wallet*\n\n\
                100% Security. Your funds remain in your own exchange account; TradingSafe connects smart technology.\n\n\
                🎁 Invite 3 friends for free BETA access!\n\n\
                {}", tag
            ),
            _ => format!(
                "✨ *Premium Minimalist Design*\n\n\
                Apple-vibe visual interface reduces information fatigue while you monitor market movements.\n\n\
                🎁 Invite 3 friends for free BETA access!\n\n\
                {}", tag
            )
        }
    } else {
        match pilar_index {
            0 => format!(
                "🛡️ *Trading Aman & Transparan*\n\n\
                Visi TradingSafe: membawa asisten AI trading profesional ritel 100% transparan tanpa emosi & manipulasi.\n\n\
                🎁 Invite 3 teman untuk akses BETA gratis!\n\n\
                {}", tag
            ),
            1 => format!(
                "⚡ *Eksekusi Instan Tanpa Delay*\n\n\
                TradingSafe dirancang dengan eksekusi secepat milidetik demi mengunci posisi sebelum pasar berbalik arah.\n\n\
                🎁 Invite 3 teman untuk akses BETA gratis!\n\n\
                {}", tag
            ),
            2 => format!(
                "💎 *Dana Tetap di Dompet Anda*\n\n\
                Keamanan 100%. Dana Anda tetap di exchange Anda sendiri, TradingSafe menghubungkan teknologi pintar.\n\n\
                🎁 Invite 3 teman untuk akses BETA gratis!\n\n\
                {}", tag
            ),
            _ => format!(
                "✨ *Desain Minimalis Premium*\n\n\
                Tampilan visual ala Apple mengurangi kelelahan informasi saat Anda memantau pergerakan pasar.\n\n\
                🎁 Invite 3 teman untuk akses BETA gratis!\n\n\
                {}", tag
            )
        }
    };

    let hours = (now.timestamp() % 4) as u32 + 5; // 5 - 8 jam
    (caption, hours)
}
