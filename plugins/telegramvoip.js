import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'

const apiId = 2040;
const apiHash = 'b18441a1ff607e10a989891a5462e627';
const targetBotUsername = "Number_Nest_Bot";
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

global.tgVoip = global.tgVoip || {
    client: null,
    conn: null,
    currentUser: null,
    chatId: null,
    queue: [],
    monitorTimer: null,
    inactivityTimer: null,
    currentButtons: [],
    isListening: false
};

let handler = async (m, { conn, text }) => {
    if (m.isGroup) return;
    const userId = m.chat.toString(); // Forziamo a stringa per confronti sicuri

    // 1. COMANDO RESET TOTALE
    if (text === 'reset') {
        global.tgVoip.currentUser = null;
        global.tgVoip.queue = [];
        global.tgVoip.chatId = null;
        if (global.tgVoip.monitorTimer) clearTimeout(global.tgVoip.monitorTimer);
        if (global.tgVoip.inactivityTimer) clearTimeout(global.tgVoip.inactivityTimer);
        return m.reply("♻️ **SISTEMA RESETTATO**\nTutte le sessioni e le code sono state pulite. Ora riprova `.voip`.");
    }

    // 2. AUTO-SBLOCCO (Se la coda è vuota o ci sei solo tu, prendi il controllo)
    if (!global.tgVoip.currentUser || global.tgVoip.currentUser === userId) {
        global.tgVoip.currentUser = userId;
        global.tgVoip.chatId = m.chat; // ID originale per l'invio messaggi
        global.tgVoip.conn = conn;
    } else {
        // GESTIONE CODA REALE
        const alreadyInQueue = global.tgVoip.queue.find(q => q.chatId === userId);
        if (!alreadyInQueue) {
            global.tgVoip.queue.push({ chatId: userId, name: m.pushName });
        }
        const pos = global.tgVoip.queue.findIndex(q => q.chatId === userId) + 1;
        return m.reply(`⚠️ **BOT OCCUPATO**\n\nAttualmente in uso da un altro utente.\nSei in posizione: *${pos}*.\n\n_Se pensi sia un errore, scrivi:_ `.voip reset``);
    }

    try {
        // Connessione Client Telegram
        if (!global.tgVoip.client || !global.tgVoip.client.connected) {
            global.tgVoip.client = new TelegramClient(new StringSession(sessionSaved), apiId, apiHash, { connectionRetries: 5 });
            await global.tgVoip.client.connect();
        }

        // Handler Eventi (Solo se non già attivo)
        if (!global.tgVoip.isListening) {
            global.tgVoip.client.addEventHandler(async (event) => {
                const message = event.message;
                if (!message || !message.peerId) return;
                
                const sender = await message.getSender();
                const sUsername = sender?.username;
                const sId = message.senderId?.toString();

                if (sUsername !== targetBotUsername && sId !== targetBotUsername) return;

                let testo = message.message || "";
                let bottoniInTesto = "";
                let bottoniTrovati = [];

                // Rileva Codice 6 cifre
                const otpMatch = testo.match(/\b\d{6}\b/);
                if (otpMatch) testo = `🔑 **CODICE TROVATO: ${otpMatch[0]}**\n\n` + testo;

                // Estrazione bottoni inline
                if (message.replyMarkup?.rows) {
                    let count = 1;
                    bottoniInTesto = "\n\n🔘 **SELEZIONA OPZIONE (Invia il numero):**\n";
                    for (const row of message.replyMarkup.rows) {
                        for (const button of row.buttons) {
                            if (button.text && !(message.replyMarkup instanceof Api.ReplyKeyboardMarkup)) {
                                bottoniTrovati.push({ msg: message, btn: button });
                                bottoniInTesto += `*${count}* - ${button.text}\n`;
                                count++;
                            }
                        }
                    }
                }

                global.tgVoip.currentButtons = bottoniTrovati;

                // Invia solo all'utente attivo
                if (global.tgVoip.currentUser) {
                    await global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { 
                        text: `🤖 **TELEGRAM:**\n\n${testo}${bottoniInTesto}` 
                    });
                }
            }, new NewMessage({ incoming: true }));
            global.tgVoip.isListening = true;
        }

        // Avvio Interazione
        await global.tgVoip.client.sendMessage(targetBotUsername, { message: text || "/start" });
        await m.react('📡');
        startInactivityTimer();

    } catch (e) {
        console.error("Errore Main:", e);
        resetSession();
    }
}

handler.before = async (m) => {
    const userId = m.chat.toString();
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.tgVoip.currentUser) return;
    if (userId !== global.tgVoip.currentUser) return;

    startInactivityTimer(); // Reset timer 2 min ad ogni messaggio

    const input = m.text.trim();
    const num = parseInt(input);
    const bottoni = global.tgVoip.currentButtons || [];

    // Se l'utente sceglie un numero
    if (!isNaN(num) && bottoni.length > 0 && bottoni[num - 1]) {
        try {
            const target = bottoni[num - 1];
            await m.react('🔘');
            await target.msg.click(target.btn);
            
            await m.reply("✅ **OPZIONE INVIATA**\nMonitoraggio attivo per **4 minuti**. Riceverai ogni risposta del bot qui.");
            
            // Avvio Timer 4 Minuti
            if (global.tgVoip.monitorTimer) clearTimeout(global.tgVoip.monitorTimer);
            global.tgVoip.monitorTimer = setTimeout(() => {
                global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { text: "⌛ **SESSIONE FINITA**\nI 4 minuti sono scaduti. Il bot ora è libero." });
                resetSession();
            }, 4 * 60 * 1000);
            return;
        } catch (err) { console.error("Errore Click:", err); }
    }

    // Inoltro testo libero
    try {
        await global.tgVoip.client.sendMessage(targetBotUsername, { message: m.text });
    } catch (e) { console.error("Errore Inoltro:", e); }
}

// --- LOGICA DI GESTIONE TEMPO ---

function startInactivityTimer() {
    if (global.tgVoip.inactivityTimer) clearTimeout(global.tgVoip.inactivityTimer);
    global.tgVoip.inactivityTimer = setTimeout(() => {
        if (global.tgVoip.currentUser) {
            global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { text: "⏰ **SESSIONE SCADUTA**\nInattività di 2 minuti. Il bot passa al prossimo utente." });
            resetSession();
        }
    }, 2 * 60 * 1000);
}

function resetSession() {
    if (global.tgVoip.monitorTimer) clearTimeout(global.tgVoip.monitorTimer);
    if (global.tgVoip.inactivityTimer) clearTimeout(global.tgVoip.inactivityTimer);
    
    global.tgVoip.currentUser = null;
    global.tgVoip.currentButtons = [];

    if (global.tgVoip.queue.length > 0) {
        const next = global.tgVoip.queue.shift();
        global.tgVoip.currentUser = next.chatId;
        global.tgVoip.chatId = next.chatId;
        global.tgVoip.conn.sendMessage(next.chatId, { text: "🎟️ **È IL TUO TURNO!**\nHai 2 minuti per inviare un comando prima della scadenza." });
        startInactivityTimer();
    }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
