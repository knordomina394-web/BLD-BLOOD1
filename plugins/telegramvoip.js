import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'

// --- CONFIGURAZIONE ---
const apiId = 2040; 
const apiHash = 'b18441a1ff607e10a989891a5462e627'; 
const targetBotId = "5916422327"; 
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

// Variabili di stato globali per evitare doppioni al riavvio del plugin
if (!global.tgBridge) {
    global.tgBridge = {
        client: null,
        lastJid: null,
        isListening: false
    };
}

let handler = async (m, { conn, text }) => {
    if (m.isGroup) return;

    // Salva il tuo JID così il bot sa a chi mandare i messaggi in arrivo
    global.tgBridge.lastJid = m.chat;

    try {
        // 1. Connessione al Client (solo se non esiste)
        if (!global.tgBridge.client) {
            console.log("📡 Connessione a Telegram in corso...");
            global.tgBridge.client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, {
                connectionRetries: 5,
            });
            await global.tgBridge.client.connect();
            console.log("✅ Connesso a Telegram.");
        }

        // 2. Registrazione dell'ascoltatore (solo se non è già attivo)
        if (!global.tgBridge.isListening) {
            global.tgBridge.client.addEventHandler(async (event) => {
                const message = event.message;
                if (!message || !message.text) return;

                const senderId = message.senderId ? message.senderId.toString() : "";
                
                // Se il messaggio arriva dal bot VOIP
                if (senderId.includes(targetBotId)) {
                    if (global.tgBridge.lastJid) {
                        // Copia e incolla il testo su WhatsApp
                        await conn.sendMessage(global.tgBridge.lastJid, { 
                            text: message.text 
                        });
                    }
                }
            }, new NewMessage({}));
            global.tgBridge.isListening = true;
            console.log("👂 In ascolto per nuovi messaggi da Telegram...");
        }

        // 3. Invio del comando a Telegram
        // Se scrivi solo .voip manda /start, altrimenti manda il tuo testo
        const messageToSend = text ? text : "/start";
        await global.tgBridge.client.sendMessage("Number_Nest_Bot", { message: messageToSend });
        await m.react('✅');

    } catch (e) {
        console.error(e);
        m.reply(`❌ Errore: ${e.message}`);
    }
}

// Gestore per le risposte dirette: se scrivi un messaggio normale dopo aver attivato il bridge
handler.before = async (m) => {
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.tgBridge.client) return;
    
    // Se l'ultimo JID attivo sei tu, ogni messaggio che scrivi viene girato a Telegram
    if (m.chat === global.tgBridge.lastJid) {
        try {
            await global.tgBridge.client.sendMessage("Number_Nest_Bot", { message: m.text });
            await m.react('📤');
        } catch (e) {
            console.error("Errore invio bridge:", e);
        }
    }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
