import { TelegramClient } from 'telegram'
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

  if (client) return m.reply('📡 Il ponte VOIP è già attivo e in ascolto per il tuo account.')

  try {
    await m.react('⏳')
    
    // Inizializzazione Client Telegram
    client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
      connectionRetries: 5,
    });

    // Avvio sessione (il codice va inserito nel terminale del bot)
    await client.start({
      phoneNumber: async () => numeroTelefono,
      password: async () => await input.text("Inserisci Password 2FA (se attiva): "),
      phoneCode: async () => await input.text("Inserisci il codice ricevuto su Telegram: "),
      onError: (err) => console.log(err),
    });

    // Log della sessione per il proprietario del bot
    console.log("✅ LOGIN TELEGRAM RIUSCITO!");
    console.log("SESSION_STRING:", client.session.save());

    await m.react('📡')
    await conn.sendMessage(m.chat, {
      text: `✅ *VOIP BRIDGE ATTIVATO*\n\nIl bot ora ascolta *@${targetBot}* sul tuo Telegram e riporterà i messaggi qui in privato.\n\n_Nota: Se è la prima volta, controlla il terminale per il codice._`,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363232743845068@newsletter',
          newsletterName: "✧ 𝙱𝙻𝙳-𝙱𝙾𝚃 𝚅𝙾𝙸𝙿 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 ✧"
        }
      }
    }, { quoted: m })

    // --- LOGICA DI ASCOLTO E RE-INVIO ---
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
    m.reply(`❌ *ERRORE:* ${e.message}\nAssicurati che il proprietario del bot inserisca il codice nel terminale.`)
  }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true // Rinforzo ulteriore per sola chat privata

export default handler
