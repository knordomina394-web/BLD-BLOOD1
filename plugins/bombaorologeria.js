//plug-in di blood

let bombaInCorso = {};

let handler = async (m, { conn, text, command }) => {
    let chat = m.chat;

    // --- AVVIO DELLA BOMBA (.bomba) ---
    if (command === 'bomba') {
        if (bombaInCorso[chat]) return m.reply('C\'è già una bomba innescata! Scappa! 🏃‍♂️');

        let durata = Math.floor(Math.random() * (35 - 15 + 1)) + 15; 
        let scadenza = Date.now() + (durata * 1000);
        
        bombaInCorso[chat] = {
            vittima: m.sender,
            scadenza: scadenza,
            timer: setTimeout(() => esplosione(chat, conn), durata * 1000)
        };

        let pName = `@${m.sender.split('@')[0]}`;
        let msg = `⚠️ *ALLERTA BOMBA!* ⚠️\n\n`;
        msg += `Una bomba ticchetta tra le mani di ${pName}!\n\n`;
        msg += `🔥 Hai pochissimi secondi per liberartene!\n`;
        msg += `👉 Scrivi: *passa a @utente* (senza punto iniziale!)`;

        return conn.sendMessage(chat, { text: msg, mentions: [m.sender] }, { quoted: m });
    }
};

// --- GESTORE DI TUTTI I MESSAGGI (Per intercettare il "passa a") ---
handler.before = async function (m, { conn }) {
    let chat = m.chat;
    if (!bombaInCorso[chat]) return;

    let b = bombaInCorso[chat];
    
    // Solo la vittima può passare la bomba
    if (m.sender !== b.vittima) return; 

    // Deve contenere "passa a"
    let contenuto = m.text.toLowerCase();
    if (!contenuto.includes('passa a')) return;

    // Trova il destinatario (tag o risposta)
    let target = null;
    if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
    else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

    if (!target || target === m.sender) return; 

    // --- LOGICA DI PASSAGGIO ---
    clearTimeout(b.timer);
    let tempoRimanente = b.scadenza - Date.now();

    if (tempoRimanente <= 500) return; // Esplosa nel frattempo

    b.vittima = target;
    let pName = `@${target.split('@')[0]}`;
    
    let conferma = `💣 *BOMBA PASSATA!* 💣\n\n`;
    conferma += `L'ordigno è ora nelle mani di ${pName}!\n`;
    conferma += `🧨 Sbrigati! Scrivi: *passa a @user*`;
    
    b.timer = setTimeout(() => esplosione(chat, conn), tempoRimanente);

    await conn.sendMessage(chat, { text: conferma, mentions: [target] }, { quoted: m });
    return true; // Blocca altri handler
};

// --- FUNZIONE ESPLOSIONE ---
async function esplosione(chatId, conn) {
    let b = bombaInCorso[chatId];
    if (!b) return;

    let vTag = `@${b.vittima.split('@')[0]}`;
    let finale = `💥 *BOOOOOOOOM!!!* 💥\n\n`;
    finale += `La bomba è esplosa nelle mani di ${vTag}!\n`;
    finale += `💀 Non è rimasto nulla, solo un po' di fumo...`;

    await conn.sendMessage(chatId, { text: finale, mentions: [b.vittima] });
    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;

export default handler;
