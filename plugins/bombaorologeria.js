//plug-in di blood

let bombaInCorso = {};

let handler = async (m, { conn, text, command }) => {
    let chat = m.chat;

    // --- LOGICA DI PASSAGGIO ---
    if (bombaInCorso[chat]) {
        let b = bombaInCorso[chat];
        
        // Solo la vittima attuale può passare la bomba
        if (m.sender !== b.vittima) return; 

        // Controlla se il messaggio contiene "passa a" (ovunque sia posizionato)
        let contenuto = m.text.toLowerCase();
        if (!contenuto.includes('passa a')) return;

        let target = null;
        if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
        else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

        if (!target) return; 
        if (target === m.sender) return; // Non può passarsela da solo
        
        // Passaggio della bomba
        clearTimeout(b.timer);
        
        let tempoRimanente = Math.floor((b.scadenza - Date.now()));
        if (tempoRimanente <= 500) return; // Se mancano meno di 0.5s è già esplosa

        b.vittima = target;
        let pName = `@${target.split('@')[0]}`;
        
        let conferma = `💣 *BOMBA PASSATA!* 💣\n\n`;
        conferma += `L'ordigno è ora nelle mani di ${pName}!\n`;
        conferma += `🧨 Sbrigati! Scrivi: *passa a @user*`;
        
        // Imposta il nuovo timer con il tempo residuo
        b.timer = setTimeout(() => esplosione(chat, conn), tempoRimanente);

        return conn.sendMessage(chat, { text: conferma, mentions: [target] }, { quoted: m });
    }

    // --- ATTIVAZIONE NUOVA BOMBA (.bomba) ---
    if (command === 'bomba') {
        if (bombaInCorso[chat]) return m.reply('C\'è già una bomba in giro! Scappa! 🏃‍♂️');

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
        msg += `👉 Scrivi: *passa a @utente*`;

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
    finale += `💀 È rimasto solo un cratere...`;

    if (globalThis.eco && globalThis.eco[b.vittima]) {
        globalThis.eco[b.vittima] -= 200;
        finale += `\n💸 Hai perso *200 Soldi Sporchi* di cure mediche.`;
    }

    await conn.sendMessage(chatId, { text: finale, mentions: [b.vittima] });
    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;
// Rimuoviamo restrizioni che potrebbero bloccare l'ascolto
handler.all = true; 

export default handler;
