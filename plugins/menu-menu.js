import { promises } from 'fs'
import { join } from 'path'
import moment from 'moment-timezone'

const emojicategoria = {
  info: 'ℹ️',
  main: '💠'
}

let tags = {
  'main': '╭ *`SYSTEM MAIN`* ╯',
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
 
 *Seleziona un'interfaccia operativa:*
`.trimStart(),
  header: '      ⋆｡˚『 %category 』˚｡⋆\n╭',
  body: '*│ ➢* 『%emoji』 %cmd',
  footer: '*╰━━━━━━━──────━━━━━━━*\n',
  after: `_Powered by BLD-BOT Interface_`,
}

// URL immagine quadrata (Catbox)
const MENU_IMAGE_URL = 'https://files.catbox.moe/u8o020.jpg';

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

    let replace = {
      '%': '%',
      p: _p,
      uptime: uptime,
      name: name,
      totalreg: totalreg,
    };

    let text = _text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name]);

    const msgID = m.id || m.key?.id;
    const deviceType = detectDevice(msgID);

    // LOGICA DI INVIO PER DISPOSITIVO
    if (deviceType === 'ios') {
      const buttons = getRandomMenus().map(menu => ({
        buttonId: _p + menu.command,
        buttonText: { displayText: menu.title },
        type: 1
      }));

      // Invio come immagine con bottoni (iOS)
      await conn.sendMessage(m.chat, {
        image: { url: MENU_IMAGE_URL },
        caption: text.trim(),
        footer: "BLD-BOT CENTRAL SYSTEM",
        buttons: buttons,
        headerType: 4
      }, { quoted: m });

    } else {
      const sections = [
        {
          title: "⭐ Menu Consigliati ⭐",
          rows: [
            { title: "Menu IA", rowId: _p + "menuia", description: "Intelligenza Artificiale" },
            { title: "Menu Premium", rowId: _p + "menupremium", description: "Funzioni Extra" }
          ]
        },
        {
          title: "📂 Categorie BLD-BOT",
          rows: [
            { title: "Menu Strumenti", rowId: _p + "menustrumenti" },
            { title: "Menu Euro", rowId: _p + "menueuro" },
            { title: "Menu Giochi", rowId: _p + "menugiochi" },
            { title: "Menu Gruppo", rowId: _p + "menugruppo" },
            { title: "Menu Ricerche", rowId: _p + "menuricerche" },
            { title: "Menu Download", rowId: _p + "menudownload" },
            { title: "Menu Creatore", rowId: _p + "menucreatore" }
          ]
        }
      ];

      // Metodo universale: Invio Immagine + Lista Comandi (Android/Web/Desktop)
      await conn.sendList(
        m.chat, 
        "", // Titolo superiore (vuoto per pulizia)
        text.trim(), // Il menu va qui come didascalia dell'immagine
        "💠 APRI LISTA COMANDI",
        MENU_IMAGE_URL, // Immagine allegata
        sections,
        m
      );
    }

    await m.react('💠');

  } catch (e) {
    console.error(e)
    // Se fallisce l'invio complesso, prova l'invio semplice dell'immagine
    conn.sendMessage(m.chat, { image: { url: MENU_IMAGE_URL }, caption: "Errore nel caricamento dei bottoni, ecco il menu:\n\n" + e.message }, { quoted: m });
  }
};

handler.help = ['menu'];
handler.command = ['menu', 'menuall', 'help'];
export default handler;

// --- UTILS ---
function detectDevice(msgID) {
  if (!msgID) return 'unknown';
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios';
  if (/^[A-Z0-9]{20,25}$/i.test(msgID) && !msgID.startsWith('3EB0')) return 'ios';
  return 'android';
}

function getRandomMenus() {
  const allMenus = [
    { title: "🤖 Menu IA", command: "menuia" },
    { title: "⭐ Menu Premium", command: "menupremium" },
    { title: "🛠️ Menu Strumenti", command: "menustrumenti" },
    { title: "💰 Menu Euro", command: "menueuro" },
    { title: "🎮 Menu Giochi", command: "menugiochi" }
  ];
  return allMenus.sort(() => 0.5 - Math.random()).slice(0, 3);
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
