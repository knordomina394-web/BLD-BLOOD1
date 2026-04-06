import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'

// --- CONFIGURAZIONE FISSA ---
const apiId = 2040; 
const apiHash = 'b18441a1ff607e10a989891a5462e627'; 
const targetBotId = "5916422327"; 
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

// Inizializzazione ponte globale
global.voipBridge = global.voipBridge || { 
    client: null, 
    whatsapp: null, 
    chatId: null 
};

let handler = async (m, { conn, text }) => {
    if (m.isGroup) return;

    // Aggiorna i riferimenti ogni volta che usi il comando
    global.voipBridge.whatsapp = conn;
    global.voipBridge.chatId = m.chat;

    try {
        if (!global.voipBridge.client || !global.voipBridge.client.connected) {
            console.log("📡 Connessione a Telegram...");
            global.voipBridge.client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
                connectionRetries: 5,
            });
            await global.voipBridge.client.connect();

            // --- ASCOLTATORE DI EVENTI BLOCCATO ---
            global.voipBridge.client.addEventHandler(async (event) => {
                const message = event.message;
                if (!message || !message.text) return;

                const senderId = message.senderId ? message.senderId.toString() : "";
                
                // Se il mittente è il bot di Telegram
                if (senderId.includes(targetBotId)) {
                    console.log("📥 Messaggio ricevuto da Telegram!");
                    
                    // Usa il riferimento globale per inviare a WhatsApp
                    if (global.voipBridge.whatsapp && global.voipBridge.chatId) {
                        try {
                            await global.voipBridge.whatsapp.sendMessage(global.voipBridge.chatId, { 
                                text: message.text 
                            });
                        } catch (err) {
                            console.error("Errore invio WhatsApp:", err);
                        }
                    }
                }
            }, new NewMessage({}));
            console.log("✅ Ponte Telegram-WhatsApp Attivo.");
        }

        // Invia il comando
        const toSend = text ? text : "/start";
        await global.voipBridge.client.sendMessage("Number_Nest_Bot", { message: toSend });
        await m.react('📡');

    } catch (e) {
        console.error("Errore:", e);
        m.reply(`❌ Errore: ${e.message}`);
    }
}

// Per rispondere scrivendo normalmente
handler.before = async (m) => {
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.voipBridge.client) return;
    if (m.chat === global.voipBridge.chatId) {
        await global.voipBridge.client.sendMessage("Number_Nest_Bot", { message: m.text });
        await m.react('📤');
    }
}

handler.command = ['voip']
handler.private = true 

export default handler
