import { promises } from 'fs'
import { join } from 'path'
import moment from 'moment-timezone'

const emojicategoria = {
  info: 'ℹ️',
  main: '💠',
  sicurezza: '🛡️',
  giochi: '🎮'
}

let tags = {
  'main': '╭ *`SYSTEM MAIN`* ╯',
  'sicurezza': '╭ *`SECURITY SYSTEM`* ╯',
  'giochi': '╭ *`GAMES & FUN`* ╯',
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

    let text = _text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join('|')})`, 'g'), (_, name) => '' + replace[name]);

    const msgID = m.id || m.key?.id;
    const deviceType = detectDevice(msgID);

    if (deviceType === 'ios') {
      const buttons = [
        { buttonId: _p + 'attiva', buttonText: { displayText: '🛡️ Sicurezza' }, type: 1 },
        { buttonId: _p + 'menugiochi', buttonText: { displayText: '🎮 Giochi' }, type: 1 },
        { buttonId: _p + 'menugruppo', buttonText: { displayText: '👥 Gruppo' }, type: 1 }
      ];

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
          title: "🛡️ SISTEMA DI PROTEZIONE",
          rows: [
            { header: "『 🛡️ 』", title: "MENU SICUREZZA", description: "Configura Antilink, Antispam e Difese", id: _p + "attiva" }
          ]
        },
        {
          title: "🎮 AREA DIVERTIMENTO",
          rows: [
            { header: "『 🎮 』", title: "MENU GIOCHI", description: "Sfide, Divertimento e Classifiche", id: _p + "menugiochi" }
          ]
        },
        {
          title: "📂 CATEGORIE OPERATIVE",
          rows: [
            { header: "『 🤖 』", title: "Menu IA", id: _p + "menuia" },
            { header: "『 ⭐ 』", title: "Menu Premium", id: _p + "menupremium" },
            { header: "『 🛠️ 』", title: "Menu Strumenti", id: _p + "menustrumenti" },
            { header: "『 👥 』", title: "Menu Gruppo", id: _p + "menugruppo" },
            { header: "『 📥 』", title: "Menu Download", id: _p + "menudownload" },
            { header: "『 👨‍💻 』", title: "Menu Creatore", id: _p + "menucreatore" }
          ]
        }
      ];

      await conn.sendList(m.chat, "", text.trim(), "💠 SELEZIONA MODULO", MENU_IMAGE_URL, sections, m);
    }
    await m.react('💠');
  } catch (e) {
    console.error(e);
  }
};

handler.help = ['menu'];
handler.command = ['menu', 'help'];
export default handler;

function detectDevice(msgID) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios';
    return 'android';
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
