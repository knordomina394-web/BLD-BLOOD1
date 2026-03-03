//plug-in di blood

let bombaInCorso = {};
let handler = async (m, { conn, command, usedPrefix }) => {
    let chat = m.chat;

    // --- SE LA BOMBA È GIÀ ATTIVA ---
    if (bombaInCorso[chat]) {
        let b = bombaInCorso[chat];
        if (m.sender !== b.vittima) return; // Solo la vittima può passare la bomba

        let target = null;
        if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
        else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

        if (!target) return; // Se non tagga nessuno, non succede nulla
        if (target === m.sender) return m.reply('Non puoi ridarti la bomba da solo, passala a qualcun altro! 🏃‍♂️');
        if (target === conn.user.jid) return m.reply('Bello tentativo, ma io sono un bot, le bombe non mi fanno nulla! 😎');

        // Passaggio della bomba
        clearTimeout(b.timer);
        b.vittima = target;
        let pName = `@${target.split('@')[0]}`;
        
        let tempoRimanente = Math.floor((b.scadenza - Date.now()) / 1000);
        if (tempoRimanente <= 0) return; // Troppo tardi

        let msg = `💣 *BOMBA PASSATA!* 💣\n\n`;
        msg += `Corri ${pName}, ce l'hai tu! Tagga qualcuno velocemente per passarla!`;
        
        // Nuovo timer con il tempo rimanente
        b.timer = setTimeout(() => esplosione(chat, conn), tempoRimanente * 1000);

        return conn.sendMessage(chat, { text: msg, mentions: [target] }, { quoted: m });
    }

    // --- ATTIVAZIONE NUOVA BOMBA (.bomba) ---
    if (command === 'bomba') {
        let casuale = Math.floor(Math.random() * (40 - 15 + 1)) + 15; // Durata tra 15 e 40 secondi
        let scadenza = Date.now() + (casuale * 1000);
        
        bombaInCorso[chat] = {
            vittima: m.sender,
            scadenza: scadenza,
            timer: setTimeout(() => esplosione(chat, conn), casuale * 1000)
        };

        let pName = `@${m.sender.split('@')[0]}`;
        let msg = `⚠️ *ALLERTA BOMBA!* ⚠️\n\n`;
        msg += `Qualcuno ha lasciato una bomba innescata nelle mani di ${pName}!\n\n`;
        msg += `🧨 Hai pochissimi secondi per passarla a qualcun altro taggandolo!\n`;
        msg += `👉 Esempio: Tagga qualcuno o rispondi a un suo messaggio.`;

        return conn.sendMessage(chat, { text: msg, mentions: [m.sender] }, { quoted: m });
    }
};

// --- FUNZIONE ESPLOSIONE ---
async function esplosione(chatId, conn) {
    let b = bombaInCorso[chatId];
    if (!b) return;

    let vTag = `@${b.vittima.split('@')[0]}`;
    let finale = `💥 *BOOOOOOOOM!!!* 💥\n\n`;
    finale += `La bomba è esplosa nelle mani di ${vTag}!\n`;
    finale += `💀 È rimasto solo un mucchietto di cenere e qualche pezzo di tastiera...`;

    await conn.sendMessage(chatId, { text: finale, mentions: [b.vittima] });
    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;

export default handler;
