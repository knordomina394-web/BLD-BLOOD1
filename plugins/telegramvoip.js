import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import input from 'input'

// --- CONFIGURAZIONE ---
const apiId = 2040; 
const apiHash = 'b18441a1ff607e10a989891a5462e627'; 
const targetBot = 'Number_Nest_Bot'; 
const numeroTelefono = '+573215575562';

// --- INCOLLA QUI LA TUA SESSION_STRING SE CE L'HAI ---
const sessionSaved = ""; 

let client = null;

let handler = async (m, { conn }) => {
  if (m.isGroup) return m.reply('❌ Questo comando funziona solo in *Chat Privata*.')

  try {
    await m.react('📡')

    // 1. Inizializzazione o recupero del client
    if (!client) {
      client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
        connectionRetries: 5,
      });

      await client.start({
        phoneNumber: async () => numeroTelefono,
        password: async () => await input.text("Inserisci Password 2FA (se attiva): "),
        phoneCode: async () => await input.text("Inserisci il codice ricevuto su Telegram: "),
        onError: (err) => console.log(err),
      });

      console.log("✅ SESSIONE ATTIVA!");
      console.log("SESSION_STRING:", client.session.save());

      // Attiviamo l'ascoltatore di eventi (Relay) una sola volta
      client.addEventHandler(async (event) => {
        const message = event.message;
        try {
          const sender = await message.getSender();
          if (sender && sender.username === targetBot) {
            let contenuto = message.message || " [Contenuto Multimediale] ";
            
            // Invia la risposta del bot Telegram su WhatsApp
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
            });
          }
        } catch (err) {
          console.error("Errore Relay:", err);
        }
      });
    }

    // 2. Invio del comando /start ogni volta che viene usato .voip
    await client.sendMessage(targetBot, { message: '/start' });
    
    await conn.sendMessage(m.chat, { 
      text: `📡 *COMANDO INVIATO*\nHo inviato \`/start\` a *@${targetBot}*.\nAttendi la risposta qui sotto...`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363232743845068@newsletter',
          newsletterName: "✧ 𝙱𝙻𝙳-𝙱𝙾𝚃 𝚅𝙾𝙸𝙿 𝚁𝙴𝙻𝙰𝚈 ✧"
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e)
    m.reply(`❌ *ERRORE:* ${e.message}`)
  }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
