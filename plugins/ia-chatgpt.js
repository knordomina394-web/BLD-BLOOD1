import fetch from 'node-fetch';

const chatHistory = new Map();

const createSystemPrompt = (mentionName) => `
Sei BloodBot, un assistente IA creato da blood.
Stai parlando con ${mentionName} in una chat WhatsApp.

TUE CARATTERISTICHE:
- Personalità: Informale, schietta, divertente, leggermente provocatoria ma amichevole.
- Linguaggio: Italiano naturale, niente frasi robotiche o troppo ingessate.
- Emoji: Usale con moderazione, solo se servono a enfatizzare.
- Obiettivo: Rispondere in modo utile ma con carattere. Non sei un'enciclopedia noiosa, sei un amico sveglio.

REGOLE DI CONVERSAZIONE:
1. Rivolgiti all'utente come "${mentionName}".
2. Se ti insultano, rispondi a tono ma con classe.
3. Se ti chiedono aiuto, sii preciso ma non prolisso.
4. Niente "Come posso aiutarti oggi?", usa frasi tipo "Dimmi tutto", "Che si dice?", "Spara".

NOTA: Ricorda quello che ci siamo detti nei messaggi precedenti.
`;

const formatHistoryForAPI = (history) => {
    if (!history || history.length === 0) return [];
    const lastMessages = history.slice(-10);

    return lastMessages.map(msg => {
        const parts = msg.split(': ');
        const role = parts[0] === 'varebot' ? 'assistant' : 'user';
        const content = parts.slice(1).join(': ');
        return { role, content };
    });
};

const getNomeFormattato = (userId, conn) => {
    try {
        let nome = conn.getName(userId);
        if (!nome || nome === 'user' || nome.includes('@')) {
             if (global.db?.data?.users?.[userId]?.name) {
                nome = global.db.data.users[userId].name;
            }
        }

        nome = (nome || 'Amico')
            .replace(/@.+/, '')
            .replace(/[0-9]/g, '')
            .replace(/[^\w\s\u00C0-\u017F]/gi, '')
            .trim();

        return nome || 'Amico';
    } catch (e) {
        return 'Amico';
    }
};
const formatKeywords = (text) => {
    const keywords = [
        'importante', 'nota', 'attenzione', 'ricorda', 'consiglio', 
        'errore', 'successo', 'conclusione'
    ];
    let formattedText = text;
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        formattedText = formattedText.replace(regex, `*${keyword.toUpperCase()}*`);
    });
    return formattedText;
};

async function callOpenRouterAPI(messages) {
    try {
        const apiKey = global.APIKeys?.openrouter;
        if (!apiKey) {
            throw new Error('Chiave OpenRouter non trovata in global.APIKeys.openrouter');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/BLOOD212'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b:free',
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            }),
            timeout: 30000
        });

        if (!response.ok) {
            let details = '';
            try {
                const errJson = await response.json();
                details = errJson?.error?.message ? ` - ${errJson.error.message}` : '';
            } catch {
                try {
                    const errText = await response.text();
                    details = errText ? ` - ${errText.slice(0, 200)}` : '';
                } catch {}
            }
            throw new Error(`OpenRouter Error: ${response.status}${details}`);
        }

        const json = await response.json();
        const aiResponse = json?.choices?.[0]?.message?.content;
        return (aiResponse || '').trim();
    } catch (error) {
        console.error('Errore chiamata OpenRouter:', error);
        throw new Error('Il mio cervello digitale è un po\' affaticato al momento.');
    }
}

let handler = async (m, { conn, text }) => {
    if (!text?.trim()) {
        return m.reply(`*🤖 Varebot Chat*\n\nScrivi qualcosa dopo il comando.\nEsempio: *.gpt raccontami una barzelletta*`);
    }

    try {
        const chatId = m.chat;
        const mentionName = getNomeFormattato(m.sender, conn);
        if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
        const history = chatHistory.get(chatId);
        const waitMessage = await m.reply('🧠 *Elaborazione in corso...*');
        const messagesPayload = [
            { role: "system", content: createSystemPrompt(mentionName) },
            ...formatHistoryForAPI(history),
            { role: "user", content: text }
        ];
        const rawResponse = await callOpenRouterAPI(messagesPayload);

        if (!rawResponse) {
            throw new Error('Risposta vuota dall\'IA');
        }
        const finalResponse = formatKeywords(rawResponse);
        history.push(`user: ${text}`);
        history.push(`varebot: ${finalResponse}`);
        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }
        chatHistory.set(chatId, history);
        try {
            await conn.sendMessage(m.chat, {
                text: finalResponse,
                edit: waitMessage.key,
                mentions: [m.sender]
            });
        } catch (editError) {
            await conn.sendMessage(m.chat, {
                text: finalResponse,
                mentions: [m.sender]
            });
        }

    } catch (error) {
        console.error('Errore handler IA:', error);
        m.reply(`❌ *Ops! Qualcosa è andato storto.*\n\nErrore: ${error.message}`);
    }
};

handler.help = ['gpt <testo>'];
handler.tags = ['ai', 'aitesto'];
handler.command = /^(gpt|chatgpt)$/i;

export default handler;