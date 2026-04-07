// plug-in di blood - Gestione Moderatori (Finti Admin)
let handler = async (m, { conn, text, command, usedPrefix, isOwner }) => {
    if (!isOwner) return m.reply("❌ Questo comando è riservato al proprietario del bot.")

    let chatId = m.chat
    if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
    if (!global.db.data.chats[chatId].moderatori) global.db.data.chats[chatId].moderatori = []

    let mods = global.db.data.chats[chatId].moderatori

    // --- COMANDO .ADDMOD ---
    if (command === 'addmod') {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
        if (!who) return m.reply(`Tagga qualcuno per aggiungerlo come moderatore.`)
        if (mods.includes(who)) return m.reply("⚠️ Utente già presente.")
        mods.push(who)
        return m.reply(`✅ @${who.split('@')[0]} aggiunto ai moderatori!`, null, { mentions: [who] })
    }

    // --- COMANDO .DELMOD ---
    if (command === 'delmod') {
        let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null
        if (!who) return m.reply(`Tagga qualcuno per rimuoverlo.`)
        global.db.data.chats[chatId].moderatori = mods.filter(jid => jid !== who)
        return m.reply(`🗑️ Privilegi rimossi per @${who.split('@')[0]}.`, null, { mentions: [who] })
    }

    // --- COMANDO .LISTANERA ---
    if (command === 'listanera') {
        if (mods.length === 0) return m.reply("📋 Nessun moderatore registrato.")
        let lista = `📋 *LISTA MODERATORI*\n\n`
        mods.forEach((jid, i) => { lista += `${i + 1}. @${jid.split('@')[0]}\n` })
        return conn.sendMessage(chatId, { text: lista, mentions: mods }, { quoted: m })
    }
}

// --- LOGICA DI FILTRO ---
handler.before = async function (m, { isOwner }) {
    if (!m.isGroup || !global.db.data.chats[m.chat]?.moderatori) return

    let mods = global.db.data.chats[m.chat].moderatori
    let isMod = mods.includes(m.sender)

    if (isMod) {
        // 1. Diamo i permessi per i comandi admin generici
        m.isAdmin = true 

        // 2. BLOCCO DI SICUREZZA: Se il comando cerca di modificare i ruoli
        // Aggiungi qui i nomi dei comandi che danno/tolgono admin (es: promote, demote, admin, unadmin)
        let comando = m.text.toLowerCase()
        if (comando.startsWith('.') && /^(promote|demote|admin|unadmin|dareadmin|togliereadmin)/i.test(comando.slice(1))) {
            m.isAdmin = false // Revociamo temporaneamente lo status per questo messaggio
            return m.reply("🚫 *Accesso Negato*\nCome Moderatore non hai il permesso di gestire i ruoli degli utenti (Promote/Demote).")
        }
    }
}

handler.help = ['addmod', 'delmod', 'listanera']
handler.tags = ['owner', 'group']
handler.command = /^(addmod|delmod|listanera)$/i
handler.group = true

export default handler
