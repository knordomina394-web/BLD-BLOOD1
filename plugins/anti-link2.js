import fetch from 'node-fetch'
import { FormData } from 'formdata-node'
import { downloadContentFromMessage } from '@realvare/based'

const sonoilgattoperquestitopi = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)/gi;

const doms = {
    tiktok: ['tiktok.com', 'vm.tiktok.com', 'tiktok.it'],
    youtube: ['youtube.com', 'youtu.be'],
    telegram: ['telegram.me', 't.me'],
    facebook: ['facebook.com', 'fb.com'],
    instagram: ['instagram.com', 'instagr.am'],
    twitter: ['twitter.com', 'x.com'],
    discord: ['discord.gg', 'discord.com'],
    snapchat: ['snapchat.com'],
    linkedin: ['linkedin.com', 'lnkd.in'],
    twitch: ['twitch.tv'],
    reddit: ['reddit.com', 'redd.it'],
    onlyfans: ['onlyfans.com'],
    github: ['github.com'],
    bitly: ['bit.ly'], 
    tinyurl: ['tinyurl.com']
};

// --- FUNZIONI DI SUPPORTO ---
async function getMediaBuffer(m) {
    try {
        const msg = m.message?.imageMessage || m.message?.videoMessage || 
                    m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
                    m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        if (!msg) return null;
        const stream = await downloadContentFromMessage(msg, msg.mimetype?.startsWith('video') ? 'video' : 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    } catch { return null; }
}

async function readQRCode(buffer) {
    try {
        const formData = new FormData();
        formData.append('file', buffer, 'image.jpg');
        const res = await fetch('https://api.qrserver.com/v1/read-qr-code/', { method: 'POST', body: formData });
        const data = await res.json();
        return data?.[0]?.symbol?.[0]?.data || null;
    } catch { return null; }
}

function extractPossibleText(m) {
    let texts = [
        m.text,
        m.message?.extendedTextMessage?.text,
        m.message?.imageMessage?.caption,
        m.message?.videoMessage?.caption,
        m.message?.pollCreationMessageV3?.name,
        m.message?.pollCreationMessage?.name
    ];
    // Aggiunge opzioni sondaggio
    const poll = m.message?.pollCreationMessageV3 || m.message?.pollCreationMessage;
    if (poll?.options) poll.options.forEach(o => texts.push(o.optionName));
    
    return texts.filter(Boolean).join(' ').trim();
}

function detectSocialLink(url) {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();
    for (const [platform, domains] of Object.entries(doms)) {
        if (domains.some(domain => lowerUrl.includes(domain))) return platform;
    }
    return null;
}

// --- HANDLER PRINCIPALE ---
export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (!m.isGroup || !isBotAdmin || isAdmin || m.fromMe) return false;

    const chat = global.db.data.chats[m.chat];
    if (!chat?.antiLink2) return false;

    const extractedText = extractPossibleText(m);
    let detectedPlatform = null;
    let isQR = false;

    // 1. Controllo immediato Testo/Link
    if (extractedText) {
        const urls = extractedText.match(sonoilgattoperquestitopi) || [];
        for (const url of urls) {
            detectedPlatform = detectSocialLink(url);
            if (detectedPlatform) break;
        }
    }

    // 2. Controllo Media/QR (solo se non ha già trovato un link nel testo)
    if (!detectedPlatform) {
        const media = await getMediaBuffer(m);
        if (media) {
            const qrData = await readQRCode(media);
            detectedPlatform = detectSocialLink(qrData);
            if (detectedPlatform) isQR = true;
        }
    }

    // 3. Azione (Cancellazione e Warn)
    if (detectedPlatform) {
        // CANCELLAZIONE ISTANTANEA
        await conn.sendMessage(m.chat, { delete: m.key }).catch(() => {});

        const users = global.db.data.users || {}; // Uso il db users globale per coerenza
        const user = users[m.sender] = users[m.sender] || {};
        user.antiLink2Warns = (user.antiLink2Warns || 0) + 1;

        if (user.antiLink2Warns < 3) {
            return await conn.sendMessage(m.chat, {
                text: `> 『 ⚠️ 』 Avviso *${user.antiLink2Warns}/3* @${m.sender.split('@')[0]} per link ${detectedPlatform}${isQR ? ' (QR)' : ''}.\n\n> \`BloodBot\``,
                mentions: [m.sender]
            });
        } else {
            user.antiLink2Warns = 0;
            await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {});
            return await conn.sendMessage(m.chat, {
                text: `> 『 🛑 』 @${m.sender.split('@')[0]} rimosso per eccesso di link.\n\n> \`BloodBot\``,
                mentions: [m.sender]
            });
        }
    }
    return true;
}

export { before as handler };
