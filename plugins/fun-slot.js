import { createCanvas, loadImage } from 'canvas'

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
    let groupName = m.isGroup ? (conn.chats[m.chat]?.subject || 'GUEST') : 'CASINÒ PRIVATO'

    // --- MENU PRINCIPALE ---
    if (command === 'casino') {
        let intro = `*🎰 BENVENUTO NEL CASINÒ DI ${groupName.toUpperCase()} 🎰*\n\n`
        intro += `*CIAO* *@${m.sender.split('@')[0]}!* *SCEGLI IL TUO TAVOLO:*`
        const buttons = [
            { buttonId: `${usedPrefix}infoslot`, buttonText: { displayText: '🎰 SLOT MACHINE' }, type: 1 },
            { buttonId: `${usedPrefix}infobj`, buttonText: { displayText: '🃏 BLACKJACK' }, type: 1 },
            { buttonId: `${usedPrefix}infocorsa`, buttonText: { displayText: '🏇 CORSA CAVALLI' }, type: 1 }
        ]
        return conn.sendMessage(m.chat, { text: intro, buttons, mentions: [m.sender] }, { quoted: m })
    }

    // --- INFO CORSA E SCELTA COLORE ---
    if (command === 'infocorsa') {
        let desc = `*🏇 CORSA DEI CAVALLI - SCOMMESSE*\n\n*PUNTA SU UN CAVALLO. SE IL TUO COLORE ARRIVA PRIMO, VINCI IL TRIPLO!*\n\n*SCEGLI IL TUO CAMPIONE:*`
        const buttons = cavalliConfig.map(c => ({
            buttonId: `${usedPrefix}puntacorsa ${c.nome}`,
            buttonText: { displayText: `${c.emoji} ${c.nome}` },
            type: 1
        }))
        return conn.sendMessage(m.chat, { text: desc, buttons }, { quoted: m })
    }

    // --- LOGICA GARA CON CANVAS ---
    if (command === 'puntacorsa') {
        let scelta = args[0]?.toUpperCase()
        if (!scelta) return m.reply('*⚠️ SCEGLI UN COLORE VALIDO!*')
        if (user.fiches < 100) return m.reply('*❌ FICHES INSUFFICIENTI!*')

        user.fiches -= 100
        
        // Calcolo posizioni e vincitore
        let risultati = cavalliConfig.map(c => ({ ...c, pos: Math.random() * 400 + 50 }))
        risultati.sort((a, b) => b.pos - a.pos) // Il più lontano ha vinto
        let vincitore = risultati[0]
        let haiVinto = scelta === vincitore.nome

        if (haiVinto) user.fiches += 300

        // Creazione Immagine Gara
        const canvas = createCanvas(600, 450)
        const ctx = canvas.getContext('2d')
        
        // Pista
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0, 0, 600, 450)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3
        for(let i=0; i<5; i++) { ctx.beginPath(); ctx.moveTo(0, 80 + i*80); ctx.lineTo(600, 80 + i*80); ctx.stroke() }
        
        // Traguardo
        ctx.fillStyle = '#fff'; ctx.fillRect(520, 50, 10, 350)
        ctx.font = 'bold 20px Sans'; ctx.fillText('🏁', 515, 40)

        // Disegno Cavalli
        risultati.forEach((c, i) => {
            let rowIndex = cavalliConfig.findIndex(cc => cc.nome === c.nome)
            ctx.font = '50px Sans'
            ctx.fillText('🏇', c.pos, 130 + rowIndex * 80)
            ctx.fillStyle = c.color
            ctx.beginPath(); ctx.arc(c.pos + 25, 145 + rowIndex * 80, 10, 0, Math.PI * 2); ctx.fill()
        })

        // Classifica finale in testo
        let classificaTxt = `*🏁 CLASSIFICA FINALE 🏁*\n\n`
        risultati.forEach((c, i) => {
            classificaTxt += `*${i + 1}° POSTO:* *${c.emoji} ${c.nome}*\n`
        })
        
        classificaTxt += `\n${haiVinto ? `*🎉 VITTORIA! HAI VINTO 300 FICHES!*` : `*💀 PERSO! IL CAVALLO ${vincitore.nome} È STATO PIÙ VELOCE.*`}`
        classificaTxt += `\n*SALDO ATTUALE:* *${user.fiches}*`

        const buttons = [
            { buttonId: `${usedPrefix}infocorsa`, buttonText: { displayText: '🏇 RIGIOCA' }, type: 1 },
            { buttonId: `${usedPrefix}casino`, buttonText: { displayText: '🏠 MENU' }, type: 1 }
        ]

        return conn.sendMessage(m.chat, { 
            image: canvas.toBuffer(), 
            caption: classificaTxt, 
            buttons 
        }, { quoted: m })
    }

    // --- ALTRI GIOCHI (SLOT E BLAKJAK) ---
    // (Mantieni qui il codice di slot e blackjack dei messaggi precedenti...)
}

handler.command = /^(casino|infoslot|infobj|infocorsa|puntacorsa|slot|blakjak|blackjack|corsa)$/i
handler.group = true
export default handler
