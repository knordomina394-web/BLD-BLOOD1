import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import input from 'input'

const apiId = 2040;
const apiHash = 'b18441a1ff607e10a989891a5462e627';
const targetBot = 'Number_Nest_Bot';
const numeroTelefono = '+393756347502';
let sessionSaved = ""; 

let client = null;

let handler = async (m, { conn, text }) => {
  if (m.isGroup) return m.reply('❌ Solo in Chat Privata.')

  try {
    if (!client || !client.connected) {
      client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, { connectionRetries: 5 });
      
      await client.start({
        phoneNumber: async () => numeroTelefono,
        password: async () => await input.text("Password 2FA: "),
        phoneCode: async () => await input.text("Codice Telegram: "),
        onError: (err) => console.log(err),
      });

      console.log("✅ SESSIONE GENERATA:", client.session.save());

      client.addEventHandler(async (event) => {
        if (event && event.message) {
          const msg = event.message;
          if (msg.peerId && msg.text) {
             // Inoltra su WhatsApp
             await conn.sendMessage(m.chat, { text: `🤖 *TELEGRAM:* ${msg.text}` });
          }
        }
      });
    }

    let toSend = text ? text : "/start";
    await client.sendMessage(targetBot, { message: toSend });
    await m.react('📡');

  } catch (e) {
    console.error(e);
    m.reply(`❌ Errore: ${e.message}`);
  }
}

handler.command = ['voip']
handler.private = true 

export default handler
