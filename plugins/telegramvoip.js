import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'

// --- CONFIGURAZIONE ---
const apiId = 2040;
const apiHash = 'b18441a1ff607e10a989891a5462e627';
const targetBotUsername = "Number_Nest_Bot";
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

// Inizializzazione variabili globali sicura
global.tgVoip = global.tgVoip || {
    client: null,
    conn: null,
    chatId: null,
    isListening: false,
    currentButtons: [] 
};

let handler = async (m, { conn, text }) => {
    if (m.isGroup) return;
    global.tgVoip.conn = conn;
    global.tgVoip.chatId = m.chat;

    try {
        if (!global.tgVoip.client || !global.tgVoip.client.connected) {
            global.tgVoip.client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, { connectionRetries: 5 });
            await global.tgVoip.client.connect();
        }

        if (!global.tgVoip.isListening) {
            global.tgVoip.client.addEventHandler(async (event) => {
                const message = event.message;
                if (!message) return;

                // Verifica mittente (sia username che ID per sicurezza)
                const sender = await message.getSender();
                if (sender?.username !== targetBotUsername && message.senderId?.toString() !== targetBotUsername) return;

                let testoCorpo = message.message || "";
                let listaNumerata = "";
                let nuoviBottoni = [];

                // LOGICA DI NUMERAZIONE FORZATA
                if (message.replyMarkup && message.replyMarkup.rows) {
                    let count = 1;
                    listaNumerata = "\n\n🔢 *SELEZIONA UN NUMERO:*\n";

                    for (const row of message.replyMarkup.rows) {
                        for (const button of row.buttons) {
                            if (button.text) {
                                nuoviBottoni.push({
                                    msg: message,
                                    btn: button
                                });
                                // Costruiamo la lista numerata usando il testo originale del pulsante
                                listaNumerata += `*${count}* - ${button.text}\n`;
                                count++;
                            }
                        }
                    }
                }

                // Salviamo i bottoni nell'oggetto globale per il recupero tramite numero
                global.tgVoip.currentButtons = nuoviBottoni;

                // Se sono stati trovati bottoni, aggiungiamo la lista numerata al messaggio
                let messaggioFinale = `🤖 *RISPOSTA DA TELEGRAM*\n\n${testoCorpo}${listaNumerata}`;

                if (global.tgVoip.conn && global.tgVoip.chatId) {
                    await global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { text: messaggioFinale });
                }
            }, new NewMessage({ incoming: true }));
            global.tgVoip.isListening = true;
        }

        await global.tgVoip.client.sendMessage(targetBotUsername, { message: text || "/start" });
        await m.react('📡');

    } catch (e) {
        console.error("Errore avvio:", e);
    }
}

handler.before = async (m) => {
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.tgVoip?.client) return;
    if (m.chat !== global.tgVoip.chatId) return;

    const input = m.text.trim();
    const numeroScelto = parseInt(input);
    const bottoniDisponibili = global.tgVoip.currentButtons || [];

    // Se l'input è un numero e abbiamo una lista di bottoni attiva
    if (!isNaN(numeroScelto) && bottoniDisponibili.length > 0) {
        const index = numeroScelto - 1; 

        if (bottoniDisponibili[index]) {
            try {
                const target = bottoniDisponibili[index];
                await m.react('🔘'); 

                // ESECUZIONE CLICK: Il bot preme il pulsante su Telegram
                await target.msg.click(target.btn);
                
                // Opzionale: puliamo i bottoni dopo il click per evitare errori su messaggi vecchi
                // global.tgVoip.currentButtons = []; 
                
                return; 
            } catch (err) {
                console.error("Errore nel click del pulsante:", err);
            }
        }
    }

    // Se l'input non è un numero, lo inviamo come testo normale (es. codici o nomi)
    try {
        await global.tgVoip.client.sendMessage(targetBotUsername, { message: m.text });
        await m.react('📤');
    } catch (e) {
        console.error("Errore invio testo:", e);
    }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
