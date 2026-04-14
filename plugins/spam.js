/**
 * Plugin per inviare messaggi ripetuti (Spam)
 * Struttura compatibile con il tuo sistema di handler
 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    try {
        // Controllo se è presente il testo
        if (!text) throw `『 📎 』 \`Inserisci il testo da spammare\`\n\n\`Esempio:\`\n*${usedPrefix + command} ciao a tutti*`

        const spamCount = 40 // Numero di ripetizioni
        const messageToSpam = text.trim()
        
        // Funzione per il ritardo (0.5 secondi)
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

        // Ciclo di invio
        for (let i = 0; i < spamCount; i++) {
            await conn.sendMessage(m.chat, { text: messageToSpam })
            
            // Applica il micro-ritardo richiesto
            await delay(500)
        }

        // Notifica opzionale al termine (puoi rimuoverla se preferisci il silenzio)
        return m.reply(`✅ Operazione completata: 40 messaggi inviati.`)

    } catch (error) {
        console.error('Errore nel comando spam:', error)
        if (typeof error === 'string') return m.reply(error)
        return m.reply(`⚠️ Si è verificato un errore durante l'esecuzione.`)
    }
}

// Configurazione Handler
handler.help = ['spam [testo]']
handler.tags = ['strumenti']
handler.command = /^spam$/i

export default handler
