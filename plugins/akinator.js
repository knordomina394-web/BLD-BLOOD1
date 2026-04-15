import { Aki } from 'aki-api'

const sessions = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const chatId = m.chat

    if (command === 'akinator' || command === 'aki') {
        if (sessions.has(chatId)) return m.reply('C\'è già una partita attiva qui!')
        
        try {
            const aki = new Aki({ region: 'it', childMode: false })
            await aki.start()
            sessions.set(chatId, aki)

            await conn.sendMessage(m.chat, {
                text: `🤔 *Domanda:* ${aki.question}`,
                footer: 'Seleziona una risposta',
                buttons: [
                    { buttonId: `${usedPrefix}akiara 0`, buttonText: { displayText: 'Sì' }, type: 1 },
                    { buttonId: `${usedPrefix}akiara 1`, buttonText: { displayText: 'No' }, type: 1 },
                    { buttonId: `${usedPrefix}akiara 2`, buttonText: { displayText: 'Non lo so' }, type: 1 }
                ],
                headerType: 1
            }, { quoted: m })
        } catch (e) {
            console.error('AKINATOR START ERROR:', e)
            m.reply('*ERRORE:* Impossibile connettersi ai server di Akinator.')
        }
    }

    if (command === 'akiara') {
        const aki = sessions.get(chatId)
        if (!aki) return
        if (!text) return

        try {
            await aki.step(text.trim())

            if (aki.progress >= 85 || aki.currentStep >= 30) {
                await aki.win()
                const guess = aki.answers[0]
                
                let winTxt = `*L'HO TROVATO!*\n\n👤 *Personaggio:* ${guess.name}\n📝 *Descrizione:* ${guess.description}\n\n*Progresso:* ${Math.round(aki.progress)}%`
                
                await conn.sendMessage(m.chat, { 
                    image: { url: guess.absolute_picture_path }, 
                    caption: winTxt 
                }, { quoted: m })
                
                sessions.delete(chatId)
            } else {
                await conn.sendMessage(m.chat, {
                    text: `🤔 *Domanda:* ${aki.question}\n\n*Progresso:* ${Math.round(aki.progress)}%`,
                    footer: 'Continua a rispondere',
                    buttons: [
                        { buttonId: `${usedPrefix}akiara 0`, buttonText: { displayText: 'Sì' }, type: 1 },
                        { buttonId: `${usedPrefix}akiara 1`, buttonText: { displayText: 'No' }, type: 1 },
                        { buttonId: `${usedPrefix}akiara 2`, buttonText: { displayText: 'Boh' }, type: 1 }
                    ],
                    headerType: 1
                }, { quoted: m })
            }
        } catch (e) {
            console.error('AKINATOR STEP ERROR:', e)
            sessions.delete(chatId)
            m.reply('Errore durante la partita. Sessione chiusa.')
        }
    }
}

handler.help = ['akinator']
handler.tags = ['game']
handler.command = /^(akinator|aki|akiara)$/i

export default handler
