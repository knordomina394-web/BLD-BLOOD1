let handler = async (m, { conn, usedPrefix, command, args }) => {
  let nomeDelBot = global.db.data.nomedelbot || `𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙`
  
  conn.akiLocale = conn.akiLocale ? conn.akiLocale : {}

  // Database Personaggi e relativi punteggi ideali
  // (Semplificato per logica interna senza API esterne)
  const personaggi = [
    { name: "Cristiano Ronaldo", desc: "Uno dei calciatori più forti della storia.", tags: ["reale", "maschio", "italiano_no", "sport"] },
    { name: "Sfera Ebbasta", desc: "Famoso rapper italiano, il King della Trap.", tags: ["reale", "maschio", "italiano", "cantante"] },
    { name: "Goku", desc: "Il leggendario guerriero Saiyan di Dragon Ball.", tags: ["fantasia", "maschio", "italiano_no", "anime"] },
    { name: "Chiara Ferragni", desc: "La più nota imprenditrice digitale e influencer italiana.", tags: ["reale", "femmina", "italiano", "social"] },
    { name: "Khaby Lame", desc: "Il re di TikTok famoso per i suoi video muti.", tags: ["reale", "maschio", "italiano", "social"] },
    { name: "Luffy (Cappello di Paglia)", desc: "Capitano della ciurma di One Piece.", tags: ["fantasia", "maschio", "italiano_no", "anime"] }
  ]

  const domande = [
    { q: "Il tuo personaggio esiste nella realtà?", tag: "reale" },
    { q: "È un maschio?", tag: "maschio" },
    { q: "È italiano?", tag: "italiano" },
    { q: "È un cantante?", tag: "cantante" },
    { q: "È un atleta o sportivo?", tag: "sport" },
    { q: "Fa parte del mondo dei social (TikTok/IG)?", tag: "social" },
    { q: "Viene da un anime o manga?", tag: "anime" }
  ]

  // Gestione Reset/Stop
  if (args[0] === 'stop' || args[0] === 'reset') {
    delete conn.akiLocale[m.sender]
    return m.reply("🧞‍♂️ *GIOCO INTERROTTO*\n\nLa sfida è finita. Torna quando avrai un personaggio più difficile!")
  }

  // 1. LOGICA DI GIOCO
  if (conn.akiLocale[m.sender]) {
    let gioco = conn.akiLocale[m.sender]
    let risposta = args[0].toLowerCase()

    // Registra la risposta per il calcolo finale
    if (risposta === 'si') gioco.punti.push(domande[gioco.step].tag)
    
    gioco.step++

    // FINE GIOCO: Calcolo del personaggio più probabile
    if (gioco.step >= domande.length) {
      // Trova il personaggio con più corrispondenze nei tag
      let vincitore = personaggi.sort((a, b) => {
        let scoreA = a.tags.filter(t => gioco.punti.includes(t)).length
        let scoreB = b.tags.filter(t => gioco.punti.includes(t)).length
        return scoreB - scoreA
      })[0]

      let resultTxt = `✨ *L'HO INDOVINATO!* ✨\n\n`
      resultTxt += `👤 *Nome:* ${vincitore.name}\n`
      resultTxt += `📝 *Dettagli:* ${vincitore.desc}\n\n`
      resultTxt += `*Spero di averci preso!* 🧞‍♂️`
      
      delete conn.akiLocale[m.sender]
      return m.reply(resultTxt)
    }

    // Prossima Domanda
    return inviaAkiDomanda(conn, m, domande[gioco.step].q, gioco.step + 1, usedPrefix, command)
  }

  // 2. INIZIO PARTITA
  conn.akiLocale[m.sender] = { step: 0, punti: [] }
  let intro = `🧞‍♂️ *IL GENIO AKINATOR*\n\nPensa a un personaggio famoso. Io proverò a leggere la tua mente!\n\n📌 *Prima Domanda:* ${domande[0].q}`
  
  return inviaAkiDomanda(conn, m, intro, 1, usedPrefix, command)
}

async function inviaAkiDomanda(conn, m, testo, num, usedPrefix, command) {
  return await conn.sendMessage(m.chat, {
    text: testo,
    footer: `Step ${num}/7 • ${global.db.data.nomedelbot || 'Akinator'}`,
    buttons: [
      { buttonId: `${usedPrefix}${command} si`, buttonText: { displayText: "Sì ✅" }, type: 1 },
      { buttonId: `${usedPrefix}${command} no`, buttonText: { displayText: "No ❌" }, type: 1 },
      { buttonId: `${usedPrefix}${command} stop`, buttonText: { displayText: "Arrenditi 🏳️" }, type: 1 }
    ],
    headerType: 1,
    viewOnce: true
  }, { quoted: m })
}

handler.help = ['akinator']
handler.tags = ['giochi']
handler.command = /^(akinator|aki)$/i

export default handler
