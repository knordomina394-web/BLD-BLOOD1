import { Aki } from 'aki-api'

// FIX: Risolve l'errore AxiosError: unable to get local issuer certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let nomeDelBot = global.db.data.nomedelbot || `𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙`
  
  // Inizializza l'oggetto delle sessioni
  conn.akinator = conn.akinator ? conn.akinator : {}

  // Se l'utente vuole resettare la partita
  if (text === 'reset') {
    if (!conn.akinator[m.sender]) return m.reply("Non hai nessuna partita attiva.")
    delete conn.akinator[m.sender]
    return m.reply("🔄 Sessione di Akinator resettata.")
  }

  // 1. GESTIONE PARTITA IN CORSO
  if (conn.akinator[m.sender]) {
    let { aki, msg } = conn.akinator[m.sender]
    
    // Controlla che l'input sia un numero valido
    if (!text || isNaN(text) || text < 0 || text > 4) {
      return m.reply(`⚠ Risposta non valida! Invia un numero da 0 a 4.\n\n0 = Sì\n1 = No\n2 = Non so\n3 = Probabilmente sì\n4 = Probabilmente no\n\n_Esempio: ${usedPrefix + command} 0_`)
    }

    try {
      await aki.step(text.trim())

      // Se Akinator è pronto a dare una risposta
      if (aki.progress >= 80 || aki.currentStep >= 70) {
        await aki.win()
        let personaggio = aki.answers[0]
        let txt = `✨ *L'HO INDOVINATO!* ✨\n\n`
        txt += `👤 *Nome:* ${personaggio.name}\n`
        txt += `📝 *Descrizione:* ${personaggio.description}\n`
        txt += `🎯 *Ranking:* ${personaggio.ranking}\n\n`
        txt += `*${nomeDelBot}*`
        
        await conn.sendMessage(m.chat, { 
          image: { url: personaggio.absolute_picture_path }, 
          caption: txt 
        }, { quoted: m })
        
        delete conn.akinator[m.sender]
        return
      }

      // Prossima domanda (con bottoni o testo)
      let domanda = `*🤖 AKINATOR*\n\n`
      domanda += `*Domanda n. ${aki.currentStep + 1}:*\n`
      domanda += `> _${aki.question}_\n\n`
      domanda += `0️⃣ - Sì\n`
      domanda += `1️⃣ - No\n`
      domanda += `2️⃣ - Non so\n`
      domanda += `3️⃣ - Probabilmente sì\n`
      domanda += `4️⃣ - Probabilmente no\n\n`
      domanda += `*Rispondi con ${usedPrefix + command} [numero]*`

      // Usiamo l'edit per non intasare la chat
      await conn.sendMessage(m.chat, { text: domanda, edit: msg }, { quoted: m })

    } catch (e) {
      console.error(e)
      delete conn.akinator[m.sender]
      return m.reply("❌ Errore durante la partita. Sessione chiusa.")
    }

  } else {
    // 2. AVVIO NUOVA PARTITA
    try {
      let aki = new Aki({ region: 'it' })
      await aki.start()
      
      let intro = `*🎮 AKINATOR È INIZIATO!*\n\n`
      intro += `*Domanda n. 1:*\n> _${aki.question}_\n\n`
      intro += `Rispondi usando il numero:\n`
      intro += `*${usedPrefix + command} 0* (Sì)\n`
      intro += `*${usedPrefix + command} 1* (No)\n`
      intro += `*${usedPrefix + command} 2* (Non so)\n`
      intro += `*${usedPrefix + command} 3* (Sì+)\n`
      intro += `*${usedPrefix + command} 4* (No+)`

      let { key } = await conn.sendMessage(m.chat, { text: intro }, { quoted: m })
      
      // Salviamo la sessione con la chiave del messaggio per l'edit
      conn.akinator[m.sender] = {
        aki,
        msg: key
      }

    } catch (e) {
      console.error(e)
      return m.reply("❌ Impossibile avviare Akinator. Riprova più tardi.")
    }
  }
}

handler.help = ['akinator']
handler.tags = ['giochi']
handler.command = /^(akinator|aki)$/i

handler.owner = false
handler.admin = false
handler.group = false
handler.private = false

export default handler
