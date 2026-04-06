import { promises } from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

const emojicategoria = {
  info: 'ℹ️',
  main: '💠',
  sicurezza: '🛡️'
}

let tags = {
  'main': '╭ *`SYSTEM MAIN`* ╯',
  'sicurezza': '╭ *`SECURITY SYSTEM`* ╯',
  'info': '╭ *`DATABASE INFO`* ╯'
}

const defaultMenu = {
  before: `
┏━━━━━━━━━━━━━━━━━━━━┓
   💠  *B L D  -  B O T* 💠
┗━━━━━━━━━━━━━━━━━━━━┛
 ┌───────────────────
 │ 👤 *User:* %name
 │ 🕒 *Uptime:* %uptime
 │ 👥 *Total Users:* %totalreg
 └───────────────────
 
 *Seleziona un modulo operativo qui sotto:*
`.trimStart(),
  header: '      ⋆｡˚『 %category 』˚｡⋆\n╭',
  body: '*│ ➢* 『%emoji』 %cmd',
  footer: '*╰━━━━━━━──────━━━━━━━*\n',
  after: `_Powered by BLD-BOT Interface_`,
}

const MENU_IMAGE_URL = 'https://i.ibb.co/hJW7WwxV/varebot.jpg';

// Funzione per rilevare il dispositivo
function detectDevice(msgID) {
  if (!msgID) return 'unknown'; 
  if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) return 'bot';
  if (msgID.startsWith('false_') || msgID.startsWith('true_')) return 'web';
  if (msgID.startsWith('3EB0') && /^[A-Z0-9]+$/.test(msgID)) return 'web';
  if (msgID.includes(':')) return 'desktop';
  if (/^[A-F0-9]{32}$/i.test(msgID)) return 'android';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios';
  if (/^[A-Z0-9]{20,25}$/i.test(msgID) && !msgID.startsWith('3EB0')) return 'ios';
  return 'unknown';
}

let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    let name = await conn.getName(m.sender) || 'User';
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data.users).length;

    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
      };
    });

    let menuTags = Object.keys(tags);
    let _text = [
      defaultMenu.before,
      ...menuTags.map(tag => {
        return defaultMenu.header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help[0]).map(menu => {
            return menu.help.map(help => {
              return defaultMenu.body
                .replace(/%cmd/g, menu.prefix ? help : _p + help)
                .replace(/%emoji/g, emojicategoria[tag] || '🔹')
                .trim();
            }).join('\n');
          }),
          defaultMenu.footer
        ].join('\n');
      }),
      defaultMenu.after
    ].join('\n');

    let replace = { '%': '%', p: _p, uptime, name, totalreg };
    let text = _text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join('|')})`, 'g'), (_, name) => '' + replace[name]);

    const msgID = m.id || m.key?.id;
    const deviceType = detectDevice(msgID);

    // Definizione di tutti i tasti (8 Sezioni)
    const allMenuRows = [
      { id: _p + "attiva", title: "🛡️ Menu Sicurezza", description: "Antilink e Protezioni" },
      { id: _p + "menugiochi", title: "🎮 Menu Giochi", description: "Divertimento e Sfide" },
      { id: _p + "menuia", title: "🤖 Menu IA", description: "Intelligenza Artificiale" },
      { id: _p + "menugruppo", title: "👥 Menu Gruppo", description: "Gestione del Gruppo" },
      { id: _p + "menudownload", title: "📥 Menu Download", description: "Social Downloader" },
      { id: _p + "menustrumenti", title: "🛠️ Menu Strumenti", description: "Utility e Tools" },
      { id: _p + "menupremium", title: "⭐ Menu Premium", description: "Funzioni Esclusive" },
      { id: _p + "menucreatore", title: "👨‍💻 Menu Creatore", description: "Pannello Owner" }
    ];

    if (deviceType === 'ios') {
      // Per iPhone usiamo i Buttons fisici (Massimo 5 per stabilità)
      const buttons = allMenuRows.slice(0, 5).map(menu => ({
        buttonId: menu.id,
        buttonText: { displayText: menu.title },
        type: 1
      }));

      await conn.sendMessage(m.chat, {
        image: { url: MENU_IMAGE_URL },
        caption: text.trim(),
        footer: "B L D - B O T  S Y S T E M",
        buttons: buttons,
        headerType: 4,
        viewOnce: true
      }, { quoted: m });

    } else {
      // Per Android/Web usiamo la lista interattiva completa
      await conn.sendList(m.chat, 
        "💠 BLD-BOT SYSTEM", 
        text.trim(), 
        "💠 SELEZIONA MODULO", 
        MENU_IMAGE_URL, 
        [{ title: "TUTTI I MODULI OPERATIVI", rows: allMenuRows }], 
        m
      );
    }

    await m.react('💠');

  } catch (e) {
    console.error(e);
  }
};

handler.help = ['menu'];
handler.command = ['menu', 'help'];
export default handler;

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
