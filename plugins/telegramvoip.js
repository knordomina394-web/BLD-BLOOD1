import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage, UpdateNewMessage } from 'telegram/events/index.js'

// --- CONFIGURAZIONE ---
const apiId = 2040;
const apiHash = 'b18441a1ff607e10a989891a5462e627';
const targetBotUsername = "Number_Nest_Bot";
const sessionSaved = "1BAAOMTQ5LjE1NC4xNjcuOTEAUB9OQLQkNqxtxPwutWa2/cpTA8jxTWL1WgZojzgQL+RSVbiUMnVC71ydpMfscNdF5bCR9ijjwkkb3SD5/LRFNC+KGpPiJBDNr48MAT1TQZI9WA/Ld/RhjKu2/jThMk5pnJ3pSzDF3eWaD3KOjVqPNRQ5diSpO55KVHvkWp10albKXG1yXFOSOrcT7i8tg+hRNqfIWp334sXiYt6o+WP+JuSQXeheXMRvPIo17H/vVIbQN66hVsxOa/SKQgzzhQD9fXNeOIoSO6owjtJsmbwH1r9b/OB+hZ3J7Xd9o4gjv9clALS2SyB+A/Vs2/V4j/I/oKAFUpS7DbwoVD1oJ5Xh90A";

global.tgVoip = global.tgVoip || {
    client: null,
    conn: null,
    chatId: null,
    isListening: false,
    currentButtons: [] 
};

// Funzione unica per elaborare e inviare il messaggio a WhatsApp
const processAndSend = async (message) => {
    if (!message) return;
    
    // Verifica mittente
    const sender = await message.getSender();
    if (sender?.username !== targetBotUsername && message.senderId?.toString() !== targetBotUsername) return;

    let testoCorpo = message.message || "";
    let listaNumerata = "";
    let bottoniTrovati = [];

    // Estrazione bottoni Inline (Ignora ReplyKeyboard fissa)
    if (message.replyMarkup && message.replyMarkup.rows) {
        let count = 1;
        for (const row of message.replyMarkup.rows) {
            for (const button of row.buttons) {
                // Filtriamo solo i bottoni cliccabili del messaggio
                if (button.text && !(message.replyMarkup instanceof Api.ReplyKeyboardMarkup)) {
                    bottoniTrovati.push({ msg: message, btn: button });
                    listaNumerata += `*${count}* - ${button.text}\n`;
                    count++;
                }
            }
        }
    }

    if (listaNumerata !== "") {
        listaNumerata = "\n\n🔘 *OPZIONI DISPONIBILI:*\n" + listaNumerata;
    }

    global.tgVoip.currentButtons = bottoniTrovati;
    let messaggioFinale = `🤖 *DA TELEGRAM*\n\n${testoCorpo}${listaNumerata}`;

    if (global.tgVoip.conn && global.tgVoip.chatId) {
        await global.tgVoip.conn.sendMessage(global.tgVoip.chatId, { text: messaggioFinale });
    }
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
            // Ascolta nuovi messaggi
            global.tgVoip.client.addEventHandler(async (event) => {
                await processAndSend(event.message);
            }, new NewMessage({ incoming: true }));

            // Ascolta modifiche ai messaggi (fondamentale per i bot di questo tipo)
            global.tgVoip.client.addEventHandler(async (event) => {
                const message = event.message;
                await processAndSend(message);
            }, new UpdateNewMessage());

            global.tgVoip.isListening = true;
        }

        await global.tgVoip.client.sendMessage(targetBotUsername, { message: text || "/start" });
        await m.react('📡');

    } catch (e) {
        console.error(e);
    }
}

handler.before = async (m) => {
    if (m.isGroup || !m.text || m.text.startsWith('.') || !global.tgVoip?.client) return;
    if (m.chat !== global.tgVoip.chatId) return;

    const input = m.text.trim();
    const numeroScelto = parseInt(input);
    const bottoni = global.tgVoip.currentButtons || [];

    if (!isNaN(numeroScelto) && bottoni.length > 0) {
        const index = numeroScelto - 1;
        if (bottoni[index]) {
            try {
                const target = bottoni[index];
                await m.react('🔘');
                await target.msg.click(target.btn);
                return;
            } catch (err) {
                console.error("Errore click:", err);
            }
        }
    }

    try {
        await global.tgVoip.client.sendMessage(targetBotUsername, { message: m.text });
        await m.react('📤');
    } catch (e) {
        console.error(e);
    }
}

handler.help = ['voip']
handler.tags = ['strumenti']
handler.command = ['voip']
handler.private = true 

export default handler
