import { createCanvas } from 'canvas'

global.db = global.db || {}
global.db.data = global.db.data || {}
global.db.data.users = global.db.data.users || {}

let handler = async (m, { conn, text, command, usedPrefix }) => {
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

    // --- 1. MENU FAMIGLIA (RIPRISTINATO) ---
    if (command === 'famiglia') {
        let menu = `*🌳 SISTEMA GENEALOGICO REALE 🌳*\n\n`
        menu += `👉 *${usedPrefix}unione @tag* - Chiedi unione\n`
        menu += `👉 *${usedPrefix}accettaunione* - Accetta unione\n`
        menu += `👉 *${usedPrefix}sciogli* - Divorzia\n`
        menu += `👉 *${usedPrefix}adotta @tag* - Adotta un figlio\n`
        menu += `👉 *${usedPrefix}disereda @tag* - Rimuovi un figlio\n`
        menu += `👉 *${usedPrefix}famigliamia* - Visualizza l'albero (IMG)\n`
        return m.reply(menu)
    }

    // --- 2. LOGICA DISEREDA (CORRETTA) ---
    if (command === 'disereda') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*⚠️ Tagga il figlio da rimuovere!*')
        
        let index = users[user].p.indexOf(target)
        if (index === -1) return m.reply('*❌ Questo utente non è tuo figlio.*')

        users[user].p.splice(index, 1)
        if (users[target]) users[target].s = null
        return m.reply(`*🚫 @${target.split('@')[0]} è stato rimosso dalla famiglia.*`, null, { mentions: [target] })
    }

    // --- 3. GENERAZIONE IMMAGINE (SENZA EMOJI PER EVITARE ERRORI) ---
    if (command === 'famigliamia' || command === 'albero') {
        let target = (command === 'famigliamia') ? user : (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user))
        checkUser(target)

        await m.reply('⏳ *Generazione immagine...*')

        const canvas = createCanvas(800, 750)
        const ctx = canvas.getContext('2d')

        // Sfondo Scuro
        ctx.fillStyle = '#121212'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        const drawBox = async (id, x, y, label, color) => {
            if (!id) return
            // Rettangolo
            ctx.fillStyle = color
            ctx.fillRect(x - 90, y - 45, 180, 90)
            ctx.strokeStyle = '#f1c40f'
            ctx.lineWidth = 4
            ctx.strokeRect(x - 90, y - 45, 180, 90)
            
            // Testo
            ctx.fillStyle = '#000000'
            ctx.textAlign = 'center'
            ctx.font = 'bold 18px sans-serif'
            ctx.fillText(label, x, y - 10) // Titolo (GENITORE, TU, etc)
            
            ctx.font = '15px sans-serif'
            let name = conn.getName(id) || id.split('@')[0]
            name = name.replace(/[^\x00-\x7F]/g, "") // Rimuove emoji dal nome per sicurezza
            ctx.fillText(name.substring(0, 18), x, y + 20)
        }

        let u = users[target]
        let partner = u.c
        let padre = u.s

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 30px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`ALBERO GENEALOGICO`, canvas.width / 2, 50)

        // Linee e Box
        if (padre) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(400, 195); ctx.lineTo(400, 270); ctx.stroke()
            await drawBox(padre, 400, 150, 'GENITORE', '#3498db')
        }

        if (partner) {
            ctx.strokeStyle = '#e74c3c'; ctx.beginPath()
            ctx.moveTo(310, 325); ctx.lineTo(490, 325); ctx.stroke()
            await drawBox(target, 310, 325, 'TU', '#ffffff')
            await drawBox(partner, 490, 325, 'PARTNER', '#ff7675')
        } else {
            await drawBox(target, 400, 325, 'TU', '#ffffff')
        }

        if (u.p && u.p.length > 0) {
            ctx.strokeStyle = '#ffffff'; ctx.beginPath()
            ctx.moveTo(400, 370); ctx.lineTo(400, 460); ctx.stroke()
            let figliMostrati = u.p.slice(0, 4)
            let startX = 400 - (figliMostrati.length - 1) * 195 / 2
            for (let i = 0; i < figliMostrati.length; i++) {
                let fx = startX + (i * 195)
                ctx.beginPath(); ctx.moveTo(400, 460); ctx.lineTo(fx, 510); ctx.stroke()
                await drawBox(figliMostrati[i], fx, 555, 'FIGLIO', '#2ecc71')
            }
        }

        const buffer = canvas.toBuffer()
        return conn.sendMessage(chat, { image: buffer, caption: `*🌳 Albero di @${target.split('@')[0]}*`, mentions: [target] }, { quoted: m })
    }

    // --- ALTRI COMANDI ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Tagga chi vuoi adottare!*')
        checkUser(target)
        if (users[target].s) return m.reply('*❌ Ha già un genitore!*')
        users[user].p.push(target)
        users[target].s = user
        m.reply('*👶 Adozione completata!*')
    }

    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Tagga il partner!*')
        users[target].propostaUnione = user
        m.reply('*💍 Richiesta inviata!*')
    }

    if (command === 'accettaunione') {
        let proponente = users[user].propostaUnione
        if (!proponente) return m.reply('*⚠️ Nessuna richiesta.*')
        users[user].c = proponente
        users[proponente].c = user
        delete users[user].propostaUnione
        m.reply('*✨ Siete ora uniti!*')
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*⚠️ Sei single.*')
        users[user].c = null; if (users[ex]) users[ex].c = null
        m.reply('*📄 Divorzio completato.*')
    }
}

handler.help = ['albero', 'disereda', 'adotta', 'unione', 'famiglia']
handler.tags = ['giochi']
handler.command = /^(unione|accettaunione|adotta|disereda|albero|famigliamia|sciogli|famiglia)$/i
handler.group = true

export default handler
