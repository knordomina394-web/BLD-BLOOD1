import { promises } from 'fs'
import { join } from 'path'
import moment from 'moment-timezone'

const emojicategoria = {
  info: 'ℹ️',
  main: '💠',
  sicurezza: '🛡️' // Emoji per la nuova categoria
}

let tags = {
  'main': '╭ *`SYSTEM MAIN`* ╯',
  'sicurezza': '╭ *`SECURITY SYSTEM`* ╯', // Tag per il Menu Sicurezza
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

const MENU_IMAGE_URL = 'https://i.ibb.co/hJW7WwxV/varebot.jpg';

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

    if (deviceType === 'ios') {
      const randomMenus = getRandomMenus();
      const buttons = randomMenus.map(menu => ({
        buttonId: _p + menu.command,
        buttonText: { displayText: menu.title },
        type: 1
      }));

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
          title: "🛡️ PROTEZIONE & SICUREZZA 🛡️",
          rows: [
            { header: "『 🛡️ 』", title: "Menu Sicurezza", description: "Attiva/Disattiva moduli di protezione", id: _p + "attiva" }
          ]
        },
        {
          title: "⭐ Menu Consigliati ⭐",
          rows: [
            { header: "『 🤖 』", title: "Menu IA", description: "Intelligenza Artificiale", id: _p + "menuia" },
            { header: "『 ⭐ 』", title: "Menu Premium", description: "Funzionalità Premium", id: _p + "menupremium" }
          ]
        },
        {
          title: "📂 Tutte le Categorie",
          rows: [
            { header: "『 🛠️ 』", title: "Menu Strumenti", description: "Utilità e tools", id: _p + "menustrumenti" },
            { header: "『 💰 』", title: "Menu Euro", description: "Sistema economico", id: _p + "menueuro" },
            { header: "『 🎮 』", title: "Menu Giochi", description: "Games e divertimento", id: _p + "menugiochi" },
            { header: "『 👥 』", title: "Menu Gruppo", description: "Gestione gruppi", id: _p + "menugruppo" },
            { header: "『 🔍 』", title: "Menu Ricerche", description: "Ricerca online", id: _p + "menuricerche" },
            { header: "『 📥 』", title: "Menu Download", description: "Scarica contenuti", id: _p + "menudownload" },
            { header: "『 👨‍💻 』", title: "Menu Creatore", description: "Comandi owner", id: _p + "menucreatore" }
          ]
        }
      ];

      await conn.sendList(
        m.chat, 
        "",
        text.trim(),
        "💠 APRI LISTA COMANDI",
        MENU_IMAGE_URL,
        sections,
        m
      );
    }

    await m.react('💠');

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '❌ Error: ' + e.message, m)
  }
};

handler.help = ['menu'];
handler.command = ['menu', 'menuall', 'help'];
export default handler;

// --- UTILITIES ---

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

function getRandomMenus() {
  const allMenus = [
    { title: "🛡️ Menu Sicurezza", command: "attiva" },
    { title: "🤖 Menu IA", command: "menuia" },
    { title: "⭐ Menu Premium", command: "menupremium" },
    { title: "🛠️ Menu Strumenti", command: "menustrumenti" },
    { title: "💰 Menu Euro", command: "menueuro" },
    { title: "🎮 Menu Giochi", command: "menugiochi" },
    { title: "👥 Menu Gruppo", command: "menugruppo" },
    { title: "🔍 Menu Ricerche", command: "menuricerche" },
    { title: "📥 Menu Download", command: "menudownload" },
    { title: "👨‍💻 Menu Creatore", command: "menucreatore" }
  ];
  return allMenus.sort(() => 0.5 - Math.random()).slice(0, 5);
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
