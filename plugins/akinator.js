import { Aki } from 'aki-api'

const sessions = new Map()

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const chatId = m.chat

    if (command === 'akinator' || command === 'aki') {
        if (sessions.has(chatId)) return m.reply('C\'è già una partita in corso in questa chat!')
        
        try {
            const aki = new Aki({ region: 'it' })
            await aki.start()
            sessions.set(chatId, aki)

            let txt = `*AKINATOR*\n\n`
            txt += `🤔 *Domanda:* ${aki.question}\n\n`
            txt += `0️⃣: Sì\n`
            txt += `1️⃣: No\n`
            txt += `2️⃣: Non lo so\n`
            txt += `3️⃣: Probabilmente sì\n`
            txt += `4️⃣: Probabilmente no\n\n`
            txt += `*Rispondi con:* ${usedPrefix}akiara [numero]`
            
            await m.reply(txt)
        } catch (e) {
            m.reply('[ERROR]: Impossibile avviare Akinator.')
        }
    }

    if (command === 'akiara') {
        const aki = sessions.get(chatId)
        if (!aki) return m.reply(`Nessuna partita attiva. Inizia con ${usedPrefix}akinator`)
        if (!text) return m.reply('Inserisci il numero della risposta (0-4)')

        try {
            await aki.step(text.trim())

            if (aki.progress >= 85 || aki.currentStep >= 30) {
                await aki.win()
                const guess = aki.answers[0]
                
                let winTxt = `*L'HO TROVATO!*\n\n`
                winTxt += `👤 *Personaggio:* ${guess.name}\n`
                winTxt += `📝 *Descrizione:* ${guess.description}\n\n`
                winTxt += `Spero di aver indovinato! Partita terminata.`
                
                await conn.sendMessage(m.chat, { image: { url: guess.absolute_picture_path }, caption: winTxt }, { quoted: m })
                sessions.delete(chatId)
            } else {
                let nextTxt = `*AKINATOR*\n\n`
                nextTxt += `🤔 *Domanda:* ${aki.question}\n\n`
                nextTxt += `0-Sì | 1-No | 2-Boh | 3-Forse sì | 4-Forse no`
                await m.reply(nextTxt)
            }
        } catch (e) {
            sessions.delete(chatId)
            m.reply('[ERROR]: Sessione scaduta o errore tecnico.')
        }
    }
}

handler.help = ['akinator']
handler.tags = ['game']
handler.command = ['akinator', 'aki', 'akiara']

export default handler