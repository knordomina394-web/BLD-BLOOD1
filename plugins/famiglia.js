global.db = global.db || {}
global.db.data = global.db.data || {}
global.db.data.users = global.db.data.users || {}

let handler = async (m, { conn, text, command }) => {
    let chat = m.chat
    let user = m.sender
    let users = global.db.data.users

    // --- FUNZIONE DI SICUREZZA: Inizializza l'utente se non esiste o è corrotto ---
    const checkUser = (id) => {
        if (!users[id]) users[id] = {}
        if (!Array.isArray(users[id].p)) users[id].p = []
        if (users[id].c === undefined) users[id].c = null
        if (users[id].s === undefined) users[id].s = null
    }

    checkUser(user) // Inizializza chi scrive il comando

    // --- LOGICA UNIONE ---
    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*Menziona la persona con cui vuoi unirti!*')
        checkUser(target)
        if (users[user].c) return m.reply('*Sei già unito a qualcuno! Sciogli il legame attuale.*')
        if (target === user) return m.reply('*Non puoi unirti a te stesso.*')
        
        users[user].proposta = target
        const buttons = [
            { buttonId: `.accettaunione`, buttonText: { displayText: 'ACCETTA ✅' }, type: 1 },
            { buttonId: `.rifiutaunione`, buttonText: { displayText: 'RIFIUTA ❌' }, type: 1 }
        ]
        return conn.sendMessage(chat, { 
            text: `*💍 RICHIESTA DI UNIONE*\n\n@${user.split('@')[0]} vuole unirsi a @${target.split('@')[0]}. Accetti?`, 
            buttons, mentions: [user, target] 
        })
    }

    if (command === 'accettaunione') {
        let partner = Object.keys(users).find(k => users[k].proposta === user)
        if (!partner) return
        checkUser(partner)
        users[user].c = partner; users[partner].c = user
        delete users[partner].proposta
        return conn.reply(chat, `*✨ UNIONE FORMALIZZATA!*`, m)
    }

    // --- LOGICA ADOTTA (FIXED) ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*Chi vuoi adottare?*')
        checkUser(target)
        
        if (users[target].s) return m.reply('*Ha già un genitore registrato.*')
        if (target === user) return m.reply('*Non puoi adottare te stesso.*')

        // Assicurati che l'array figli esista prima del push
        if (!Array.isArray(users[user].p)) users[user].p = []
        
        users[user].p.push(target)
        users[target].s = user
        return m.reply(`*👶 Hai adottato @${target.split('@')[0]}!*`, null, { mentions: [target] })
    }

    // --- LOGICA ALBERO ESTESO ---
    if (command === 'famigliamia' || command === 'albero' || command === 'famiglia') {
        if (command === 'famiglia' && !text && !m.mentionedJid[0]) {
            return m.reply('*📜 COMANDI FAMIGLIA:*\n.unione @user\n.adotta @user\n.famigliamia\n.albero @user\n.sciogli\n.disereda')
        }

        let target = (command === 'albero' || command === 'famiglia') ? (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user)) : user
        checkUser(target)
        let u = users[target]

        let genitore = u.s 
        let nonno = (genitore && users[genitore]) ? users[genitore].s : null
        let fratelli = (genitore && users[genitore]) ? (users[genitore].p || []).filter(id => id !== target) : []
        let zii = (nonno && users[nonno]) ? (users[nonno].p || []).filter(id => id !== genitore) : []

        let cugini = []
        zii.forEach(zio => { if (users[zio]?.p) cugini.push(...users[zio].p) })

        let nipotiFigli = []
        if (u.p) {
            u.p.forEach(figlio => { if (users[figlio]?.p) nipotiFigli.push(...users[figlio].p) })
        }
        
        let nipotiFratelli = []
        fratelli.forEach(fratello => { if (users[fratello]?.p) nipotiFratelli.push(...users[fratello].p) })

        let fmt = (id) => id ? `@${id.split('@')[0]}` : 'Nessuno'
        let listFmt = (arr) => arr.length > 0 ? [...new Set(arr)].map(id => `@${id.split('@')[0]}`).join(', ') : 'Nessuno'

        let tree = `*🌳 DINASTIA DI ${fmt(target)} 🌳*\n`
        tree += `──────────────────────\n`
        tree += `*👴 NONNO:* ${fmt(nonno)}\n`
        tree += `*👨 GENITORE:* ${fmt(genitore)}\n`
        tree += `*💍 UNIONE:* ${fmt(u.c)}\n`
        tree += `──────────────────────\n`
        tree += `*👫 FRATELLI:* ${listFmt(fratelli)}\n`
        tree += `*🍕 ZII:* ${listFmt(zii)}\n`
        tree += `*👦 CUGINI:* ${listFmt(cugini)}\n`
        tree += `──────────────────────\n`
        tree += `*👶 FIGLI:*\n${(u.p || []).length > 0 ? u.p.map(f => `  ┣ ${fmt(f)}`).join('\n') : '  ┗ Nessuno'}\n`
        tree += `*🍼 NIPOTINI:* ${listFmt([...nipotiFigli, ...nipotiFratelli])}\n`
        tree += `──────────────────────`

        let mnts = [target, u.c, genitore, nonno, ...fratelli, ...zii, ...cugini, ...(u.p || []), ...nipotiFigli, ...nipotiFratelli].filter(Boolean)
        return conn.sendMessage(chat, { text: tree, mentions: mnts }, { quoted: m })
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*Nessuna unione.*')
        users[user].c = null; if (users[ex]) users[ex].c = null
        return m.reply('*Unione sciolta.*')
    }
}

handler.command = /^(unione|accettaunione|rifiutaunione|adotta|albero|famiglia|famigliamia|sciogli)$/i
handler.group = true
export default handler
