let handler = async (m, { conn, text, usedPrefix, command }) => {
  let nomeDelBot = global.db.data.nomedelbot || `𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙`
  
  // Creiamo una sessione di gioco locale
  conn.akiLocale = conn.akiLocale ? conn.akiLocale : {}

  // Se l'utente vuole resettare
  if (text === 'reset' || text === 'stop') {
    delete conn.akiLocale[m.sender]
    return m.reply("🔄 Sessione resettata. Pensa a un altro personaggio!")
  }

  // Se c'è già una partita in corso
  if (conn.akiLocale[m.sender]) {
    let gioco = conn.akiLocale[m.sender]
    
    // Logica di avanzamento (Simulata)
    gioco.step++
    
    // Quando arriva alla domanda 10, prova a indovinare
    if (gioco.step >= 10) {
       let finale = `🧞‍♂️ *HO DECISO!*\n\n`
       finale += `Stai pensando a un personaggio famoso, vero?\n`
       finale += `Purtroppo il mio server è sotto attacco da Cloudflare, ma scommetto che era qualcuno di leggendario!\n\n`
       finale += `*Grazie per aver giocato con ${nomeDelBot}*`
       delete conn.akiLocale[m.sender]
       return m.reply(finale)
    }

    // Domande casuali per simulare il genio
    let domande = [
      "Il tuo personaggio è reale?",
      "È un uomo?",
      "Viene dall'Italia?",
      "È un cantante?",
      "Fa parte del mondo dei videogiochi?",
      "Ha più di 30 anni?",
      "Lo vedi spesso in TV?",
      "È uno YouTuber?",
      "Ha i capelli scuri?",
      "È un personaggio di un anime?"
    ]
    
    let q = domande[gioco.step] || "Mi sto avvicinando... è un personaggio positivo?"
    return inviaTasti(conn, m, q, gioco.step + 1)
  }

  // Avvio nuova partita
  conn.akiLocale[m.sender] = { step: 0 }
  let inizio = `*🧞‍♂️ BENVENUTO SU AKINATOR LOCAL!*\n\nIl sito ufficiale ci ha bloccato l'IP, ma io sono un Genio e giocherò con te lo stesso.\n\n*Domanda 1:* Il tuo personaggio è una persona reale?`
  
  return inviaTasti(conn, m, inizio, 1)
}

// Funzione Helper per i tasti (List Message o Buttons)
async function inviaTasti(conn, m, testo, num) {
  const sections = [
    {
      title: `Domanda n. ${num}`,
      rows: [
        {title: "Sì ✅", rowId: "si", description: "È corretto"},
        {title: "No ❌", rowId: "no", description: "Non è così"},
        {title: "Non so 🤷‍♂️", rowId: "boh", description: "Non ne sono sicuro"},
        {title: "RESET 🔄", rowId: "reset", description: "Ricomincia da capo"}
      ]
    }
  ]

  const listMessage = {
    text: testo,
    footer: "Seleziona una risposta dalla lista",
    title: "🧞‍♂️ AKINATOR GENIE",
    buttonText: "RISPONDI",
    sections
  }

  return conn.sendMessage(m.chat, listMessage, { quoted: m })
}

handler.help = ['akinator']
handler.tags = ['giochi']
handler.command = /^(akinator|aki)$/i

export default handler
