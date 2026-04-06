import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  const userName = m.pushName || 'Utente';
  
  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {};
  global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {};
  let chat = global.db.data.chats[m.chat];
  let bot = global.db.data.settings[conn.user.jid];

  const dynamicContextInfo = {
    externalAdReply: {
      title: "🛡️ 𝕭𝕷𝕺𝕺𝕯𝕭𝕺𝕿 𝕾𝕰𝕮𝖀𝕽𝕴𝕿𝖄",
      body: "🛡️ Protocolli di Difesa Attivi",
      mediaType: 1,
      thumbnailUrl: 'https://files.catbox.moe/u8o020.jpg',
      sourceUrl: 'https://whatsapp.com/channel/0029Vajp6GvK0NBoP7WlR81G'
    }
  };

  const securityFeatures = [
    { key: 'antispam', name: '🛑 Antispam' },
    { key: 'antiBot', name: '🤖 Antibot' },
    { key: 'antiLink', name: '🔗 Antilink WA' },
    { key: 'antiLink2', name: '🌐 Antilink Social' },
    { key: 'antinuke', name: '☢️ Antinuke' },
    { key: 'antitrava', name: '🛡️ Antitrava' },
    { key: 'antiviewonce', name: '👁️ Antiviewonce' },
    { key: 'antiporn', name: '🔞 Antiporno' },
    { key: 'detect', name: '📡 Detect' },
    { key: 'welcome', name: '👋 Welcome' }
  ];

  const ownerFeatures = [
    { key: 'antiprivato', name: '🔒 Antiprivato' },
    { key: 'anticall', name: '❌📞 Antichiamate' },
    { key: 'soloCreatore', name: '👑 Solocreatore' }
  ];

  // SE NON CI SONO ARGOMENTI: Manda l'introduzione e la lista testuale
  if (!args.length) {
    let intro = `╭⭒─ׄ─⊱ *𝐌𝐄𝐍𝐔 𝐒𝐈𝐂𝐔𝐑𝐄𝐙𝐙𝐀* ⊰
✦ 👤 *User:* ${userName}
✧ 🛡️ *Stato:* Sistema Protetto
✦ 🔒 *Moduli:* ${securityFeatures.length + (isOwner ? ownerFeatures.length : 0)}
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒\n\n`

    let listText = `*LISTA COMANDI DISPONIBILI:*\n`
    securityFeatures.forEach(f => {
      listText += `*│ ➤* 『🛡️』 ${usedPrefix}attiva ${f.key}\n`
    })

    if (isOwner) {
      listText += `\n*CONTROLLO PROPRIETARIO:*\n`
      ownerFeatures.forEach(f => {
        listText += `*│ ➤* 『👑』 ${usedPrefix}attiva ${f.key}\n`
      })
    }

    listText += `\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒*\n> _Seleziona un comando sopra o usa il tasto "IMPOSTAZIONI" qui sotto._`

    let sections = [
      {
        title: "🛡️ MODULI GRUPPO",
        rows: securityFeatures.map(f => ({
          title: f.name,
          id: `${usedPrefix}attiva ${f.key}`
        }))
      }
    ];

    if (isOwner) {
      sections.push({
        title: "👑 MODULI PROPRIETARIO",
        rows: ownerFeatures.map(f => ({
          title: f.name,
          id: `${usedPrefix}attiva ${f.key}`
        }))
      });
    }

    await conn.sendList(
        m.chat, 
        "", 
        intro + listText, 
        "⚙️ IMPOSTAZIONI", 
        null, 
        sections, 
        m,
        { contextInfo: dynamicContextInfo }
    );
    return;
  }

  // --- LOGICA ATTIVA/DISATTIVA (rimane uguale per funzionare) ---
  let isEnable = !/disattiva|off|0/i.test(command);
  let type = args[0].toLowerCase();
  let status = '';

  if (securityFeatures.some(f => f.key === type) || type === 'detect' || type === 'welcome') {
    if (!m.isGroup && !isOwner) return m.reply('❌ Solo nei gruppi');
    if (m.isGroup && !isAdmin && !isOwner) return m.reply('🛡️ Solo per Admin');
    
    let key = type === 'detect' ? 'rileva' : type;
    chat[key] = isEnable;
    status = isEnable ? 'ATTIVATO ✅' : 'DISATTIVATO ❌';
  } else if (ownerFeatures.some(f => f.key === type)) {
    if (!isOwner) return m.reply('👑 Solo Owner');
    bot[type] = isEnable;
    status = isEnable ? 'ATTIVATO ✅' : 'DISATTIVATO ❌';
  } else {
    return m.reply('❓ Funzione non trovata.');
  }

  m.reply(`『 🛡️ 』 *SISTEMA AGGIORNATO*\n\nModulo: *${type.toUpperCase()}*\nStato: *${status}*`);
};

handler.help = ['attiva', 'disattiva'];
handler.tags = ['sicurezza'];
handler.command = ['attiva', 'disattiva', 'on', 'off', 'enable', 'disable'];

export default handler;
