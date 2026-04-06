import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix: _p, command, args, isOwner, isAdmin }) => {
  const userName = m.pushName || 'Utente'
  
  global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
  global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {}
  let chat = global.db.data.chats[m.chat]
  let bot = global.db.data.settings[conn.user.jid]

  const dynamicContextInfo = {
    externalAdReply: {
      title: "🛡️ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘 🛡️",
      body: "ᴘʀᴏᴛᴏᴄᴏʟʟɪ ᴅɪ ᴅɪꜰᴇsᴀ ᴀᴛᴛɪᴠɪ",
      mediaType: 1,
      renderLargerThumbnail: true,
      thumbnailUrl: 'https://files.catbox.moe/u8o020.jpg',
      sourceUrl: 'https://whatsapp.com/channel/0029Vajp6GvK0NBoP7WlR81G'
    }
  }

  const securityFeatures = [
    { key: 'antispam', name: 'Antispam' },
    { key: 'antiBot', name: 'Antibot' },
    { key: 'antiLink', name: 'Antilink WA' },
    { key: 'antiLink2', name: 'Antilink Social' },
    { key: 'antinuke', name: 'Antinuke' },
    { key: 'antitrava', name: 'Antitrava' },
    { key: 'antiviewonce', name: 'Antiviewonce' },
    { key: 'antiporn', name: 'Antiporno' },
    { key: 'detect', name: 'Detect' },
    { key: 'welcome', name: 'Welcome' }
  ]

  const ownerFeatures = [
    { key: 'antiprivato', name: 'Antiprivato' },
    { key: 'anticall', name: 'Antichiamate' },
    { key: 'soloCreatore', name: 'Solocreatore' }
  ]

  // SE NON CI SONO ARGOMENTI: Manda la grafica completa
  if (!args.length) {
    let text = `
┎━━━━━━━━━━━━━━━━━━━┑
┃   ✧  𝐁𝐋𝐃 - 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘  ✧   ┃
┖━━━━━━━━━━━━━━━━━━━┙
┌───────────────────┐
  👤 𝚄𝚜𝚎𝚛: ${userName}
  🛡️ 𝚂𝚝𝚊𝚝𝚞𝚜: 𝙰𝚌𝚝𝚒𝚟𝚎
  🔒 𝙼𝚘𝚍𝚞𝚕𝚎𝚜: ${securityFeatures.length + (isOwner ? ownerFeatures.length : 0)}
└───────────────────┘

*〘 ɪɴstruᴢɪᴏɴɪ ᴏᴘᴇʀᴀᴛɪᴠᴇ 〙*
> Usa i seguenti comandi per configurare il sistema:
*│ ➤* ${_p}*attiva* <funzione>
*│ ➤* ${_p}*disattiva* <funzione>

*┍━━━〔 ɢʀᴏᴜᴘ ᴅᴇꜰᴇɴsᴇ 〕━━━┑*
${securityFeatures.map(f => `┇ 🛡️  *${f.key}*`).join('\n')}
*┕━━━━━──ׄ──ׅ──ׄ──━━━━━┙*
`
    if (isOwner) {
      text += `
*┍━━━〔 ᴏᴡɴᴇʀ ᴄᴏɴᴛʀᴏʟ 〕━━━┑*
${ownerFeatures.map(f => `┇ 👑  *${f.key}*`).join('\n')}
*┕━━━━━──ׄ──ׅ──ׄ──━━━━━┙*
`
    }

    text += `\n_ʙʟᴅ-ʙᴏᴛ sᴇᴄᴜʀɪᴛʏ ɪɴᴛᴇʀꜰᴀᴄᴇ_`

    await conn.sendMessage(m.chat, { 
      text: text.trim(), 
      contextInfo: dynamicContextInfo 
    }, { quoted: m })
    return
  }

  // LOGICA DI ATTIVAZIONE
  let isEnable = !/disattiva|off|0/i.test(command)
  let type = args[0].toLowerCase()
  let status = ''

  if (securityFeatures.some(f => f.key === type) || type === 'detect' || type === 'welcome') {
    if (!m.isGroup && !isOwner) return m.reply('❌ Solo nei gruppi')
    if (m.isGroup && !isAdmin && !isOwner) return m.reply('🛡️ Solo per Admin')
    
    let key = type === 'detect' ? 'rileva' : type
    chat[key] = isEnable
    status = isEnable ? 'ATTIVATO ✅' : 'DISATTIVATO ❌'
  } else if (ownerFeatures.some(f => f.key === type)) {
    if (!isOwner) return m.reply('👑 Solo Owner')
    bot[type] = isEnable
    status = isEnable ? 'ATTIVATO ✅' : 'DISATTIVATO ❌'
  } else {
    return m.reply('❓ Funzione non trovata.')
  }

  await m.react(isEnable ? '✅' : '❌')
  m.reply(`『 🛡️ 』 *SISTEMA AGGIORNATO*\n\nModulo: *${type.toUpperCase()}*\nStato: *${status}*`)
}

handler.help = ['attiva', 'disattiva']
handler.tags = ['sicurezza']
handler.command = ['attiva', 'disattiva', 'on', 'off', 'enable', 'disable']

export default handler
