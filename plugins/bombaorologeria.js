// Plugin Bomba a orologeria - Adattato con sistema economico Euro/Exp
let bombaInCorso = {};

const playAgainButtons = () => [{
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: 'Innesca un\'altra!', id: `.bomba` })
}];

let handler = async (m, { conn, text, command, isAdmin, isBotAdmin }) => {
    let chat = m.chat;

    // --- AVVIO DELLA BOMBA ---
    if (command === 'bomba') {
        if (bombaInCorso[chat]) return m.reply('⚠️ C\'è già una bomba innescata! Scappa! 🏃‍♂️');

        // Cooldown per evitare spam (5 secondi)
        const cooldownKey = `bomba_${chat}`;
        const lastGame = global.cooldowns?.[cooldownKey] || 0;
        const now = Date.now();
        if (now - lastGame < 5000) return m.reply(`⏳ Aspetta un attimo, la polvere da sparo deve ancora depositarsi!`);
        
        global.cooldowns = global.cooldowns || {};
        global.cooldowns[cooldownKey] = now;

        let durata = Math.floor(Math.random() * (35 - 15 + 1)) + 15; 
        let scadenza = Date.now() + (durata * 1000);

        bombaInCorso[chat] = {
            vittima: m.sender,
            passaggi: [], // Tracciamo chi l'ha toccata per dare premi
            scadenza: scadenza,
            timer: setTimeout(() => esplosione(chat, conn, m), durata * 1000)
        };

        let pName = `@${m.sender.split('@')[0]}`;
        let startCaption = `ㅤ⋆｡˚『 ╭ \`⚠️ ALLERTA BOMBA! ⚠️\` ╯ 』˚｡⋆\n╭\n`;
        startCaption += `│ 『 💣 』 Una bomba ticchetta tra le mani di ${pName}!\n`;
        startCaption += `│ 『 🔥 』 \`Liberatene subito!\`\n`;
        startCaption += `│ 『 📝 』 \`Scrivi:\` *passa a @utente*\n`;
        startCaption += `*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`;

        return conn.sendMessage(chat, { text: startCaption, mentions: [m.sender], footer: '𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙' }, { quoted: m });
    }
};

handler.before = async function (m, { conn }) {
    let chat = m.chat;
    if (!bombaInCorso[chat] || !m.text) return;

    let b = bombaInCorso[chat];
    let contenuto = m.text.toLowerCase();

    if (m.sender !== b.vittima) return; 
    if (!contenuto.includes('passa a')) return;

    let target = null;
    if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
    else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

    if (!target || target === m.sender) return; 

    // LOGICA DI PASSAGGIO
    clearTimeout(b.timer);
    let tempoRimanente = b.scadenza - Date.now();
    if (tempoRimanente <= 500) return;

    // Aggiunge chi ha passato la bomba alla lista dei "sopravvissuti" per il premio
    if (!b.passaggi.includes(m.sender)) b.passaggi.push(m.sender);

    b.vittima = target;
    let pName = `@${target.split('@')[0]}`;

    let conferma = `💣 *BOMBA PASSATA!* 💣\n\n`;
    conferma += `L'ordigno è ora nelle mani di ${pName}!\n`;
    conferma += `🧨 Sbrigati! Il tempo scorre...`;

    b.timer = setTimeout(() => esplosione(chat, conn, m), tempoRimanente);

    await conn.sendMessage(chat, { text: conferma, mentions: [target] }, { quoted: m });
    return true; 
};

async function esplosione(chatId, conn, m) {
    let b = bombaInCorso[chatId];
    if (!b) return;

    let vTag = `@${b.vittima.split('@')[0]}`;
    
    // Inizializzazione database utenti coinvolti
    if (!global.db.data.users) global.db.data.users = {};
    
    // Penale per chi salta in aria
    let penale = 15;
    if (!global.db.data.users[b.vittima]) global.db.data.users[b.vittima] = {};
    let saldoVittima = global.db.data.users[b.vittima].euro || 0;
    global.db.data.users[b.vittima].euro = Math.max(0, saldoVittima - penale);

    let finale = `ㅤ⋆｡˚『 ╭ \`💥 BOOOOOOOOM!!! 💥\` ╯ 』˚｡⋆\n╭\n`;
    finale += `│ 『 💀 』 La bomba è esplosa in mano a ${vTag}!\n`;
    finale += `│ 『 💸 』 \`Danno subito:\` *-${penale}€*\n`;
    finale += `*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*\n\n`;

    // Premi per chi ha passato la bomba con successo
    if (b.passaggi.length > 0) {
        finale += `🏆 *PREMI SOPRAVVISSUTI:* 🏆\n`;
        for (let jid of b.passaggi) {
            if (jid === b.vittima) continue;
            let premio = Math.floor(Math.random() * 20) + 10;
            let exp = 50;
            
            if (!global.db.data.users[jid]) global.db.data.users[jid] = {};
            global.db.data.users[jid].euro = (global.db.data.users[jid].euro || 0) + premio;
            global.db.data.users[jid].exp = (global.db.data.users[jid].exp || 0) + exp;
            
            finale += `│ • @${jid.split('@')[0]}: *+${premio}€* e *${exp}xp*\n`;
        }
        finale += `*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`;
    }

    await conn.sendMessage(chatId, { 
        text: finale, 
        mentions: [b.vittima, ...b.passaggi],
        footer: '𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙',
        interactiveButtons: playAgainButtons()
    });
    
    delete bombaInCorso[chatId];
}

handler.help = ['bomba'];
handler.tags = ['giochi'];
handler.command = /^(bomba)$/i;
handler.group = true;
handler.register = true;

export default handler;
