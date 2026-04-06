import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import input from 'input'

// --- CONFIGURAZIONE FISSA ---
const apiId = 29555234; 
const apiHash = '76110f0f5b9d8858f967f94d975e533c'; 
const targetBot = 'Number_Nest_Bot'; 
const numeroTelefono = '+573215575562';
const sessionSaved = ""; // <--- Incolla qui la stringa dopo il primo login nel terminale

let client = null;

let handler = async (m, { conn }) => {
  // --- CONTROLLO CHAT PRIVATA ---
  if (m.isGroup) return m.reply('❌ Questo comando può essere utilizzato solo in *Chat Privata*.')

  if (client) return m.reply('📡 Il ponte VOIP è già attivo e in ascolto.')

  try {
    await m.react('⏳')
    
    // Inizializzazione Client Telegram
    client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
      connectionRetries: 5,
    });

    // Avvio sessione
    await client.start({
      phoneNumber: async () => numeroTelefono,
      password: async () => await input.text("Inserisci Password 2FA (se attiva): "),
      phoneCode: async () => await input.text("Inserisci il codice ricevuto su Telegram: "),
      onError: (err) => console.log(err),
    });

    // --- INVIO AUTOMATICO /START AL BOT TELEGRAM ---
    await client.sendMessage(targetBot, { message: '/start' });

    // Log della sessione per il proprietario
    console.log("✅ LOGIN TELEGRAM RIUSCITO E /START INVIATO!");
    console.log("SESSION_STRING:", client.session.save());

    await m.react('📡')
    await conn.sendMessage(m.chat, {
      text: `✅ *VOIP BRIDGE ATTIVATO*\n\nHo inviato \`/start\` a *@${targetBot}*.\nIl bot ora è in ascolto e riporterà i messaggi qui.\n\n_Nota: Se è la prima volta, inserisci il codice nel terminale._`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363232743845068@newsletter',
          newsletterName: "✧ 𝙱𝙻𝙳-𝙱𝙾𝚃 𝚅𝙾𝙸𝙿 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 ✧"
        }
      }
    }, { quoted: m })

    // --- LOGICA DI ASCOLTO ---
    client.addEventHandler(async (event) => {
      const message = event.message;
      
      try {
        const sender = await message.getSender();
        
        // Verifica se il messaggio arriva dal bot specifico
        if (sender && sender.username === targetBot) {
          let contenuto = message.message || " [Contenuto Multimediale] ";

          // Invia il messaggio alla chat privata di WhatsApp
          await conn.sendMessage(m.chat, {
            text: `🤖 *MESSAGGIO DA @${targetBot}*\n\n${contenuto}`,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363232743845068@newsletter',
                newsletterName: "✧ 𝙱𝙻𝙳-𝙱𝙾𝚃 𝚅𝙾𝙸𝙿 𝚁𝙴𝙻𝙰𝚈 ✧"
              }
            }
          })
        }
      } catch (err) {
        console.error("Errore Relay:", err)
      }
    });

  } catch (e) {
    client = null;
    console.error(e)
    m.reply(`❌ *ERRORE:* ${e.message}`)
  }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
