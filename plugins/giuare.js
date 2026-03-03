//plug-in by blood

let giullareSession = {}
let handler = async (m, { conn, command, text }) => {
    let chat = m.chat
    
    if (command === 'giullare') {
        if (giullareSession[chat]) return m.reply('⚠️ C\'è già un giullare attivo in questa chat. Aspetta che finisca.')
        
        // Determina la vittima: o il tag, o la persona a cui si risponde
        let victim = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null

        if (!victim) return m.reply('⚠️ Devi taggare qualcuno o rispondere a un suo messaggio per farlo diventare un giullare!')
        
        // Impedisce di auto-insultarsi (opzionale, rimuovi se vuoi che la gente possa auto-umiliarsi)
        if (victim === conn.user.jid) return m.reply('Pensavi davvero che mi sarei insultato da solo? Prova con un umano, fallito.')

        giullareSession[chat] = victim
        let name = `@${victim.split('@')[0]}`
        
        await conn.sendMessage(chat, { 
            text: `🚨 *GIULLARE SCELTO* 🚨\n\nBersaglio: ${name}\n\nL'utente che ha lanciato il comando ti ha condannato a 3 minuti di umiliazione pubblica. Ogni tua parola sarà punita. 🤡💀`, 
            mentions: [victim] 
        }, { quoted: m })

        // Timer 3 minuti
        setTimeout(() => {
            if (giullareSession[chat]) {
                delete giullareSession[chat]
                conn.sendMessage(chat, { text: `🎭 Il supplizio per ${name} è terminato. Torna pure nel tuo buco.` })
            }
        }, 180000)
    }
}

handler.before = async function (m, { conn }) {
    if (!m.chat || !m.sender || m.isBaileys) return
    if (!giullareSession[m.chat] || giullareSession[m.chat] !== m.sender) return

    // Reazione immediata 🤡
    await conn.sendMessage(m.chat, { react: { text: "🤡", key: m.key } })

    const i = [
        "Zitto, sacco di bava. 🤮", "Ancora parli? Fai schifo.", "Sei un errore genetico. 🤡",
        "Il tuo quoziente intellettivo è un bug. 💀", "Taci, rifiuto umano.", "Patetico.",
        "Qualcuno tiri lo sciacquone! 🚽", "Utile quanto un semaforo spento.", "Tua madre si vergogna di te. 💩",
        "Mi sporchi il database.", "Sei lo zimbello ufficiale.", "Spero che il tuo telefono esploda. 💣",
        "Vuoto a perdere biologico.", "Mangi i sassi per colazione? 🪨", "Zitto e mangia la merda.",
        "Concentrato di mediocrità.", "Ti fai insultare da un bot, sfigato.", "Profondità di un piattino.",
        "Hai deluso persino un computer.", "Stai zitto, aborto mancato. 🤮", "Tuo padre ha fatto bene a scappare.",
        "Fastidioso come la sabbia nel culo.", "Insulto all'evoluzione.", "Errore genetico.",
        "Gli alieni non ci visitano per colpa tua.", "Ombrello bucato.", "Vai a giocare sull'autostrada.",
        "Il tuo specchio ha chiesto il divorzio.", "Vendi ghiaccio al Polo Nord, vai.", "Macchia di unto sociale.",
        "Ammaso informe di molecole.", "Noioso come un documentario sui sassi.", "Bug vivente.",
        "Carisma di una melanzana.", "Personificazione del nulla.", "Albero genealogico a cerchio. 🎡",
        "L'ombra si vergogna di te.", "Spero ti si rompa il caricabatterie.", "Fallimento ISO 9001.",
        "Sprechi ossigeno utile.", "Cerchi di scorrere le foto sui libri. 📖", "Sacco di bava.",
        "Grazia di un elefante.", "Scherzo della natura.", "La solitudine ti rifiuta.",
        "Fatti un bagno nell'acido.", "Prototipo venuto male. 🤮", "Sei un insulto vivente.",
        "Taci, rifiuto.", "Sparisci dalla mia vista.", "Sei un rifiuto tossico.", "Taci, verme.",
        "Inutile come un frigo al Polo Nord.", "Ti puzza pure la scrittura.", "Smetti di respirare, sprechi aria.",
        "Tua faccia è un crimine.", "Sei un concentrato di sfiga.", "Chiudi quella bocca da cesso.",
        "Sei così stupido che inciampi nel wireless.", "Il tuo cervello è in sciopero."
    ]

    await conn.sendMessage(m.chat, { text: i[Math.floor(Math.random() * i.length)] }, { quoted: m })
    return true
}

handler.help = ['giullare']
handler.tags = ['giochi']
handler.command = /^(giullare)$/i
handler.group = true

export default handler
