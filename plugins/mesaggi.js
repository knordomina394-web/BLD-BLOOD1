import { createCanvas } from 'canvas'

const footer = '𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙'

// Soglie Obiettivi e Ricompense (Locali per gruppo)
const rewards = [
    { limit: 100, premio: 500, titolo: "PRINCIPIANTE 🐣" },
    { limit: 500, premio: 1500, titolo: "CHIACCHIERONE 🗣️" },
    { limit: 1000, premio: 5000, titolo: "NERD 🤓" },
    { limit: 5000, premio: 15000, titolo: "VETERANO 🎖️" },
    { limit: 10000, premio: 50000, titolo: "LEGGENDA 👑" }
]

let handler = async (m, { conn, command }) => {
    let chat = global.db.data.chats[m.chat]
    if (!chat.users) chat.users = {}
    let user = chat.users[m.sender] || { msgs: 0, achievements: [] }

    // --- COMANDO CLASSIFICA DEL GRUPPO (.topmsgs) ---
    if (command === 'topmsgs' || command === 'classifica') {
        let users = Object.entries(chat.users)
            .map(([id, data]) => ({ id, msgs: data.msgs || 0 }))
            .filter(u => u.msgs > 0)
            .sort((a, b) => b.msgs - a.msgs)
            .slice(0, 10)

        if (users.length === 0) return m.reply("📭 Nessun dato registrato in questo gruppo.")

        let top = `ㅤ⋆｡˚『 ╭ \`🏆 TOP 10 ATTIVITÀ GRUPPO \` ╯ 』˚｡⋆\n╭\n`
        users.forEach((u, i) => {
            top += `│ ${i + 1}º | @${u.id.split('@')[0]} : *${u.msgs}* msg\n`
        })
        top += `│ ──────────────────\n`
        top += `│ 📅 Reset tra: ${getDaysUntilNextMonth()} giorni\n`
        top += `*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`
        return conn.sendMessage(m.chat, { text: top, mentions: users.map(u => u.id) }, { quoted: m })
    }

    // --- COMANDO STATS LOCALI (.messaggi) ---
    let msgs = user.msgs || 0
    let next = rewards.find(r => r.limit > msgs) || { limit: 'MAX', titolo: 'DIO' }
    
    let stats = `ㅤ⋆｡˚『 ╭ \`📊 I TUOI MESSAGGI QUI \` ╯ 』˚｡⋆\n╭\n`
    stats += `│ 『 📈 』 \`In questo gruppo:\` *${msgs}*\n`
    stats += `│ 『 🏆 』 \`Grado Attuale:\` *${next.titolo}*\n`
    stats += `│ ──────────────────\n`
    stats += `│ 📅 \`Reset Mensile:\` Fine mese\n`
    stats += `*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`

    return conn.sendMessage(m.chat, { text: stats, footer, mentions: [m.sender] }, { quoted: m })
}

// --- LOGICA DI CONTEGGIO SEPARATA PER CHAT ---
handler.before = async function (m, { conn }) {
    if (!m.isGroup || m.fromMe || !m.sender) return
    
    // Inizializza Chat e Utente nel gruppo
    global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
    let chat = global.db.data.chats[m.chat]
    chat.users = chat.users || {}
    chat.users[m.sender] = chat.users[m.sender] || { msgs: 0, achievements: [] }
    let user = chat.users[m.sender]
    
    // --- RESET MENSILE PER GRUPPO ---
    let date = new Date()
    let currentMonth = date.getMonth()
    if (chat.lastResetMonth === undefined) chat.lastResetMonth = currentMonth

    if (chat.lastResetMonth !== currentMonth) {
        chat.users = {} // Reset totale degli utenti solo in questo gruppo
        chat.lastResetMonth = currentMonth
        conn.reply(m.chat, '📅 *RESET MENSILE:* I contatori messaggi di questo gruppo sono stati azzerati! Inizia una nuova sfida. 🏁', null)
    }

    // Incremento messaggi locale
    user.msgs = (user.msgs || 0) + 1

    // Controllo Soglie Premio (i soldi rimangono globali, i messaggi sono locali)
    let currentReward = rewards.find(r => user.msgs === r.limit)

    if (currentReward && !user.achievements.includes('MSG_' + currentReward.limit)) {
        // I soldi li aggiungiamo al profilo globale dell'utente
        global.db.data.users[m.sender].euro = (global.db.data.users[m.sender].euro || 0) + currentReward.premio
        user.achievements.push('MSG_' + currentReward.limit)

        const canvas = createCanvas(600, 300)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, 600, 300)
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 580, 280)
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'
        ctx.fillText(currentReward.titolo, 300, 100)
        ctx.fillStyle = '#ffffff'; ctx.font = '30px Arial'
        ctx.fillText(`${user.msgs} MESSAGGI IN CHAT`, 300, 180)
        ctx.fillStyle = '#ffcc00'; ctx.fillText(`PREMIO: +${currentReward.premio}€`, 300, 250)

        await conn.sendMessage(m.chat, { 
            image: canvas.toBuffer(), 
            caption: `🏆 @${m.sender.split('@')[0]} è diventato *${currentReward.titolo}* di questo gruppo!`, 
            mentions: [m.sender] 
        }, { quoted: m })
    }
}

function getDaysUntilNextMonth() {
    let now = new Date()
    let nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24))
}

handler.help = ['messaggi', 'topmsgs']
handler.tags = ['giochi']
handler.command = /^(messaggi|msgs|stats|topmsgs|classifica)$/i
handler.group = true

export default handler
