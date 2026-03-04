import { createCanvas, loadImage } from 'canvas'

// --- CONFIGURAZIONI ---
const fruits = ['🍒', '🍋', '🍉', '🍇', '🍎', '🍓']
const fruitURLs = {
    '🍒': 'https://twemoji.maxcdn.com/v/latest/72x72/1f352.png',
    '🍋': 'https://twemoji.maxcdn.com/v/latest/72x72/1f34b.png',
    '🍉': 'https://twemoji.maxcdn.com/v/latest/72x72/1f349.png',
    '🍇': 'https://twemoji.maxcdn.com/v/latest/72x72/1f347.png',
    '🍎': 'https://twemoji.maxcdn.com/v/latest/72x72/1f34e.png',
    '🍓': 'https://twemoji.maxcdn.com/v/latest/72x72/1f353.png'
}
const cavalliConfig = [
    { nome: 'ROSSO', emoji: '🔴', color: '#ff0000' },
    { nome: 'BLU', emoji: '🔵', color: '#0000ff' },
    { nome: 'VERDE', emoji: '🟢', color: '#00ff00' },
    { nome: 'GIALLO', emoji: '🟡', color: '#ffff00' }
]

let handler = async (m, { conn, command, args, usedPrefix }) => {
    global.db.data.users[m.sender] = global.db.data.users[m.sender] || {}
    let user = global.db.data.users[m.sender]
    if (user.fiches === undefined) user.fiches = 1000
    let groupName = m.isGroup ? (conn.chats[m.chat]?.subject || 'GUEST') : 'CASINÒ'

    // --- 1. MENU PRINCIPALE ---
    if (command === 'casino') {
        let intro = `*🎰 CASINÒ ${groupName.toUpperCase()} 🎰*\n*💰 SALDO:* *${user.fiches} FICHES*`
        const buttons = [
            { buttonId: `${usedPrefix}infoslot`, buttonText: { displayText: '🎰 SLOT' }, type: 1 },
            { buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 BLACKJACK' }, type: 1 },
            { buttonId: `${usedPrefix}inforoulette`, buttonText: { displayText: '🎡 ROULETTE' }, type: 1 },
            { buttonId: `${usedPrefix}inforigore`, buttonText: { displayText: '⚽ RIGORI' }, type: 1 }
        ]
        return conn.sendMessage(m.chat, { text: intro, buttons }, { quoted: m })
    }

    // --- 2. INFO GIOCHI ---
    if (command === 'infobj') return conn.sendMessage(m.chat, { text: `*🃏 BLACKJACK*\nPunta 100 e sfida il banco!`, buttons: [{ buttonId: `${usedPrefix}blackjack 100`, buttonText: { displayText: '🃏 GIOCA' }, type: 1 }] })
    if (command === 'inforigore') {
        const buttons = [
            { buttonId: `${usedPrefix}rigore sx`, buttonText: { displayText: '⬅️ SINISTRA' }, type: 1 },
            { buttonId: `${usedPrefix}rigore cx`, buttonText: { displayText: '⬆️ CENTRO' }, type: 1 },
            { buttonId: `${usedPrefix}rigore dx`, buttonText: { displayText: '➡️ DESTRA' }, type: 1 }
        ]
        return conn.sendMessage(m.chat, { text: `*⚽ SFIDA AI RIGORI*\nScegli dove mirare il tiro!`, buttons })
    }

    // --- 3. LOGICHE CON IMMAGINI ---

    // ⚽ RIGORI (PORTA E PORTIERE MIGLIORATI)
    if (command === 'rigore') {
        if (user.fiches < 100) return m.reply('❌ Fiches insufficienti!')
        let parata = ['sx', 'cx', 'dx'][Math.floor(Math.random() * 3)]
        let tiro = args[0], win = tiro !== parata
        user.fiches += win ? 150 : -100

        const canvas = createCanvas(600, 400)
        const ctx = canvas.getContext('2d')
        // Erba e Sfondo
        ctx.fillStyle = '#1b5e20'; ctx.fillRect(0, 0, 600, 400)
        // Disegno Porta (Pali spessi)
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 12; ctx.lineJoin = 'round'
        ctx.strokeRect(100, 80, 400, 250) 
        // Rete Effetto Trasparente
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        for(let i=100; i<=500; i+=15) { ctx.beginPath(); ctx.moveTo(i, 80); ctx.lineTo(i, 330); ctx.stroke() }
        for(let i=80; i<=330; i+=15) { ctx.beginPath(); ctx.moveTo(100, i); ctx.lineTo(500, i); ctx.stroke() }

        ctx.font = '70px Sans'; ctx.textAlign = 'center'
        // Coordinate posizioni
        let coords = { sx: 160, cx: 300, dx: 440 }
        
        // Disegno Portiere
        ctx.fillText('🧤', coords[parata], 220)
        // Disegno Palla (nel punto in cui hai mirato)
        ctx.fillText('⚽', coords[tiro], win ? 160 : 210)

        let cap = win ? `*⚽ GOOOL! SEGNI A ${tiro.toUpperCase()}!*` : `*🧤 PARATA! IL PORTIERE HA COPERTO ${parata.toUpperCase()}!*`
        const buttons = [{ buttonId: `${usedPrefix}inforigore`, buttonText: { displayText: '⚽ RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `${cap}\n*SALDO:* ${user.fiches}`, buttons }, { quoted: m })
    }

    // 🃏 BLACKJACK (REINTEGRATO CON IMMAGINE)
    if (command === 'blackjack' || command === 'blakjak') {
        let bet = parseInt(args[0]) || 100
        if (user.fiches < bet) return m.reply('❌ Fiches insufficienti!')
        let tu = Math.floor(Math.random() * 11) + 11
        let banco = Math.floor(Math.random() * 10) + 12
        let win = (tu <= 21 && (tu > banco || banco > 21))
        user.fiches += win ? bet : -bet

        const canvas = createCanvas(600, 300)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, 0, 600, 300) // Feltro verde
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 5; ctx.strokeRect(20, 20, 560, 260)

        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
        ctx.font = 'bold 35px Sans'; ctx.fillText('BLACKJACK TABLE', 300, 70)
        ctx.font = '30px Sans'
        ctx.fillText(`TU: ${tu}`, 150, 160)
        ctx.fillText(`BANCO: ${banco}`, 450, 160)
        ctx.font = 'bold 45px Sans'; ctx.fillStyle = win ? '#ffeb3b' : '#ff5252'
        ctx.fillText(win ? '🏆 HAI VINTO!' : '💀 BANCO VINCE', 300, 250)

        const buttons = [{ buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons }, { quoted: m })
    }

    // (Mantenere logiche Roulette e Slot come sopra...)
}

handler.command = /^(casino|infoslot|infobj|inforigore|inforoulette|slot|blackjack|blakjak|rigore|playroulette)$/i
export default handler
