//plug-in di blood

let bombaInCorso = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let chat = m.chat;

    // --- LOGICA DI PASSAGGIO (Se la bomba è attiva) ---
    if (bombaInCorso[chat]) {
        let b = bombaInCorso[chat];
        
        // Solo la vittima attuale può interagire
        if (m.sender !== b.vittima) return; 

        // CONTROLLO RIGOROSO: deve iniziare con ". passa a" o ".passa a"
        let msg = m.text.toLowerCase().trim();
        if (!msg.startsWith('.') || !msg.includes('passa a')) return;

        let target = null;
        if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
        else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

        if (!target) return; 
        if (target === m.sender) return m.reply('Non puoi ridarti la bomba da solo, passala a qualcun altro! 🏃‍♂️');
        if (target === conn.user.jid) return m.reply('Bello tentativo, ma io sono un bot, le bombe non mi fanno nulla! 😎');

        // Passaggio della bomba
        clearTimeout(b.timer);
        b.vittima = target;
        let pName = `@${target.split('@')[0]}`;
        
        let tempoRimanente = Math.floor((b.scadenza - Date.now()) / 1000);
        if (tempoRimanente <= 0) return; // Se esplode mentre scriveva

        let conferma = `💣 *BOMBA PASSATA!* 💣\n\n`;
        conferma += `L'ordigno è ora nelle mani di ${pName}!\n`;
        conferma += `🧨 Sbrigati! Scrivi: *. passa a @user*`;
        
        // Ripristina il timer con il tempo residuo
        b.timer = setTimeout(() => esplosione(chat, conn), tempoRimanente * 1000);

        return conn.sendMessage(chat, { text: conferma, mentions: [target] }, { quoted: m });
    }

    // --- ATTIVAZIONE NUOVA BOMBA (.bomba) ---
    if (command === 'bomba') {
        let casuale = Math.floor(Math.random() * (40 - 15 + 1)) + 15; // Timer tra 15 e 40 secondi
        let scadenza = Date.now() + (casuale * 1000);
        
        bombaInCorso[chat] = {
            vittima: m.sender,
            scadenza: scadenza,
            timer: setTimeout(() => esplosione(chat, conn), casuale * 1000)
        };

        let pName = `@${m.sender.split('@')[0]}`;
        let msg = `⚠️ *ALLERTA BOMBA!* ⚠️\n\n`;
        msg += `Una bomba ticchetta tra le mani di ${pName}!\n\n`;
        msg += `🔥 Hai pochissimi secondi per liberartene!\n`;
        msg += `👉 DEVI SCRIVERE: *. passa a @utente*`;

        return conn.sendMessage(chat, { text: msg, mentions: [m.sender] }, { quoted: m });
    }
};

// --- FUNZIONE ESPLOSIONE ---
async function esplosione(chatId, conn) {
    let b = bombaInCorso[chatId];
    if (!b) return;

    let vTag = `@${b.vittima.split('@')[0]}`;
    let finale = `💥 *BOOOOOOOOM!!!* 💥\n\n`;
    finale += `La bomba è esplosa fragorosamente nelle mani di ${vTag}!\n`;
    finale += `💀 Non è rimasto nulla, solo un po' di fumo e silenzio...`;

    // Opzionale: detrazione soldi
    if (globalThis.eco && globalThis.eco[b.vittima]) {
        let danno = 200;
        globalThis.eco[b.vittima] -= danno;
        finale += `\n💸 Hai perso *${danno} Soldi Sporchi* per le spese funebri.`;
    }

    await conn.sendMessage(chatId, { text: finale, mentions: [b.vittima] });
    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;

export default handler;
