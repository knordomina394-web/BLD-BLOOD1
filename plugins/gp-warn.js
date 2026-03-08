const handler = async (m, { conn, text, command, usedPrefix }) => {
    try {
        const target = getTargetUser(m, text);

        if (!target) {
            return m.reply(createUsageMessage(usedPrefix, command));
        }

        // Recuperiamo i partecipanti e puliamo i loro ID lasciando solo i numeri
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];
        
        // Estraiamo solo i numeri dal target (es: 39351...)
        const targetClean = target.replace(/[^0-9]/g, '');
        
        // Verifichiamo se quel numero esiste tra i partecipanti
        const isMember = participants.some(p => p.id.replace(/[^0-9]/g, '') === targetClean);
        // Troviamo l'ID reale nel gruppo per evitare errori di invio messaggio
        const realTarget = participants.find(p => p.id.replace(/[^0-9]/g, '') === targetClean)?.id;

        if (!isMember || !realTarget) {
            return m.reply(`『 ❌ 』 *L'utente ${targetClean} non è presente in questo gruppo.*`);
        }

        const reason = getReason(m, text, targetClean);

        if (realTarget === conn.user.jid) {
            return m.reply('『 ‼️ 』 *Non puoi ammonire il bot.*');
        }

        if (global.owner.some(owner => owner[0] === targetClean)) {
            return m.reply('🤨 Non puoi ammonire il mio creatore!');
        }

        const user = getUserData(realTarget);
        if (!user.warns) user.warns = {};
        if (typeof user.warns[m.chat] !== 'number') user.warns[m.chat] = 0;

        user.warns[m.chat] += 1;
        const count = user.warns[m.chat];

        if (count >= 3) {
            user.warns[m.chat] = 0;
            await handleRemoval(conn, m, realTarget);
        } else {
            await handleWarnMessage(conn, m, realTarget, count, reason);
        }
    } catch (error) {
        console.error(error);
        return m.reply('*[!] Errore critico nel comando warn.*');
    }
};

function getTargetUser(m, text) {
    if (m.mentionedJid?.[0]) return m.mentionedJid[0];
    if (m.quoted?.sender) return m.quoted.sender;
    if (text?.trim()) {
        const num = text.replace(/[^0-9]/g, '');
        if (num.length >= 8) return `${num}@s.whatsapp.net`;
    }
    return null;
}

function getReason(m, text, targetClean) {
    let reason = text.replace(targetClean, '').replace(/@/g, '').trim();
    return reason || 'Motivo non specificato';
}

function getUserData(userId) {
    if (!global.db.data.users) global.db.data.users = {};
    if (!global.db.data.users[userId]) {
        global.db.data.users[userId] = { warns: {} };
    }
    return global.db.data.users[userId];
}

function createUsageMessage(usedPrefix, command) {
    return `*⚠️ Esempio d'uso:*\n${usedPrefix + command} @utente\n${usedPrefix + command} 39351xxx motivo\n*Oppure rispondi a un messaggio.*`;
}

async function handleWarnMessage(conn, m, target, count, reason) {
    const message = `『 ⚠️ 』 *AVVERTIMENTO* 『 ⚠️ 』\n\n` +
                    `*Utente:* @${target.split('@')[0]}\n` +
                    `*Motivo:* ${reason}\n` +
                    `*Warn:* ${count}/3`;

    await conn.sendMessage(m.chat, { 
        text: message, 
        mentions: [target] 
    }, { quoted: m });
}

async function handleRemoval(conn, m, target) {
    await conn.sendMessage(m.chat, { 
        text: `『 🚫 』 @${target.split('@')[0]} espulso per aver raggiunto 3 avvertimenti.`, 
        mentions: [target] 
    }, { quoted: m });
    
    await conn.groupParticipantsUpdate(m.chat, [target], 'remove');
}

handler.command = ['avverti', 'warn', 'avvertimento'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
