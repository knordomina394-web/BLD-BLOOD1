let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        if (!text) throw `『 📎 』 \`Inserisci il testo da spammare\`\n\n\`Esempio:\`\n*${usedPrefix + command} messaggio*`

        const spamCount = 40 
        const messageToSpam = text.trim()
        
        // Funzione di attesa
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

        for (let i = 0; i < spamCount; i++) {
            // Invio senza citazione (quoted) per rendere l'invio leggermente più fluido
            await conn.sendMessage(m.chat, { text: messageToSpam })
            
            // 100ms è il limite di sicurezza per uno spam "veloce"
            await delay(100)
        }

        return m.reply(`✅ Inviati 40 messaggi con intervallo di sicurezza (100ms).`)

    } catch (error) {
        console.error('Errore nel comando spam:', error)
        if (typeof error === 'string') return m.reply(error)
        return m.reply(`⚠️ Errore durante l'invio.`)
    }
}

handler.help = ['spam [testo]']
handler.tags = ['strumenti']
handler.command = /^spam$/i
handler.register = true 

export default handler
