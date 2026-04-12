// 🎯 PLUGIN VOIP ULTRA-AGGIORNATO BY GIUSE E BLOOD
// Ottimizzato per: Massima freschezza e bypass cache

let isScraperReady = false;
let axios, cheerio;

try {
    axios = (await import('axios')).default;
    cheerio = await import('cheerio');
    isScraperReady = true;
} catch (e) {
    console.log("ERRORE VOIP: Librerie mancanti.");
}

const baseUrl = 'https://sms24.me';

const getHeaders = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const nazioni = [
    { id: '1', nome: 'Stati Uniti 🇺🇸', path: '/en/countries/us' },
    { id: '2', nome: 'Regno Unito 🇬🇧', path: '/en/countries/gb' },
    { id: '3', nome: 'Francia 🇫🇷', path: '/en/countries/fr' },
    { id: '4', nome: 'Svezia 🇸🇪', path: '/en/countries/se' },
    { id: '5', nome: 'Germania 🇩🇪', path: '/en/countries/de' },
    { id: '6', nome: 'Italia 🇮🇹', path: '/en/countries/it' },
    { id: '7', nome: 'Olanda 🇳🇱', path: '/en/countries/nl' },
    { id: '8', nome: 'Spagna 🇪🇸', path: '/en/countries/es' },
    { id: '9', nome: 'Canada 🇨🇦', path: '/en/countries/ca' },
    { id: '10', nome: 'Hong Kong 🇭🇰', path: '/en/countries/hk' }
];

async function fetchMessaggi(numeroTelefono) {
    try {
        // Aggiunto timestamp per forzare il caricamento di SMS nuovi
        const numUrl = `${baseUrl}/en/numbers/${numeroTelefono}?t=${Date.now()}`;
        const { data } = await axios.get(numUrl, { headers: getHeaders() });
        const $ = cheerio.load(data);
        let messaggi = [];
        $('.shadow-sm, .list-group-item, .callout').each((i, el) => {
            let mittente = $(el).find('a').first().text().trim() || 'Sconosciuto';
            let tempo = $(el).find('.text-info, .text-muted, small').first().text().trim() || 'Adesso';
            let testo = $(el).text().replace(/\s+/g, ' ').replace(mittente, '').replace(tempo, '').trim();
            if (testo.length > 2) messaggi.push({ mittente, tempo, testo });
        });
        return messaggi;
    } catch (e) { return null; }
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!isScraperReady) return m.reply("Errore: Installa axios e cheerio.");

    const cmd = command.toLowerCase();

    // --- COMANDO LASTVOIPS: PRENDE I NUMERI APPENA AGGIUNTI ---
    if (cmd === 'lastvoips') {
        await m.reply("📡 Scansione in tempo reale dei numeri appena nati...");
        try {
            // Carica la home con bypass cache
            const { data } = await axios.get(`${baseUrl}/en?t=${Date.now()}`, { headers: getHeaders() });
            const $ = cheerio.load(data);
            let nuovi = [];

            $('a').each((i, el) => {
                let txt = $(el).text().trim();
                let num = txt.replace(/[^0-9]/g, '');
                if (txt.includes('+') && num.length > 8 && !nuovi.some(x => x.num === num)) {
                    nuovi.push({ num, full: txt });
                }
            });

            if (nuovi.length === 0) return m.reply("❌ Nessun numero nuovo trovato ora.");

            let res = `🔥 *NUMERI RECENTISSIMI* 🔥\n\n`;
            nuovi.slice(0, 10).forEach((n, i) => {
                res += `${i+1}️⃣  *+${n.num}*\n`;
            });
            res += `\nUsa *${usedPrefix}regvoip <numero>* per intercettare l'SMS.`;
            return m.reply(res);
        } catch { return m.reply("❌ Errore durante il recupero."); }
    }

    // --- COMANDO REGVOIP: IL RADAR INTELLIGENTE ---
    if (cmd === 'regvoip') {
        const num = args[0]?.replace('+', '').replace(/\s+/g, '');
        if (!num) return m.reply(`Esempio: ${usedPrefix}regvoip 393471234567`);

        await m.reply(`🟢 *RADAR ATTIVO SU +${num}*\nIn ascolto per 3 minuti. Invia l'SMS ora...`);

        let iniziali = await fetchMessaggi(num);
        let ultimoTesto = iniziali && iniziali.length > 0 ? iniziali[0].testo : "";

        for (let i = 0; i < 12; i++) { // Controlla ogni 15 secondi per 3 minuti
            await sleep(15000);
            let attuali = await fetchMessaggi(num);
            if (attuali && attuali.length > 0 && attuali[0].testo !== ultimoTesto) {
                let s = attuali[0];
                let alert = `✅ *SMS RICEVUTO!*\n\n📱 *Numero:* +${num}\n🏢 *Da:* ${s.mittente}\n🕒 *Quando:* ${s.tempo}\n💬 *SMS:* ${s.testo}`;
                return conn.sendMessage(m.chat, { text: alert }, { quoted: m });
            }
        }
        return m.reply(`⌛ *TIMEOUT:* Nessun nuovo SMS per +${num}.`);
    }

    // --- COMANDO VOIP: LISTA NAZIONI ---
    if (cmd === 'voip' && !args[0]) {
        let txt = `🌍 *SELEZIONA NAZIONE*\n\n`;
        nazioni.forEach(n => txt += `${n.id}. ${n.nome}\n`);
        txt += `\nScrivi *${usedPrefix}voip <ID>* per i numeri.`;
        return m.reply(txt);
    }

    // --- COMANDO VOIP <ID>: NUMERI PER NAZIONE ---
    if (cmd === 'voip' && args[0]) {
        const nazione = nazioni.find(n => n.id === args[0]);
        if (!nazione) return m.reply("ID non valido.");

        await m.reply(`🔍 Cerco numeri freschi per ${nazione.nome}...`);
        try {
            const { data } = await axios.get(`${baseUrl}${nazione.path}?t=${Date.now()}`, { headers: getHeaders() });
            const $ = cheerio.load(data);
            let lista = [];
            $('a').each((i, el) => {
                let t = $(el).text().trim();
                if (t.includes('+')) lista.push(t.replace(/[^0-9]/g, ''));
            });

            let res = `📱 *NUMERI DISPONIBILI: ${nazione.nome}*\n\n`;
            [...new Set(lista)].slice(0, 8).forEach(n => res += `• +${n}\n`);
            res += `\nCopia il numero e usa *${usedPrefix}regvoip* per leggere il codice.`;
            return m.reply(res);
        } catch { return m.reply("❌ Errore di connessione."); }
    }
};

handler.command = /^(voip|regvoip|lastvoips)$/i;
export default handler;
