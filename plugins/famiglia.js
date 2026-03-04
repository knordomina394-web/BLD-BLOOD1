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

    // --- 1. COMANDO FAMIGLIA (SOLO COMANDI) ---
    if (command === 'famiglia') {
        let menu = `*🌳 SISTEMA GENEALOGICO REALE 🌳*\n\n`
        menu += `*ECCO I COMANDI DISPONIBILI:*\n\n`
        menu += `*👉 .unione @tag* - *CHIEDI DI UNIRTI A UN PARTNER*\n`
        menu += `*👉 .adotta @tag* - *ADOTTA UN UTENTE COME FIGLIO*\n`
        menu += `*👉 .famigliamia* - *VISUALIZZA IL TUO ALBERO VERO*\n`
        menu += `*👉 .albero @tag* - *GUARDA L'ALBERO DI UN ALTRO*\n`
        menu += `*👉 .sciogli* - *TERMINA L'UNIONE ATTUALE*\n`
        menu += `*👉 .disereda @tag* - *RIMUOVI UN FIGLIO*\n\n`
        menu += `* PREPARATEVI A RIPRODURVI COME CONIGLI*`
        return m.reply(menu)
    }

    // --- 2. LOGICA UNIONE CON BOTTONI ---
    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ ERRORE: TAGGA UN PARTNER VALIDO!*')
        checkUser(target)

        if (users[user].s === target || users[target].s === user) return m.reply('*⚠️ AZIONE BLOCCATA: NO INCESTO!*')
        if (users[user].c) return m.reply('*⚠️ ERRORE: SEI GIÀ UNITO A QUALCUNO!*')
        if (users[target].c) return m.reply('*⚠️ ERRORE: QUESTA PERSONA È GIÀ UNITA!*')
        
        users[target].propostaUnione = user

        const buttons = [
            { buttonId: `.accettaunione`, buttonText: { displayText: 'ACCETTA ✅' }, type: 1 },
            { buttonId: `.rifiutaunione`, buttonText: { displayText: 'RIFIUTA ❌' }, type: 1 }
        ]

        let msg = `*💍 RICHIESTA DI UNIONE 💍*\n\n`
        msg += `*@${user.split('@')[0]} VUOLE UNIRSI UFFICIALMENTE A @${target.split('@')[0]}*\n\n`
        msg += `*VUOI ACCETTARE E UNIRE I VOSTRI ALBERI?*`

        return conn.sendMessage(chat, { 
            text: msg, 
            footer: '*SISTEMA GENEALOGICO*', 
            buttons: buttons, 
            headerType: 1, 
            mentions: [user, target] 
        }, { quoted: m })
    }

    // --- LOGICA RISPOSTA BOTTONI ---
    if (command === 'accettaunione') {
        let proponente = users[user].propostaUnione
        if (!proponente) return m.reply('*⚠️ NON HAI RICHIESTE DI UNIONE IN SOSPESO.*')
        
        users[user].c = proponente
        users[proponente].c = user
        delete users[user].propostaUnione
        
        return conn.reply(chat, `*✨ UNIONE CONFERMATA! @${proponente.split('@')[0]} E @${user.split('@')[0]} SONO ORA UNITI!*`, m, { mentions: [proponente, user] })
    }

    if (command === 'rifiutaunione') {
        let proponente = users[user].propostaUnione
        if (!proponente) return
        delete users[user].propostaUnione
        return conn.reply(chat, `*💔 UNIONE RIFIUTATA. @${user.split('@')[0]} HA DECISO DI RESTARE SINGLE.*`, m, { mentions: [user] })
    }

    // --- 3. LOGICA ADOTTA ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*⚠️ ERRORE: CHI VUOI ADOTTARE?*')
        checkUser(target)
        
        if (users[user].c === target || users[user].s === target || users[target].s) {
            return m.reply('*⚠️ AZIONE NON VALIDA: CONTROLLA CHE L\'UTENTE NON SIA GIÀ TUO PARENTE O ABBIA GIÀ UN PADRE!*')
        }

        users[user].p.push(target)
        users[target].s = user
        return m.reply(`*👶 ADOZIONE COMPLETATA PER @${target.split('@')[0]}!*`, null, { mentions: [target] })
    }

    // --- 4. VISUALIZZAZIONE ALBERO ---
    if (command === 'famigliamia' || command === 'albero') {
        let target = (command === 'famigliamia') ? user : (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user))
        checkUser(target)
        
        let u = users[target]
        let fmt = (id) => id ? `*@${id.split('@')[0]}*` : '*???*'

        let partner = u.c
        let padre = u.s
        let madre = padre ? users[padre]?.c : null
        let nonno = padre ? users[padre]?.s : null
        let nonna = nonno ? users[nonno]?.c : null
        let fratelli = padre ? users[padre].p.filter(id => id !== target) : []

        let tree = `*🌳 ALBERO DI ${fmt(target).toUpperCase()} 🌳*\n\n`
        tree += `       [👵 ${fmt(nonna)}] *♾️* [👴 ${fmt(nonno)}]\n`
        tree += `               ┃\n`
        tree += `       [👩 ${fmt(madre)}] *♾️* [👨 ${fmt(padre)}]\n`
        tree += `               ┃\n`
        
        if (fratelli.length > 0) {
            tree += `  ${fratelli.map(f => `[👫 ${fmt(f)}]`).join(' *━* ')} *━ ┓*\n`
            tree += `                       ┃\n`
        }

        if (partner) {
            tree += `      [👤 ${fmt(target)}] *💍* [💍 ${fmt(partner)}]\n`
        } else {
            tree += `               [👤 ${fmt(target)}]\n`
        }

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

        return conn.sendMessage(chat, { text: tree, mentions: [target, partner, padre, madre, nonno, nonna, ...fratelli, ...(u.p || [])].filter(Boolean) }, { quoted: m })
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*⚠️ NON SEI UNITO A NESSUNO!*')
        users[user].c = null; if (users[ex]) users[ex].c = null
        return m.reply('*📄 UNIONE SCIOLTA CON SUCCESSO!*')
    }
}

handler.command = /^(unione|accettaunione|rifiutaunione|adotta|albero|famiglia|famigliamia|sciogli)$/i
handler.group = true
export default handler
