import { createCanvas, loadImage } from 'canvas'

// --- CONFIGURAZIONI ICONE E COLORI ---
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

    // --- 1. MENU PRINCIPALE ---
    if (command === 'casino') {
        let intro = `*🎰 GRAND CASINÒ 🎰*\n*💰 SALDO:* *${user.fiches} FICHES*\n\n*SCEGLI UN TAVOLO:*`
        const buttons = [
            { buttonId: `${usedPrefix}infoslot`, buttonText: { displayText: '🎰 SLOT' }, type: 1 },
            { buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 BLACKJACK' }, type: 1 },
            { buttonId: `${usedPrefix}inforigore`, buttonText: { displayText: '⚽ RIGORI' }, type: 1 },
            { buttonId: `${usedPrefix}inforoulette`, buttonText: { displayText: '🎡 ROULETTE' }, type: 1 },
            { buttonId: `${usedPrefix}infogratta`, buttonText: { displayText: '🎟️ GRATTA&VINCI' }, type: 1 },
            { buttonId: `${usedPrefix}infocorsa`, buttonText: { displayText: '🏇 CORSA' }, type: 1 }
        ]
        return conn.sendMessage(m.chat, { text: intro, buttons }, { quoted: m })
    }

    // --- 2. GESTIONE INFO (DESCRIZIONI) ---
    if (command === 'infoslot') return conn.sendMessage(m.chat, { text: `*🎰 SLOT*\nCosto: 100`, buttons: [{ buttonId: `${usedPrefix}slot`, buttonText: { displayText: '🎰 TIRA' }, type: 1 }] })
    if (command === 'infobj') return conn.sendMessage(m.chat, { text: `*🃏 BLACKJACK*\nPunta 100`, buttons: [{ buttonId: `${usedPrefix}blackjack`, buttonText: { displayText: '🃏 GIOCA' }, type: 1 }] })
    if (command === 'infogratta') return conn.sendMessage(m.chat, { text: `*🎟️ GRATTA & VINCI*\nCosto: 200`, buttons: [{ buttonId: `${usedPrefix}gratta`, buttonText: { displayText: '🎟️ GRATTA' }, type: 1 }] })
    if (command === 'inforoulette') return conn.sendMessage(m.chat, { text: `*🎡 ROULETTE*\nPunta 100 su:`, buttons: [{ buttonId: `${usedPrefix}playroulette pari`, buttonText: { displayText: 'PARI' }, type: 1 }, { buttonId: `${usedPrefix}playroulette dispari`, buttonText: { displayText: 'DISPARI' }, type: 1 }] })
    if (command === 'inforigore') return conn.sendMessage(m.chat, { text: `*⚽ RIGORI*\nDove tiri?`, buttons: [{ buttonId: `${usedPrefix}rigore sx`, buttonText: { displayText: '⬅️ SX' }, type: 1 }, { buttonId: `${usedPrefix}rigore cx`, buttonText: { displayText: '⬆️ CX' }, type: 1 }, { buttonId: `${usedPrefix}rigore dx`, buttonText: { displayText: '➡️ DX' }, type: 1 }] })
    if (command === 'infocorsa') return conn.sendMessage(m.chat, { text: `*🏇 CORSA*\nPunta su:`, buttons: cavalliConfig.map(c => ({ buttonId: `${usedPrefix}puntacorsa ${c.nome}`, buttonText: { displayText: `${c.emoji} ${c.nome}` }, type: 1 })) })

    // --- 3. LOGICHE GIOCHI ---

    // ⚽ RIGORI (PORTA HD)
    if (command === 'rigore') {
        if (user.fiches < 100) return m.reply('❌ No fiches!')
        let parata = ['sx', 'cx', 'dx'][Math.floor(Math.random() * 3)]
        let tiro = args[0], win = tiro !== parata
        user.fiches += win ? 150 : -100
        const canvas = createCanvas(600, 350); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, 0, 600, 350) // Erba
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(100, 50, 400, 250) // Porta
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.4)'
        for(let i=100; i<=500; i+=15) { ctx.beginPath(); ctx.moveTo(i, 50); ctx.lineTo(i, 300); ctx.stroke() }
        for(let i=50; i<=300; i+=15) { ctx.beginPath(); ctx.moveTo(100, i); ctx.lineTo(500, i); ctx.stroke() }
        let pos = { sx: 180, cx: 300, dx: 420 }
        ctx.font = '60px Sans'; ctx.textAlign = 'center'
        ctx.fillText('🧤', pos[parata], 180) // Portiere
        ctx.fillText('⚽', pos[tiro], win ? 140 : 170) // Palla
        const buttons = [{ buttonId: `${usedPrefix}inforigore`, buttonText: { displayText: '⚽ RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: win ? '*GOOOL!*' : '*PARATA!*', buttons })
    }

    // 🎰 SLOT
    if (command === 'slot') {
        if (user.fiches < 100) return m.reply('❌ No fiches!')
        let r = [fruits[Math.floor(Math.random() * 6)], fruits[Math.floor(Math.random() * 6)], fruits[Math.floor(Math.random() * 6)]]
        let win = (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]), jack = (r[0] === r[1] && r[1] === r[2])
        user.fiches += jack ? 1000 : win ? 200 : -100
        const canvas = createCanvas(600, 250); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#111'; ctx.fillRect(0,0,600,250)
        try {
            const i1 = await loadImage(fruitURLs[r[0]]), i2 = await loadImage(fruitURLs[r[1]]), i3 = await loadImage(fruitURLs[r[2]])
            ctx.drawImage(i1, 100, 50, 100, 100); ctx.drawImage(i2, 250, 50, 100, 100); ctx.drawImage(i3, 400, 50, 100, 100)
        } catch (e) {}
        ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Sans'; ctx.textAlign = 'center'; ctx.fillText(win ? 'VINTO!' : 'PERSO!', 300, 210)
        const buttons = [{ buttonId: `${usedPrefix}slot`, buttonText: { displayText: '🎰 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }

    // 🃏 BLACKJACK
    if (command === 'blackjack' || command === 'blakjak') {
        if (user.fiches < 100) return m.reply('❌ No fiches!')
        let tu = Math.floor(Math.random() * 11) + 11, banco = Math.floor(Math.random() * 10) + 12
        let win = (tu <= 21 && (tu > banco || banco > 21))
        user.fiches += win ? 100 : -100
        const canvas = createCanvas(600, 250); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#1b5e20'; ctx.fillRect(0,0,600,250)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Sans'; ctx.textAlign = 'center'
        ctx.fillText(`TU: ${tu} | BANCO: ${banco}`, 300, 120)
        ctx.fillText(win ? 'VITTORIA!' : 'SCONFITTA!', 300, 200)
        const buttons = [{ buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }

    // 🎟️ GRATTA & VINCI
    if (command === 'gratta') {
        if (user.fiches < 200) return m.reply('❌ No fiches!')
        let vinto = [0, 0, 500, 0, 1000, 200, 0, 5000][Math.floor(Math.random() * 8)]
        user.fiches += (vinto - 200)
        const canvas = createCanvas(600, 250); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#d4af37'; ctx.fillRect(0,0,600,250)
        ctx.fillStyle = '#000'; ctx.font = 'bold 50px Sans'; ctx.textAlign = 'center'; ctx.fillText(vinto > 0 ? `HAI VINTO ${vinto}!` : 'NON HAI VINTO', 300, 140)
        const buttons = [{ buttonId: `${usedPrefix}gratta`, buttonText: { displayText: '🎟️ RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }

    // 🎡 ROULETTE
    if (command === 'playroulette') {
        if (user.fiches < 100) return m.reply('❌ No fiches!')
        let n = Math.floor(Math.random() * 37), win = (args[0] === 'pari' && n % 2 === 0 && n !== 0) || (args[0] === 'dispari' && n % 2 !== 0)
        user.fiches += win ? 100 : -100
        const canvas = createCanvas(600, 250); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#004d40'; ctx.fillRect(0,0,600,250)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 80px Sans'; ctx.textAlign = 'center'; ctx.fillText(n, 300, 130)
        ctx.font = '30px Sans'; ctx.fillText(win ? 'VINTO!' : 'PERSO!', 300, 200)
        const buttons = [{ buttonId: `${usedPrefix}inforoulette`, buttonText: { displayText: '🎡 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*NUMERO:* ${n} | *SALDO:* ${user.fiches}`, buttons })
    }

    // 🏇 CORSA
    if (command === 'puntacorsa') {
        let v = Math.floor(Math.random() * 4), win = args[0]?.toUpperCase() === cavalliConfig[v].nome
        user.fiches += win ? 300 : -100
        const canvas = createCanvas(600, 250); const ctx = canvas.getContext('2d'); ctx.fillStyle = '#4e342e'; ctx.fillRect(0,0,600,250)
        ctx.fillStyle = '#fff'; ctx.font = '40px Sans'; ctx.fillText(`VINCE: ${cavalliConfig[v].emoji} ${cavalliConfig[v].nome}`, 300, 130)
        const buttons = [{ buttonId: `${usedPrefix}infocorsa`, buttonText: { displayText: '🏇 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }
}

handler.command = /^(casino|infoslot|infobj|infogratta|inforoulette|inforigore|infocorsa|slot|blackjack|blakjak|gratta|playroulette|rigore|puntacorsa)$/i
export default handler
