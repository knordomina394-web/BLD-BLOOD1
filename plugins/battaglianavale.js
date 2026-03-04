import { createCanvas } from 'canvas'

global.navale = global.navale || {}

let handler = async (m, { conn, text, command, usedPrefix }) => {
    let chat = m.chat
    let user = m.sender

    // --- 1. INIZIO SFIDA ---
    if (command === 'battaglia') {
        if (global.navale[chat]) return m.reply('*⚠️ Partita in corso. Usa .endgame per chiuderla.*')
        let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
        if (!target) return m.reply('*Devi menzionare l\'avversario!*')
        if (target === user) return m.reply('*Non puoi sfidare te stesso.*')

        global.navale[chat] = {
            p1: user,
            p2: target,
            status: 'WAITING',
            turno: user,
            board1: generateBoard(),
            board2: generateBoard(),
            hits1: [], 
            hits2: []  
        }

        let intro = `*⚓ BATTAGLIA NAVALE HD ⚓*\n\n*SFIDANTE:* @${user.split('@')[0]}\n*AVVERSARIO:* @${target.split('@')[0]}\n\n*Accetti la sfida?*`
        const buttons = [
            { buttonId: `${usedPrefix}accetta`, buttonText: { displayText: 'ACCETTA ✅' }, type: 1 },
            { buttonId: `${usedPrefix}rifiuta`, buttonText: { displayText: 'RIFIUTA ❌' }, type: 1 }
        ]
        return conn.sendMessage(chat, { text: intro, buttons, mentions: [user, target] }, { quoted: m })
    }

    // --- 2. ACCETTA / RIFIUTA / END ---
    if (command === 'endgame') {
        delete global.navale[chat]
        return m.reply('*🏁 Battaglia terminata.*')
    }

    if (command === 'accetta') {
        let game = global.navale[chat]
        if (!game || game.status !== 'WAITING' || user !== game.p2) return
        game.status = 'PLAYING'
        return m.reply(`*🚢 PARTITA INIZIATA!*\nTurno di @${game.p1.split('@')[0]}\nUsa: *.fuoco A1*`, null, { mentions: [game.p1] })
    }

    // --- 3. LOGICA DI FUOCO CON CANVAS ---
    if (command === 'fuoco') {
        let game = global.navale[chat]
        if (!game || game.status !== 'PLAYING') return m.reply('*Nessuna partita attiva.*')
        if (user !== game.turno) return m.reply(`*Non è il tuo turno!*`)

        let coord = text.toUpperCase().trim()
        if (!/^[A-E][1-5]$/.test(coord)) return m.reply('*Esempio: .fuoco B2*')

        let isP1 = user === game.p1
        let opponentBoard = isP1 ? game.board2 : game.board1
        let hits = isP1 ? game.hits2 : game.hits1 

        if (hits.includes(coord)) return m.reply('*Hai già sparato qui!*')
        hits.push(coord)

        let isHit = opponentBoard.includes(coord)
        let win = opponentBoard.every(ship => hits.includes(ship))

        // CREAZIONE IMMAGINE CANVAS
        const canvas = createCanvas(500, 500)
        const ctx = canvas.getContext('2d')

        // Sfondo Mare
        ctx.fillStyle = '#006994'; ctx.fillRect(0, 0, 500, 500)
        
        // Disegno Griglia
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2
        for (let i = 0; i <= 5; i++) {
            ctx.beginPath(); ctx.moveTo(50 + i * 90, 50); ctx.lineTo(50 + i * 90, 500); ctx.stroke() // Verticali
            ctx.beginPath(); ctx.moveTo(50, 50 + i * 90); ctx.lineTo(500, 50 + i * 90); ctx.stroke() // Orizzontali
        }

        // Numeri e Lettere
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px Sans'; ctx.textAlign = 'center'
        let letters = ['A', 'B', 'C', 'D', 'E']
        for (let i = 0; i < 5; i++) {
            ctx.fillText(i + 1, 95 + i * 90, 35) // 1 2 3 4 5
            ctx.fillText(letters[i], 25, 105 + i * 90) // A B C D E
        }

        // Disegno i Colpi
        letters.forEach((l, row) => {
            for (let col = 1; col <= 5; col++) {
                let currentCoord = l + col
                if (hits.includes(currentCoord)) {
                    let x = 95 + (col - 1) * 90
                    let y = 100 + row * 90
                    if (opponentBoard.includes(currentCoord)) {
                        // COLPITO (Esplosione rossa)
                        ctx.fillStyle = '#ff4d4d'; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill()
                        ctx.fillStyle = '#ffffff'; ctx.font = '40px Sans'; ctx.fillText('💥', x, y + 15)
                    } else {
                        // ACQUA (Cerchio azzurro)
                        ctx.strokeStyle = '#80d4ff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke()
                        ctx.fillStyle = '#80d4ff'; ctx.font = '30px Sans'; ctx.fillText('💧', x, y + 10)
                    }
                }
            }
        })

        if (win) {
            let vincitore = user
            delete global.navale[chat]
            return conn.sendMessage(m.chat, { image: canvas.toBuffer(), caption: `*💥 VITTORIA TOTALE!* 🏆\n\n@${vincitore.split('@')[0]} ha affondato l'ultima nave!`, mentions: [vincitore] }, { quoted: m })
        }

        game.turno = isP1 ? game.p2 : game.p1
        let esito = isHit ? `*🔥 COLPITO!*` : `*💦 ACQUA!*`
        
        return conn.sendMessage(m.chat, { 
            image: canvas.toBuffer(), 
            caption: `${esito}\n\n*Coordinate:* ${coord}\n*Prossimo turno:* @${game.turno.split('@')[0]}`, 
            mentions: [game.turno] 
        }, { quoted: m })
    }
}

function generateBoard() {
    let coords = []
    let letters = ['A', 'B', 'C', 'D', 'E']
    while (coords.length < 3) {
        let c = letters[Math.floor(Math.random() * 5)] + (Math.floor(Math.random() * 5) + 1)
        if (!coords.includes(c)) coords.push(c)
    }
    return coords
}

handler.command = /^(battaglia|accetta|rifiuta|fuoco|endgame|fine)$/i
handler.group = true
export default handler
