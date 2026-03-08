const handler = async (m, { conn, text, command, usedPrefix }) => {
    try {
        // 1. Identifica il numero dell'utente target (solo cifre)
        let rawTarget = '';
        if (m.mentionedJid?.[0]) rawTarget = m.mentionedJid[0];
        else if (m.quoted?.sender) rawTarget = m.quoted.sender;
        else if (text) rawTarget = text.replace(/[^0-9]/g, '');

        if (!rawTarget) {
            return m.reply(`*⚠️ Esempio:* ${usedPrefix + command} @utente o rispondi a un messaggio.`);
        }

        const targetNumber = rawTarget.split('@')[0].replace(/[^0-9]/g, '');

        // 2. Ottieni i membri del gruppo e cerca il match numerico
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];
        
        // Cerchiamo l'utente comparando solo i numeri
        const member = participants.find(p => p.id.replace(/[^0-9]/g, '') === targetNumber);

        if (!member) {
            return m.reply(`『 ❌ 』 *L'utente ${targetNumber} non è un membro di questo gruppo.*`);
        }

        const realJid = member.id; // L'ID corretto registrato su WhatsApp
        const reason = text ? text.replace(targetNumber, '').replace(/@/g, '').trim() : 'Nessun motivo';

        // 3. Controlli di sicurezza
        if (realJid === conn.user.jid) {
            return m.reply('『 ‼️ 』 *Non puoi ammonire me!*');
        }
        if (global.owner.some(owner => owner[0] === targetNumber)) {
            return m.reply('🤨 Non posso ammonire il mio creatore.');
        }

        // 4. Gestione Database Warn
        if (!global.db.data.users[realJid]) global.db.data.users[realJid] = { warns: {} };
        let user = global.db.data.users[realJid];
        
        if (!user.warns) user.warns = {};
        if (typeof user.warns[m.chat] !== 'number') user.warns[m.chat] = 0;

        user.warns[m.chat] += 1;
        const count = user.warns[m.chat];

        if (count >= 3) {
            user.warns[m.chat] = 0;
            await conn.sendMessage(m.chat, { 
                text: `『 🚫 』 @${targetNumber} ha raggiunto 3/3 warn e viene rimosso.`, 
                mentions: [realJid] 
            }, { quoted: m });
            await conn.groupParticipantsUpdate(m.chat, [realJid], 'remove');
        } else {
            await conn.sendMessage(m.chat, { 
                text: `『 ⚠️ 』 *AVVERTIMENTO* @${targetNumber}\n\n- *Motivo:* ${reason}\n- *Warn:* ${count}/3`, 
                mentions: [realJid] 
            }, { quoted: m });
        }
    } catch (error) {
        console.error(error);
        m.reply('*[!] Errore:* Assicurati che il bot sia amministratore.');
    }
};

handler.command = ['avverti', 'warn', 'avvertimento'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
