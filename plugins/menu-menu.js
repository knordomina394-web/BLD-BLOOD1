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
 
 *PANNELLO DI CONTROLLO:*
`.trimStart(),
  header: '      ⋆｡˚『 %category 』˚｡⋆\n╭',
  body: '*│ ➢* 『%emoji』 %cmd',
  footer: '*╰━━━━━━━──────━━━━━━━*\n',
  after: `_Powered by BLD-BOT Interface_`,
}

const swag = 'https://i.ibb.co/hJW7WwxV/varebot.jpg';

// --- SISTEMA DI RILEVAMENTO DISPOSITIVO ---
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

function getRandomMenus(_p) {
  const allMenus = [
    { title: "🛡️ SICUREZZA", command: "attiva" },
    { title: "🎮 GIOCHI", command: "menugiochi" },
    { title: "🤖 IA", command: "menuia" },
    { title: "👥 GRUPPO", command: "menugruppo" },
    { title: "📥 DOWNLOAD", command: "menudownload" },
    { title: "🛠️ STRUMENTI", command: "menustrumenti" },
    { title: "⭐ PREMIUM", command: "menupremium" },
    { title: "👨‍💻 OWNER", command: "menucreatore" }
  ];
  const shuffled = allMenus.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

let handler = async (m, { conn, usedPrefix: _p, __dirname }) => {
  try {
    await conn.sendPresenceUpdate('composing', m.chat)
    let name = await conn.getName(m.sender) || 'User';
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);
    let totalreg = Object.keys(global.db.data.users).length;

    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
      };
    });

    let menuTags = Object.keys(tags);
    let _text = [
      defaultMenu.before,
      ...menuTags.map(tag => {
        return defaultMenu.header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
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
    const isGroup = m.chat.endsWith('@g.us');

    if (deviceType === 'ios') {
      const randomMenus = getRandomMenus(_p);
      const buttons = randomMenus.map(menu => ({
        buttonId: _p + menu.command,
        buttonText: { displayText: menu.title },
        type: 1
      }));

      await conn.sendMessage(m.chat, {
        image: { url: swag },
        caption: text.trim(),
        footer: "B L D - B O T  S Y S T E M",
        buttons: buttons,
        headerType: 4
      }, { quoted: m });

    } else {
      if (isGroup) {
        let thumbnailBuffer;
        try {
          const response = await fetch(swag);
          thumbnailBuffer = Buffer.from(await response.arrayBuffer());
        } catch {
          thumbnailBuffer = Buffer.alloc(0);
        }

        await conn.sendMessage(m.chat, {
          interactiveButtons: [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
              title: "💠 APRI MENU BLD",
              sections: [{
                title: "🛡️ SISTEMA OPERATIVO",
                rows: [
                  { id: _p + "attiva", title: "🛡️ SICUREZZA", description: "Protezione e Filtri" },
                  { id: _p + "menugiochi", title: "🎮 GIOCHI", description: "Livelli e XP" }
                ]
              }, {
                title: "📂 MODULI DISPONIBILI",
                rows: [
                  { id: _p + "menuia", title: "🤖 IA", description: "Intelligenza Artificiale" },
                  { id: _p + "menugruppo", title: "👥 GRUPPO", description: "Gestione Utenti" },
                  { id: _p + "menudownload", title: "📥 DOWNLOAD", description: "Media Downloader" },
                  { id: _p + "menustrumenti", title: "🛠️ STRUMENTI", description: "Tools di Sistema" },
                  { id: _p + "menupremium", title: "⭐ PREMIUM", description: "Accesso Gold" },
                  { id: _p + "menucreatore", title: "👨‍💻 OWNER", description: "Admin Panel" }
                ]
              }]
            })
          }],
          text: text.trim(),
          footer: "𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙",
          media: { image: thumbnailBuffer }
        }, { quoted: m });
      } else {
        const sections = [
          {
            title: "🛡️ SISTEMA",
            rows: [
              { title: "🛡️ SICUREZZA", rowId: _p + "attiva" },
              { title: "🎮 GIOCHI", rowId: _p + "menugiochi" }
            ]
          },
          {
            title: "📂 CATEGORIE BLD",
            rows: [
              { title: "🤖 IA", rowId: _p + "menuia" },
              { title: "👥 GRUPPO", rowId: _p + "menugruppo" },
              { title: "📥 DOWNLOAD", rowId: _p + "menudownload" },
              { title: "🛠️ STRUMENTI", rowId: _p + "menustrumenti" },
              { title: "⭐ PREMIUM", rowId: _p + "menupremium" },
              { title: "👨‍💻 OWNER", rowId: _p + "menucreatore" }
            ]
          }
        ];

        await conn.sendMessage(m.chat, {
          text: text.trim(),
          footer: "𝖇𝖑𝖔𝖔𝖉𝖇𝖔𝖙",
          buttonText: "💠 SELEZIONA",
          sections
        }, { quoted: m });
      }
    }

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, `❌ Errore BLD-SYS: ${e.message}`, m)
  }
};

handler.help = ['menu'];
handler.command = ['menu', 'help', 'comandi'];
export default handler;

function clockString(ms) {
  let h = Math.floor(ms / 3600000);
  let m = Math.floor(ms / 60000) % 60;
  let s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
