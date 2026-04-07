let handler = async (m, { conn, text, command }) => {
    // Recupera la lista dei gruppi
    let getGroups = await conn.groupFetchAllParticipating();
    let groups = Object.values(getGroups);
    
    if (groups.length === 0) return m.reply("❌ Il bot non è in alcun gruppo.");

    // Se scrivi solo .fotti, ti manda la lista
    if (!text) {
        let txt = "😈 *LISTA OBIETTIVI DISPONIBILI:*\n\n";
        groups.forEach((g, i) => {
            txt += `*${i + 1}.* ${g.subject}\n`;
        });
        txt += `\n👉 Rispondi con: *.${command} [numero]*`;
        return m.reply(txt);
    }

    // Traduzione del numero scelto in ID del gruppo
    let index = parseInt(text) - 1;
    if (isNaN(index) || !groups[index]) return m.reply("❌ Numero non valido.");

    let targetId = groups[index].id;
    await m.reply(`🚀 Bersaglio acquisito: *${groups[index].subject}*\nLancio l'attacco...`);
    
    // Invia il segnale d'attivazione al gruppo scelto
    await conn.sendMessage(targetId, { text: `.attiva_devastazione` });
};

handler.command = ['fotti']; 
handler.owner = true;
handler.private = true; // CRITICO: Impedisce l'uso nei gruppi

export default handler;
