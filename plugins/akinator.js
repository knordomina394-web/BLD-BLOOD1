let handler = async (m, { conn, usedPrefix, command, args }) => {
  let nomeDelBot = global.db.data.nomedelbot || `𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙`
  
  // Inizializziamo la sessione locale (per evitare il blocco 403 di Cloudflare)
  conn.akiLocale = conn.akiLocale ? conn.akiLocale : {}

  // Se l'utente clicca su "Esci" o scrive reset
  if (args[0] === 'stop' || args[0] === 'reset') {
    delete conn.akiLocale[m.sender]
    return m.reply("🧞‍♂️ Partita terminata. Ti aspetto per la prossima sfida!")
  }

  // Database domande locale
  const domande = [
    "Il tuo personaggio è reale?",
    "È un maschio?",
    "È italiano?",
    "È un calciatore?",
    "È uno YouTuber o TikToker?",
    "È un cantante?",
    "È un personaggio di un anime/manga?",
    "Ha i capelli scuri?",
    "È un attore di cinema?",
    "È una persona che conosci personalmente?"
  ]

  // 1. GESTIONE RISPOSTA TRAMITE BOTTONI (args[0] conterrà la scelta)
  if (conn.akiLocale[m.sender]) {
    let gioco = conn.akiLocale[m.sender]
    
    // Incrementiamo lo step in base alla scelta (anche se simulato)
    gioco.step++

    // Se abbiamo finito le domande, spariamo l'ipotesi finale
    if (gioco.step >= domande.length) {
      delete conn.akiLocale[m.sender]
      return m.reply(`🧞‍♂️ *HO DECISO!*\n\nDopo aver analizzato le tue risposte, penso che il tuo personaggio sia qualcuno di **LEGGENDARIO**!\n\n✨ *Grazie per aver giocato con ${nomeDelBot}*`)
    }

    // Invia la domanda successiva con i bottoni
    return inviaDomanda(conn, m, domande[gioco.step], gioco.step + 1, usedPrefix, command)
  }

  // 2. AVVIO PARTITA
  conn.akiLocale[m.sender] = { step: 0 }
  let testoIniziale = `🧞‍♂️ *BENVENUTO SU AKINATOR*\n\nPensa a un personaggio reale o immaginario. Io proverò a indovinarlo!\n\n*Domanda 1:* ${domande[0]}`
  
  return inviaDomanda(conn, m, testoIniziale, 1, usedPrefix, command)
}

// Funzione per inviare i bottoni (Stesso stile del tuo script richieste)
async function inviaDomanda(conn, m, testo, num, usedPrefix, command) {
  return await conn.sendMessage(m.chat, {
    text: testo,
    footer: `Domanda n. ${num} • Akinator Game`,
    buttons: [
      { buttonId: `${usedPrefix}${command} si`, buttonText: { displayText: "Sì ✅" }, type: 1 },
      { buttonId: `${usedPrefix}${command} no`, buttonText: { displayText: "No ❌" }, type: 1 },
      { buttonId: `${usedPrefix}${command} boh`, buttonText: { displayText: "Non so 🤷‍♂️" }, type: 1 },
      { buttonId: `${usedPrefix}${command} stop`, buttonText: { displayText: "Esci 🚪" }, type: 1 }
    ],
    headerType: 1,
    viewOnce: true
  }, { quoted: m })
}

handler.help = ['akinator']
handler.tags = ['giochi']
handler.command = /^(akinator|aki)$/i

export default handler
