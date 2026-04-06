import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'

// --- CONFIGURAZIONE FISSA ---
const apiId = 2040; 
const apiHash = 'b18441a1ff607e10a989891a5462e627'; 
const targetBotId = "5916422327"; 
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

// Oggetto globale per mantenere la connessione stabile
global.tgVoip = global.tgVoip || {
    client: null,
    conn: null,
    chatId: null
};

let handler = async (m, { conn, text }) => {
    if (m.isGroup) return;

    // Aggiorniamo i riferimenti WhatsApp ogni volta che viene usato il comando
    global.tgVoip.conn = conn;
    global.tgVoip.chatId = m.chat;

    try {
        // 1. Inizializza il client solo se non esiste o non è connesso
        if (!global.tgVoip.client || !global.tgVoip.client.connected) {
            console.log("📡 Avvio ponte Telegram...");
            global.tgVoip.client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
                connectionRetries: 5,
            });

            await global.tgVoip.client.connect();
            console.log("✅ Telegram Connesso.");

            // 2. Registra l'ascoltatore UNA SOLA VOLTA
            global.tgVoip.client.addEventHandler(async (event) => {
                const message = event.message;
                if (!message || !message.text) return;

                const senderId = message.senderId ? message.senderId.toString() : "";
                
                // Se il messaggio arriva dal bot target su Telegram
                if (senderId.includes(targetBotId) || senderId === "5916422327") {
                    console.log("📥 Messaggio ricevuto da Telegram, inoltro in corso...");
                    
                    if (global.tgVoip.conn && global.tgVoip.chatId) {
                        try {
                            // COPIA E INCOLLA PURO
                            await global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { 
                                text: message.text 
                            });
                        } catch (err) {
                            console.error("❌ Errore invio WhatsApp:", err);
                        }
                    }
                }
            }, new NewMessage({}));
        }

        // 3. Invio comando a Telegram (senza ripetere il login)
        const toSend = text ? text : "/start";
        await global.tgVoip.client.sendMessage("Number_Nest_Bot", { message: toSend });
        await m.react('📡');

    } catch (e) {
        console.error("❌ Errore Plugin:", e);
        m.reply(`Errore: ${e.message}`);
    }
}

// Supporto per rispondere scrivendo normalmente nella chat
handler.before = async (m) => {
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.tgVoip.client) return;
    if (m.chat === global.tgVoip.chatId) {
        try {
            await global.tgVoip.client.sendMessage("Number_Nest_Bot", { message: m.text });
            await m.react('📤');
        } catch (e) {
            console.error("❌ Errore risposta:", e);
        }
    }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
