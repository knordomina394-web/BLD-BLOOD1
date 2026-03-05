import { createCanvas, loadImage } from 'canvas'

global.db = global.db || {}
global.db.data = global.db.data || {}
global.db.data.users = global.db.data.users || {}

let handler = async (m, { conn, text, command, usedPrefix }) => {
    let chat = m.chat
    let user = m.sender
    let users = global.db.data.users

    // --- DATABASE CHECK ---
    const checkUser = (id) => {
        if (!id) return
        if (!users[id]) users[id] = {}
        if (!Array.isArray(users[id].p)) users[id].p = [] // Figli
        if (users[id].c === undefined) users[id].c = null // Partner
        if (users[id].s === undefined) users[id].s = null // Padre/Madre (Genitore)
    }

    checkUser(user)

    // --- 1. MENU FAMIGLIA ---
    if (command === 'famiglia') {
        let menu = `*🌳 SISTEMA GENEALOGICO REALE 🌳*\n\n`
        menu += `*COMANDI UNIONE:* \n`
        menu += `👉 *${usedPrefix}unione @tag* - Chiedi unione\n`
        menu += `👉 *${usedPrefix}sciogli* - Divorzia dal partner\n\n`
        menu += `*COMANDI PROGENIE:* \n`
        menu += `👉 *${usedPrefix}adotta @tag* - Adotta un figlio\n`
        menu += `👉 *${usedPrefix}disereda @tag* - Rimuovi un figlio\n\n`
        menu += `*VISUALIZZAZIONE:* \n`
        menu += `👉 *${usedPrefix}famigliamia* - Visualizza il tuo albero (IMG)\n`
        menu += `👉 *${usedPrefix}albero @tag* - Guarda l'albero di un altro\n`
        return m.reply(menu)
    }

    // --- 2. LOGICA UNIONE ---
    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Tagga il tuo partner!*')
        checkUser(target)

        if (users[user].c) return m.reply('*⚠️ Sei già unito a qualcuno!*')
        if (users[target].c) return m.reply('*⚠️ Questa persona è già impegnata!*')

        users[target].propostaUnione = user
        return m.reply(`*💍 @${user.split('@')[0]} ha chiesto l'unione a @${target.split('@')[0]}!*\nScrivi *${usedPrefix}accettaunione* per confermare.`, null, { mentions: [user, target] })
    }

    if (command === 'accettaunione') {
        let proponente = users[user].propostaUnione
        if (!proponente) return m.reply('*⚠️ Nessuna richiesta in sospeso.*')
        users[user].c = proponente
        users[proponente].c = user
        delete users[user].propostaUnione
        return m.reply(`*✨ Unione confermata! Siete ora partner ufficiali.*`)
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*⚠️ Non sei unito a nessuno.*')
        users[user].c = null
        if (users[ex]) users[ex].c = null
        return m.reply('*📄 Unione sciolta. Siete tornati single.*')
    }

    // --- 3. LOGICA FIGLI (ADOTTA / DISEREDA) ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Chi vuoi adottare? Tagga qualcuno.*')
        checkUser(target)

        if (users[target].s) return m.reply('*⚠️ Questa persona ha già un genitore!*')
        
        users[user].p.push(target)
        users[target].s = user
        return m.reply(`*👶 Hai adottato @${target.split('@')[0]}! Fa parte della tua famiglia.*`, null, { mentions: [target] })
    }

    if (command === 'disereda') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*⚠️ Chi vuoi diseredare?*')
        
        let index = users[user].p.indexOf(target)
        if (index === -1) return m.reply('*⚠️ Questa persona non è tra i tuoi figli.*')

        users[user].p.splice(index, 1)
        if (users[target]) users[target].s = null
        return m.reply(`*🚫 @${target.split('@')[0]} è stato rimosso dall'albero di famiglia.*`, null, { mentions: [target] })
    }

    // --- 4. GENERAZIONE IMMAGINE (ALBERO) ---
    if (command === 'famigliamia' || command === 'albero') {
        let target = (command === 'famigliamia') ? user : (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user))
        checkUser(target)

        await m.reply('⏳ *Generazione albero in corso...*')

        const canvas = createCanvas(800, 700)
        const ctx = canvas.getContext('2d')

        // Sfondo
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Titolo
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 35px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`FAMIGLIA REALE DI ${conn.getName(target).toUpperCase()}`, canvas.width / 2, 60)

        const drawBox = async (id, x, y, label, color) => {
            if (!id) return
            ctx.fillStyle = color
            ctx.fillRect(x - 90, y - 45, 180, 90)
            ctx.strokeStyle = '#f1c40f'
            ctx.lineWidth = 4
            ctx.strokeRect(x - 90, y - 45, 180, 90)
            
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 16px Arial'
            ctx.fillText(label, x, y - 10)
            ctx.font = '14px Arial'
            let name = conn.getName(id) || 'Utente'
            ctx.fillText(name.substring(0, 18), x, y + 20)
        }

        let u = users[target]
        let partner = u.c
        let padre = u.s

        // Linee Padre -> Tu
        if (padre) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3
            ctx.beginPath(); ctx.moveTo(400, 195); ctx.lineTo(400, 280); ctx.stroke()
            await drawBox(padre, 400, 150, '👨 GENITORE', '#3498db')
        }

        // Tu e Partner
        if (partner) {
            ctx.strokeStyle = '#e74c3c'; ctx.beginPath()
            ctx.moveTo(310, 325); ctx.lineTo(490, 325); ctx.stroke()
            await drawBox(target, 310, 325, '👤 TU', '#ffffff')
            await drawBox(partner, 490, 325, '💍 PARTNER', '#ff7675')
        } else {
            await drawBox(target, 400, 325, '👤 TU', '#ffffff')
        }

        // Figli
        if (u.p && u.p.length > 0) {
            ctx.strokeStyle = '#ffffff'; ctx.beginPath()
            ctx.moveTo(400, 370); ctx.lineTo(400, 460); ctx.stroke()
            
            let figliMostrati = u.p.slice(0, 3)
            let startX = 400 - (figliMostrati.length - 1) * 200 / 2
            for (let i = 0; i < figliMostrati.length; i++) {
                let fx = startX + (i * 200)
                ctx.beginPath(); ctx.moveTo(400, 460); ctx.lineTo(fx, 510); ctx.stroke()
                await drawBox(figliMostrati[i], fx, 550, '👶 FIGLIO', '#55efc4')
            }
        }

        const buffer = canvas.toBuffer()
        return conn.sendMessage(chat, { image: buffer, caption: `*🌳 Albero Genealogico di @${target.split('@')[0]}*`, mentions: [target] }, { quoted: m })
    }
}

handler.help = ['famiglia', 'adotta', 'unione', 'disereda', 'famigliamia']
handler.tags = ['giochi']
handler.command = /^(unione|accettaunione|adotta|disereda|albero|famiglia|famigliamia|sciogli)$/i
handler.group = true

export default handler
