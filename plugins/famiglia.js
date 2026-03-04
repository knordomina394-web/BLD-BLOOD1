global.db = global.db || {}
global.db.data = global.db.data || {}
global.db.data.users = global.db.data.users || {}

let handler = async (m, { conn, text, command }) => {
    let chat = m.chat
    let user = m.sender
    let users = global.db.data.users

    const checkUser = (id) => {
        if (!id) return
        if (!users[id]) users[id] = {}
        if (!Array.isArray(users[id].p)) users[id].p = []
        if (users[id].c === undefined) users[id].c = null
        if (users[id].s === undefined) users[id].s = null
    }

    checkUser(user)

    // --- COMANDO UNIONE (CON VINCOLI) ---
    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ ERRORE: TAGGA UN PARTNER VALIDO!*')
        checkUser(target)

        // Vincoli di realtà
        if (users[user].s === target || users[target].s === user) return m.reply('*⚠️ AZIONE BLOCCATA: NON PUOI UNIRTI A UN GENITORE O A UN FIGLIO!*')
        if (users[user].c) return m.reply('*⚠️ ERRORE: SEI GIÀ UNITO A QUALCUNO!*')
        
        users[user].proposta = target
        return conn.sendMessage(chat, { 
            text: `*💍 RICHIESTA DI UNIONE*\n\n*@${user.split('@')[0]}* *VUOLE UNIRSI A* *@${target.split('@')[0]}*.\n\n*USA I BOTTONI O SCRIVI .ACCETTAUNIONE PER CONFERMARE!*`, 
            mentions: [user, target] 
        })
    }

    // --- COMANDO ADOTTA (CON VINCOLI DI REALTÀ) ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*⚠️ ERRORE: CHI VUOI ADOTTARE?*')
        checkUser(target)

        if (target === user) return m.reply('*⚠️ ERRORE: NON PUOI ADOTTARE TE STESSO!*')
        if (users[user].c === target) return m.reply('*⚠️ ERRORE: NON PUOI ADOTTARE TUO MARITO/TUA MOGLIE!*')
        if (users[user].s === target) return m.reply('*⚠️ ERRORE: NON PUOI ADOTTARE TUO PADRE/TUA MADRE!*')
        if (users[target].s) return m.reply('*⚠️ ERRORE: QUESTO UTENTE HA GIÀ UN GENITORE!*')

        users[user].p.push(target)
        users[target].s = user
        return m.reply(`*👶 ADOZIONE COMPLETATA: *@${target.split('@')[0]}* *È ORA TUO FIGLIO!*`, null, { mentions: [target] })
    }

    // --- VISUALIZZAZIONE ALBERO (TUTTO IN GRASSETTO) ---
    if (command === 'albero' || command === 'famigliamia' || command === 'famiglia') {
        let target = (command === 'famigliamia') ? user : (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user))
        checkUser(target)
        
        let u = users[target]
        let fmt = (id) => id ? `*@${id.split('@')[0]}*` : '*???*'

        // Calcolo parenti
        let partner = u.c
        let padre = u.s
        let madre = padre ? users[padre]?.c : null
        let nonno = padre ? users[padre]?.s : null
        let nonna = nonno ? users[nonno]?.c : null
        let fratelli = padre ? users[padre].p.filter(id => id !== target) : []

        let tree = `*🌳 ALBERO GENEALOGICO DI ${fmt(target).toUpperCase()} 🌳*\n\n`

        // Grafica Antenati
        tree += `       [👵 ${fmt(nonna)}] *♾️* [👴 ${fmt(nonno)}]\n`
        tree += `               ┃\n`
        tree += `       [👩 ${fmt(madre)}] *♾️* [👨 ${fmt(padre)}]\n`
        tree += `               ┃\n`
        
        // Fratelli
        if (fratelli.length > 0) {
            tree += `  ${fratelli.map(f => `[👫 ${fmt(f)}]`).join(' *━* ')} *━ ┓*\n`
            tree += `                       ┃\n`
        }

        // Centro (Tu e Partner)
        if (partner) {
            tree += `      [👤 ${fmt(target)}] *💍* [💍 ${fmt(partner)}]\n`
        } else {
            tree += `               [👤 ${fmt(target)}]\n`
        }

        // Discendenti
        if (u.p && u.p.length > 0) {
            tree += `               *┣━━━━━━━━━━━━━━┓*\n`
            u.p.forEach((figlio, i) => {
                let rano = (i === u.p.length - 1) ? '*┗*' : '*┣*'
                tree += `               ${rano}*━━* [👶 ${fmt(figlio)}]\n`
                
                let nipoti = users[figlio]?.p || []
                nipoti.forEach((nipote, ni) => {
                    let subRano = (ni === nipoti.length - 1) ? '*┗*' : '*┣*'
                    let spazio = (i === u.p.length - 1) ? ' ' : '┃'
                    tree += `               ${spazio}       ${subRano}*━━* [🍼 ${fmt(nipote)}]\n`
                })
            })
        } else {
            tree += `               ┃\n`
            tree += `        *[🍃 NESSUN EREDE]*\n`
        }

        tree += `\n*──────────────────────────*\n`
        tree += `*_SISTEMA DI GENEALOGIA REALE_*`

        let mnts = [target, partner, padre, madre, nonno, nonna, ...fratelli, ...(u.p || [])].filter(Boolean)
        return conn.sendMessage(chat, { text: tree, mentions: [...new Set(mnts)] }, { quoted: m })
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*⚠️ NON SEI UNITO A NESSUNO!*')
        users[user].c = null; if (users[ex]) users[ex].c = null
        return m.reply('*📄 UNIONE SCIOLTA CON SUCCESSO!*')
    }
}

handler.command = /^(unione|accettaunione|adotta|albero|famiglia|famigliamia|sciogli)$/i
handler.group = true
export default handler
