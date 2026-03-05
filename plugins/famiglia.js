import { createCanvas, loadImage } from 'canvas'

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

    // --- MENU FAMIGLIA ---
    if (command === 'famiglia') {
        let menu = `*🌳 SISTEMA GENEALOGICO REALE 🌳*\n\n`
        menu += `👉 *${usedPrefix}unione @tag*\n`
        menu += `👉 *${usedPrefix}adotta @tag*\n`
        menu += `👉 *${usedPrefix}disereda @tag*\n`
        menu += `👉 *${usedPrefix}famigliamia* (Vedi con Foto)\n`
        return m.reply(menu)
    }

    // --- GENERAZIONE IMMAGINE CON FOTO PROFILO ---
    if (command === 'famigliamia' || command === 'albero') {
        let target = (command === 'famigliamia') ? user : (m.mentionedJid[0] || (m.quoted ? m.quoted.sender : user))
        checkUser(target)

        await m.reply('⏳ *Generazione albero con foto profilo...*')

        const canvas = createCanvas(800, 800)
        const ctx = canvas.getContext('2d')

        // Sfondo Scuro Elegante
        ctx.fillStyle = '#121212'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Funzione interna per disegnare il box con la foto
        const drawUserBox = async (id, x, y, label, color) => {
            if (!id) return
            
            // Disegno il box
            ctx.fillStyle = color
            ctx.fillRect(x - 90, y - 60, 180, 120)
            ctx.strokeStyle = '#f1c40f'
            ctx.lineWidth = 3
            ctx.strokeRect(x - 90, y - 60, 180, 120)

            // Etichetta (TU, PARTNER, etc)
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(label, x, y - 40)

            // Gestione Foto Profilo
            try {
                let ppUrl
                try {
                    ppUrl = await conn.profilePictureUrl(id, 'image')
                } catch {
                    ppUrl = 'https://telegra.ph/file/2416c30c33306fa33c5e0.jpg' // Immagine di default se non ha PP
                }
                const pp = await loadImage(ppUrl)
                
                // Disegno la foto circolare o quadrata al centro
                ctx.save()
                ctx.beginPath()
                ctx.arc(x, y + 5, 30, 0, Math.PI * 2)
                ctx.clip()
                ctx.drawImage(pp, x - 30, y - 25, 60, 60)
                ctx.restore()
            } catch (e) {
                // Se fallisce il caricamento immagine, metto un cerchio grigio
                ctx.fillStyle = '#95a5a6'
                ctx.beginPath()
                ctx.arc(x, y + 5, 30, 0, Math.PI * 2)
                ctx.fill()
            }

            // Nome pulito sotto la foto
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 13px Arial'
            let rawName = conn.getName(id) || id.split('@')[0]
            let cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'Utente'
            ctx.fillText(cleanName.substring(0, 16), x, y + 50)
        }

        let u = users[target]
        let partner = u.c
        let padre = u.s

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 30px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`DINASTIA DI ${conn.getName(target).toUpperCase()}`, canvas.width / 2, 50)

        // Linee e Box Genitore
        if (padre) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.moveTo(400, 210); ctx.lineTo(400, 300); ctx.stroke()
            await drawUserBox(padre, 400, 150, 'GENITORE', '#3498db')
        }

        // Tu e Partner
        if (partner) {
            ctx.strokeStyle = '#e74c3c'; ctx.beginPath()
            ctx.moveTo(310, 360); ctx.lineTo(490, 360); ctx.stroke()
            await drawUserBox(target, 310, 360, 'TU', '#ffffff')
            await drawUserBox(partner, 490, 360, 'PARTNER', '#ff7675')
        } else {
            await drawUserBox(target, 400, 360, 'TU', '#ffffff')
        }

        // Figli
        if (u.p && u.p.length > 0) {
            ctx.strokeStyle = '#ffffff'; ctx.beginPath()
            ctx.moveTo(400, 420); ctx.lineTo(400, 520); ctx.stroke()
            let figliMostrati = u.p.slice(0, 4)
            let startX = 400 - (figliMostrati.length - 1) * 200 / 2
            for (let i = 0; i < figliMostrati.length; i++) {
                let fx = startX + (i * 200)
                ctx.beginPath(); ctx.moveTo(400, 520); ctx.lineTo(fx, 580); ctx.stroke()
                await drawUserBox(figliMostrati[i], fx, 640, 'FIGLIO', '#2ecc71')
            }
        }

        const buffer = canvas.toBuffer()
        return conn.sendMessage(chat, { image: buffer, caption: `*🌳 Albero Dinastico di @${target.split('@')[0]}*`, mentions: [target] }, { quoted: m })
    }

    // --- LOGICA COMANDI GESTIONALI ---
    if (command === 'adotta') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Tagga chi vuoi adottare!*')
        checkUser(target)
        if (users[target].s) return m.reply('*❌ Ha già un genitore!*')
        users[user].p.push(target)
        users[target].s = user
        m.reply('*👶 Adozione completata!*')
    }

    if (command === 'disereda') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*⚠️ Tagga il figlio da rimuovere!*')
        let index = users[user].p.indexOf(target)
        if (index === -1) return m.reply('*❌ Non è tuo figlio.*')
        users[user].p.splice(index, 1)
        if (users[target]) users[target].s = null
        m.reply('*🚫 Rimosso dalla famiglia.*')
    }

    if (command === 'unione') {
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target || target === user) return m.reply('*⚠️ Tagga il partner!*')
        users[target].propostaUnione = user
        m.reply('*💍 Proposta inviata!*')
    }

    if (command === 'accettaunione') {
        let proponente = users[user].propostaUnione
        if (!proponente) return m.reply('*⚠️ Nessuna richiesta.*')
        users[user].c = proponente
        users[proponente].c = user
        delete users[user].propostaUnione
        m.reply('*✨ Unione confermata!*')
    }

    if (command === 'sciogli') {
        let ex = users[user].c
        if (!ex) return m.reply('*⚠️ Sei single.*')
        users[user].c = null; if (users[ex]) users[ex].c = null
        m.reply('*📄 Divorzio completato.*')
    }
}

handler.help = ['famiglia', 'famigliamia']
handler.tags = ['giochi']
handler.command = /^(unione|accettaunione|adotta|disereda|albero|famigliamia|sciogli|famiglia)$/i
handler.group = true

export default handler
