// Database economia e stats
globalThis.eco = globalThis.eco || {};
globalThis.rissaStats = globalThis.rissaStats || {};
let rissaInCorso = {};

let handler = async (m, { conn, command, args }) => {
    let who = m.sender;
    if (!globalThis.eco[who]) globalThis.eco[who] = 1000;

    let target = null;
    if (m.mentionedJid && m.mentionedJid[0]) target = m.mentionedJid[0];
    else if (m.quoted && m.quoted.sender) target = m.quoted.sender;

    if (!target && !rissaInCorso[m.chat]) return m.reply('Tagga qualcuno per spaccargli la faccia! 👊🔥');

    // --- FASE 1: APERTURA ARENA E ASSEGNAZIONE ARMI ---
    if (target && !rissaInCorso[m.chat]) {
        const armi = [
            "una Motosega arrugginita ⚙️", "un Ombrello rotto 🌂", "una Bottiglia di Tavernello 🍾", 
            "un Tirapugni d'oro ✨", "una Sogliola surgelata 🐟", "un Estintore 🧯", 
            "una Mazza da Baseball chiodata 🏏", "un Cucchiaino da caffè 🥄", "un Kebab gigante 🥙",
            "una Cintura di cuoio 🥋", "un Nokia 3310 (arma illegale) 📱", "un Cuscino di piume ☁️"
        ];

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
        intro += `🥊 *DUELLO:* @${m.sender.split('@')[0]} 🆚 @${target.split('@')[0]}\n\n`;
        intro += `⚔️ *ARSENALE ASSEGNATO:* \n`;
        intro += `• @${m.sender.split('@')[0]} brandisce: *${arma1}*\n`;
        intro += `• @${target.split('@')[0]} brandisce: *${arma2}*\n\n`;
        intro += `📢 *SPETTATORI:* Avete 30 secondi per scommettere!\n`;
        intro += `💰 Digita \`.punta [cifra] @tag\`\n`;

        setTimeout(() => fineScommesse(m.chat, conn), 30000);

        return conn.sendMessage(m.chat, { text: intro, mentions: [m.sender, target] }, { quoted: m });
    }

    // --- FASE 2: PIAZZARE SCOMMESSA ---
    if (command === 'punta') {
        if (!rissaInCorso[m.chat] || rissaInCorso[m.chat].stato !== 'OPEN') return m.reply('L\'arena è chiusa o non c\'è nessuna rissa!');
        
        let cifra = parseInt(args[0]);
        if (isNaN(cifra) || cifra <= 0) return m.reply('Punta soldi veri! 💸');
        if (globalThis.eco[who] < cifra) return m.reply('Non hai abbastanza Soldi Sporchi! 📉');

        let suChi = m.mentionedJid[0];
        if (!suChi || (suChi !== rissaInCorso[m.chat].p1 && suChi !== rissaInCorso[m.chat].p2)) {
            return m.reply('Scommetti su uno dei due lottatori! 🥊');
        }

        globalThis.eco[who] -= cifra;
        rissaInCorso[m.chat].scommesse.push({ user: who, amount: cifra, target: suChi });
        return m.reply(`✅ Scommessa di *${cifra}* su @${suChi.split('@')[0]} accettata!`);
    }
};

// --- FASE 3: IL MASSACRO CON LE ARMI ---
async function fineScommesse(chatId, conn) {
    let rissa = rissaInCorso[chatId];
    if (!rissa) return;
    rissa.stato = 'CLOSED';

    const p1Tag = `@${rissa.p1.split('@')[0]}`;
    const p2Tag = `@${rissa.p2.split('@')[0]}`;
    
    let vincitore = Math.random() > 0.5 ? rissa.p1 : rissa.p2;
    let vTag = `@${vincitore.split('@')[0]}`;
    let armaVincitore = vincitore === rissa.p1 ? rissa.armaP1 : rissa.armaP2;
    
    let cronaca = `🚨 *SCOMMESSE CHIUSE! INIZIA LA CARNEFICINA!* 🚨\n\n`;
    cronaca += `💥 ${p1Tag} carica a testa bassa con ${rissa.armaP1}!\n`;
    cronaca += `💥 ${p2Tag} cerca di parare usando ${rissa.armaP2}!\n\n`;
    cronaca += `🩸 Dopo uno scontro brutale tra ${rissa.armaP1} e ${rissa.armaP2}...\n\n`;
    cronaca += `🏆 *IL VINCITORE È:* ${vTag}!\n`;
    cronaca += `💀 Ha trionfato grazie alla potenza micidiale di: *${armaVincitore}* 🎉\n\n`;

    let vincitoriSoldi = [];
    rissa.scommesse.forEach(s => {
        if (s.target === vincitore) {
            let vincita = s.amount * 2;
            globalThis.eco[s.user] += vincita;
            vincitoriSoldi.push(`@${s.user.split('@')[0]} (+${vincita})`);
        }
    });

    cronaca += vincitoriSoldi.length > 0 ? `💰 *INCASSANO:* ${vincitoriSoldi.join(', ')}` : `💸 *IL BANCO SBANCA TUTTO!*`;

    await conn.sendMessage(chatId, { text: cronaca, mentions: [rissa.p1, rissa.p2, ...rissa.scommesse.map(s => s.user)] });
    delete rissaInCorso[chatId];
}

handler.help = ['rissa', 'punta'];
handler.tags = ['giochi'];
handler.command = /^(rissa|punta)$/i;
handler.group = true;

export default handler;
