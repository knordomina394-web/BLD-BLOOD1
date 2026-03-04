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

    // --- 1. MENU PRINCIPALE ---
    if (command === 'casino') {
        let intro = `*🎰 GRAND CASINÒ 🎰*\n*💰 SALDO:* *${user.fiches} FICHES*`
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

    // --- 2. GESTIONE INFO (SISTEMAZIONE TASTI) ---
    if (command === 'infoslot') return conn.sendMessage(m.chat, { text: `*🎰 SLOT*\nPunta 100!`, buttons: [{ buttonId: `${usedPrefix}slot`, buttonText: { displayText: '🎰 TIRA' }, type: 1 }] })
    if (command === 'infobj') return conn.sendMessage(m.chat, { text: `*🃏 BLACKJACK*\nPunta 100!`, buttons: [{ buttonId: `${usedPrefix}blackjack`, buttonText: { displayText: '🃏 GIOCA' }, type: 1 }] })
    if (command === 'infogratta') return conn.sendMessage(m.chat, { text: `*🎟️ GRATTA & VINCI*\nCosto: 200!`, buttons: [{ buttonId: `${usedPrefix}gratta`, buttonText: { displayText: '🎟️ COMPRA' }, type: 1 }] })
    if (command === 'inforoulette') return conn.sendMessage(m.chat, { text: `*🎡 ROULETTE*\nScegli (100 fiches):`, buttons: [{ buttonId: `${usedPrefix}playroulette pari`, buttonText: { displayText: 'PARI' }, type: 1 }, { buttonId: `${usedPrefix}playroulette dispari`, buttonText: { displayText: 'DISPARI' }, type: 1 }] })
    if (command === 'inforigore') return conn.sendMessage(m.chat, { text: `*⚽ RIGORI*\nDove tiri?`, buttons: [{ buttonId: `${usedPrefix}rigore sx`, buttonText: { displayText: '⬅️ SX' }, type: 1 }, { buttonId: `${usedPrefix}rigore cx`, buttonText: { displayText: '⬆️ CX' }, type: 1 }, { buttonId: `${usedPrefix}rigore dx`, buttonText: { displayText: '➡️ DX' }, type: 1 }] })
    if (command === 'infocorsa') return conn.sendMessage(m.chat, { text: `*🏇 CORSA*\nPunta 100 (X3):`, buttons: cavalliConfig.map(c => ({ buttonId: `${usedPrefix}puntacorsa ${c.nome}`, buttonText: { displayText: `${c.emoji} ${c.nome}` }, type: 1 })) })

    // --- 3. LOGICHE GIOCHI CON IMMAGINI ---

    // ⚽ RIGORI (PORTA E PALLA HD)
    if (command === 'rigore') {
        let parata = ['sx', 'cx', 'dx'][Math.floor(Math.random() * 3)]
        let tiro = args[0], win = tiro !== parata
        user.fiches += win ? 150 : -100
        const canvas = createCanvas(600, 350); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, 0, 600, 350)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(100, 50, 400, 250) // Porta
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        for(let i=100; i<=500; i+=20) { ctx.beginPath(); ctx.moveTo(i, 50); ctx.lineTo(i, 300); ctx.stroke() } // Rete
        for(let i=50; i<=300; i+=20) { ctx.beginPath(); ctx.moveTo(100, i); ctx.lineTo(500, i); ctx.stroke() }
        let pos = { sx: 160, cx: 300, dx: 440 }
        ctx.font = '70px Sans'; ctx.textAlign = 'center'
        ctx.fillText('🧤', pos[parata], 180) // Portiere
        ctx.fillText('⚽', pos[tiro], win ? 150 : 180) // Palla (se para sono vicini)
        const buttons = [{ buttonId: `${usedPrefix}inforigore`, buttonText: { displayText: '⚽ RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: win ? '*⚽ GOOOL!*' : '*🧤 PARATA!*', buttons })
    }

    // 🏇 CORSA (IPPODROMO DEFINITO)
    if (command === 'puntacorsa') {
        let vIdx = Math.floor(Math.random() * 4), win = args[0]?.toUpperCase() === cavalliConfig[vIdx].nome
        user.fiches += win ? 200 : -100
        const canvas = createCanvas(700, 400); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(0, 0, 700, 400)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4
        for(let i=0; i<=4; i++) { ctx.beginPath(); ctx.moveTo(50, 50+(i*80)); ctx.lineTo(650, 50+(i*80)); ctx.stroke() } // Corsie
        ctx.fillStyle = '#111'; for(let i=50; i<370; i+=20) { ctx.fillRect(600, i, 20, 10); ctx.fillRect(620, i+10, 20, 10) } // Finish line
        ctx.font = '50px Sans'; ctx.textAlign = 'center'
        cavalliConfig.forEach((c, i) => {
            let xPos = (i === vIdx) ? 630 : Math.floor(Math.random() * 200) + 120
            ctx.fillStyle = c.color + '44'; ctx.fillRect(50, 54+(i*80), 600, 72) // Sfondo corsia
            ctx.fillStyle = '#fff'; ctx.fillText('🏇', xPos, 110+(i*80))
            ctx.font = 'bold 14px Sans'; ctx.fillText(c.nome, 80, 110+(i*80))
        })
        const buttons = [{ buttonId: `${usedPrefix}infocorsa`, buttonText: { displayText: '🏇 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: win ? '*✅ VINTO!*' : `*❌ PERSO! VINCE ${cavalliConfig[vIdx].nome}*`, buttons })
    }

    // 🎡 ROULETTE (IMMAGINE TAVOLO)
    if (command === 'playroulette') {
        let n = Math.floor(Math.random() * 37), win = (args[0] === 'pari' && n % 2 === 0 && n !== 0) || (args[0] === 'dispari' && n % 2 !== 0)
        user.fiches += win ? 100 : -100
        const canvas = createCanvas(600, 300); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#064e3b'; ctx.fillRect(0, 0, 600, 300)
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 10; ctx.strokeRect(200, 50, 200, 150)
        ctx.fillStyle = n === 0 ? '#10b981' : (n % 2 === 0 ? '#ef4444' : '#111827')
        ctx.fillRect(205, 55, 190, 140)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 80px Sans'; ctx.textAlign = 'center'; ctx.fillText(n, 300, 155)
        const buttons = [{ buttonId: `${usedPrefix}inforoulette`, buttonText: { displayText: '🎡 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: win ? '*✅ VINTO!*' : '*❌ PERSO!*', buttons })
    }

    // 🎟️ GRATTA & VINCI (IMMAGINE BIGLIETTO)
    if (command === 'gratta') {
        let v = [0, 0, 500, 0, 1000, 0, 5000][Math.floor(Math.random() * 7)]
        user.fiches += (v - 200)
        const canvas = createCanvas(600, 300); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#d4af37'; ctx.fillRect(0,0,600,300)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(20,20,560,260)
        ctx.fillStyle = '#000'; ctx.font = 'bold 40px Sans'; ctx.textAlign = 'center'; ctx.fillText(v > 0 ? `HAI VINTO ${v}!` : 'NON HAI VINTO', 300, 160)
        const buttons = [{ buttonId: `${usedPrefix}infogratta`, buttonText: { displayText: '🎟️ RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }

    // 🃏 BLACKJACK (IMMAGINE TAVOLO)
    if (command === 'blackjack' || command === 'blakjak') {
        let tu = Math.floor(Math.random() * 11) + 11, banco = Math.floor(Math.random() * 10) + 12
        let win = (tu <= 21 && (tu > banco || banco > 21))
        user.fiches += win ? 100 : -100
        const canvas = createCanvas(600, 300); const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#1b5e20'; ctx.fillRect(0,0,600,300)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Sans'; ctx.textAlign = 'center'
        ctx.fillText(`TU: ${tu} | BANCO: ${banco}`, 300, 130); ctx.font = '30px Sans'; ctx.fillText(win ? '🏆 VINTO!' : '💀 PERSO!', 300, 220)
        const buttons = [{ buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 RIGIOCA' }, type: 1 }, { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }]
        return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*SALDO:* ${user.fiches}`, buttons })
    }

    // 🎰 SLOT (IMMAGINE FRUTTI)
    if (command === 'slot') {
        let r = [fruits[Math.floor(Math.random() * 6)], fruits[Math.floor(Math.random() * 6)], fruits[Math.floor(Math.random() * 6)]]
        let win = (r[0] === r[1] || r[1] === r[2] || r[0] === r[2])
        user.fiches += win ? 200 : -100
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
}

handler.command = /^(casino|infoslot|infobj|infogratta|inforoulette|inforigore|infocorsa|slot|blackjack|blakjak|gratta|playroulette|rigore|puntacorsa)$/i
handler.group = true
export default handler
