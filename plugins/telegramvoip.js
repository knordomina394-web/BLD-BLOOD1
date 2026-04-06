import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import input from 'input'

// --- CONFIGURAZIONE ---
const apiId = 2040; 
const apiHash = 'b18441a1ff607e10a989891a5462e627'; 
const targetBot = 'Number_Nest_Bot'; 
const numeroTelefono = '+573215575562';

// SVUOTA QUESTA STRINGA SE CONTINUI A RICEVERE L'ERRORE 401
let sessionSaved = ""; 

let client = null;

let handler = async (m, { conn }) => {
  if (m.isGroup) return m.reply('❌ Questo comando funziona solo in *Chat Privata*.')

  try {
    // Se il client esiste ma la sessione è corrotta (Errore 401), resettiamo
    if (client && !client.connected) {
        client = null;
    }

    if (!client) {
      await m.reply('⏳ *Inizializzazione sessione...* Controlla il terminale se richiesto.')
      client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
        connectionRetries: 5,
      });

      await client.start({
        phoneNumber: async () => numeroTelefono,
        password: async () => await input.text("Inserisci Password 2FA (se attiva): "),
        phoneCode: async () => await input.text("Inserisci il codice ricevuto su Telegram: "),
        onError: (err) => console.log("Errore client:", err),
      });

      // Salva la nuova sessione nel log
      console.log("✅ NUOVA SESSIONE GENERATA! COPIALA QUI SOTTO:");
      console.log(client.session.save());
      
      // Attiviamo l'ascoltatore
      client.addEventHandler(async (event) => {
        const message = event.message;
        try {
          const sender = await message.getSender();
          if (sender && sender.username === targetBot) {
            let contenuto = message.message || " [Contenuto Multimediale] ";
            await conn.sendMessage(m.chat, {
              text: `🤖 *RISPOSTA DA @${targetBot}*\n\n${contenuto}`,
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
        } catch (err) { console.error("Errore Relay:", err); }
      });
    }

    // Invia /start al bot
    await client.sendMessage(targetBot, { message: '/start' });
    await m.react('📡')

  } catch (e) {
    console.error(e)
    // Se l'errore è 401, avvisa l'utente di resettare la sessione
    if (e.message.includes('401')) {
        client = null; // Resetta il client locale
        m.reply('❌ *Sessione Scaduta/Non Valida.*\nHo resettato la connessione. Per favore, digita di nuovo `.voip` e inserisci il nuovo codice nel terminale.')
    } else {
        m.reply(`❌ *ERRORE:* ${e.message}`)
    }
  }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
