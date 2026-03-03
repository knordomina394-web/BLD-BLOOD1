// plugin creato da blood 
globalThis.eco = globalThis.eco || {};
globalThis.rissaStats = globalThis.rissaStats || {};
let rissaInCorso = {};

let handler = async (m, { conn, command, args }) => {
    let who = m.sender;
    
    // Inizializzazione automatica portafoglio
    if (!globalThis.eco[who]) globalThis.eco[who] = 1000;

    let target = null;
    if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
    else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

    if (!target && !rissaInCorso[m.chat]) return m.reply('Tagga qualcuno per spaccargli la faccia! 👊🔥');

    // --- FASE 1: APERTURA ARENA E SPIEGAZIONE REGOLE ---
    if (target && !rissaInCorso[m.chat]) {
        const armi = ["una Motosega arrugginita ⚙️", "un Ombrello rotto 🌂", "un Tirapugni d'oro ✨", "una Sogliola surgelata 🐟", "un Estintore 🧯", "una Mazza chiodata 🏏", "un Nokia 3310 📱", "una Cintura di cuoio 🥋"];
        let arma1 = armi[Math.floor(Math.random() * armi.length)];
        let arma2 = armi[Math.floor(Math.random() * armi.length)];

        rissaInCorso[m.chat] = {
            p1: m.sender,
            p2: target,
            armaP1: arma1,
            armaP2: arma2,
            scommesse: [],
            stato: 'OPEN'
        };

        let intro = `🏟️ *L'ARENA DELLA MORTE È APERTA!* 🏟️\n`;
        intro += `──────────────────\n`;
        intro += `🥊 *SFIDA:* @${m.sender.split('@')[0]} 🆚 @${target.split('@')[0]}\n`;
        intro += `⚔️ *ARMI:* ${arma1} vs ${arma2}\n\n`;
        intro += `📢 *REGOLE DEL MONDO:* \n`;
        intro += `• Tutti partono con *1000 Soldi Sporchi*.\n`;
        intro += `• Puoi rubare ai presenti con \`.scippo @tag\`\n`;
        intro += `• Puoi corrompere o donare con \`.regala [cifra] @tag\`\n`;
        intro += `• Controlla le tasche con \`.soldi\`\n\n`;
        intro += `💰 *SCOMMETTI ORA:* Hai 30 secondi!\n`;
        intro += `Digita: \`.punta [cifra] @tag\``;

        setTimeout(() => fineScommesse(m.chat, conn), 30000);

        return conn.sendMessage(m.chat, { text: intro, mentions: [m.sender, target] }, { quoted: m });
    }

    // --- FASE 2: PIAZZARE SCOMMESSA ---
    if (command === 'punta') {
        if (!rissaInCorso[m.chat] || rissaInCorso[m.chat].stato !== 'OPEN') return m.reply('L\'arena è chiusa!');
        
        let cifra = parseInt(args[0]);
        if (isNaN(cifra) || cifra <= 0) return m.reply('Punta una cifra valida! 💸');
        if (globalThis.eco[who] < cifra) return m.reply('Non hai abbastanza soldi! 📉');

        let suChi = m.mentionedJid[0];
        if (!suChi || (suChi !== rissaInCorso[m.chat].p1 && suChi !== rissaInCorso[m.chat].p2)) {
            return m.reply('Scommetti su uno dei lottatori! 🥊');
        }

        globalThis.eco[who] -= cifra;
        rissaInCorso[m.chat].scommesse.push({ user: who, amount: cifra, target: suChi });
        return m.reply(`✅ Scommessa di *${cifra}* su @${suChi.split('@')[0]} piazzata!\n💰 Residuo: *${globalThis.eco[who]}*`);
    }
};

// --- FASE 3: CONCLUSIONE E RESOCONTO CREDITI ---
async function fineScommesse(chatId, conn) {
    let rissa = rissaInCorso[chatId];
    if (!rissa) return;
    rissa.stato = 'CLOSED';

    let vincitore = Math.random() > 0.5 ? rissa.p1 : rissa.p2;
    let perdente = vincitore === rissa.p1 ? rissa.p2 : rissa.p1;
    let armaVincitore = vincitore === rissa.p1 ? rissa.armaP1 : rissa.armaP2;
    
    let cronaca = `🚨 *IL SANGUE È STATO VERSATO!* 🚨\n\n`;
    cronaca += `🏆 *VINCITORE:* @${vincitore.split('@')[0]} con ${armaVincitore}\n`;
    cronaca += `💀 *PERDENTE:* @${perdente.split('@')[0]} finito in rianimazione.\n\n`;
    cronaca += `📊 *RISULTATI SCOMMESSE:* \n`;

    let allUsers = rissa.scommesse.map(s => s.user);
    
    if (rissa.scommesse.length === 0) {
        cronaca += `_Nessuno ha avuto il coraggio di scommettere..._`;
    } else {
        rissa.scommesse.forEach(s => {
            let uTag = `@${s.user.split('@')[0]}`;
            if (s.target === vincitore) {
                let vinto = s.amount * 2;
                globalThis.eco[s.user] += vinto;
                cronaca += `✅ ${uTag}: *HA VINTO* (${vinto} 💰) | Saldo: ${globalThis.eco[s.user]}\n`;
            } else {
                cronaca += `❌ ${uTag}: *HA PERSO* (-${s.amount} 💰) | Saldo: ${globalThis.eco[s.user]}\n`;
            }
        });
    }

    await conn.sendMessage(chatId, { text: cronaca, mentions: [rissa.p1, rissa.p2, ...allUsers] });
    delete rissaInCorso[chatId];
}

handler.help = ['rissa', 'punta'];
handler.tags = ['giochi'];
handler.command = /^(rissa|punta)$/i;
handler.group = true;

export default handler;
