import PhoneNumber from 'awesome-phonenumber'

const calculateLevel = (exp) => {
    return Math.floor(Math.sqrt(exp / 100)) + 1
}

const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!global.db.data.users[m.sender]) {
        global.db.data.users[m.sender] = {}
    }

    let user = global.db.data.users[m.sender]
    if (!user.profile) {
        user.profile = {
            description: '',
            gender: '',
            instagram: '',
            city: '',
            birthday: '',
            hobby: '',
            status: '',
            occupation: '',
            music: '',
            food: '',
            movie: '',
            game: '',
            sport: '',
            language: ''
        }
    }

    let name = await conn.getName(m.sender)
    let pp = await conn.profilePictureUrl(m.sender, 'image').catch(_ => 'https://i.ibb.co/BKHtdBNp/default-avatar-profile-icon-1280x1280.jpg')
    let currentLevel = user.level || calculateLevel(user.exp || 0)
    let phone = PhoneNumber('+' + m.sender.split('@')[0]).getNumber('international')

    let type = command.toLowerCase()

    if (!text) {
        if (type === 'del') return

        const helpMessages = {
            setdesc: `ㅤㅤ⋆｡˚『 ╭ \`DESCRIZIONE\` ╯ 』˚｡⋆\n╭\n│  『 📝 』 \`Imposta la tua biografia\`\n│      *⤷* *Massimo 100 caratteri*\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setdesc miglior bot di zozzap*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setgenere: `ㅤㅤ⋆｡˚『 ╭ \`GENERE\` ╯ 』˚｡⋆\n╭\n│  『 ⚧️ 』 \`Definisci il tuo genere\`\n│\n│  『 📌 』 \`Opzioni disponibili:\`\n│      *⤷* *👨🏻 Uomo*\n│      *⤷* *👩🏻 Donna*\n│      *⤷* *🌟 Non specificato*\n│      *⤷* *✨ [Personalizzato]*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setig: `ㅤㅤ⋆｡˚『 ╭ \`INSTAGRAM\` ╯ 』˚｡⋆\n╭\n│  『 📸 』 \`Collega il tuo profilo\`\n│      *⤷* *Solo username*\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setig varebot*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setcitta: `ㅤㅤ⋆｡˚『 ╭ \`CITTÀ\` ╯ 』˚｡⋆\n╭\n│  『 🌆 』 \`La tua città\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setcitta faenza*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setcompleanno: `ㅤㅤ⋆｡˚『 ╭ \`COMPLEANNO\` ╯ 』˚｡⋆\n╭\n│  『 🎂 』 \`La tua data di nascita\`\n│      *⤷* *Formato: DD/MM/YYYY*\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setcompleanno 19/04/2008*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            sethobby: `ㅤㅤ⋆｡˚『 ╭ \`HOBBY\` ╯ 』˚｡⋆\n╭\n│  『 🎨 』 \`I tuoi interessi\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}sethobby Musica*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setstato: `ㅤㅤ⋆｡˚『 ╭ \`STATO\` ╯ 』˚｡⋆\n╭\n│  『 💝 』 \`Il tuo stato sentimentale\`\n│\n│  『 📌 』 \`Opzioni:\`\n│      *⤷* *Single*\n│      *⤷* *Fidanzato/a*\n│      *⤷* *Sposato/a*\n│      *⤷* *Divorziato*\n│      *⤷* *Complicato*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setlavoro: `ㅤㅤ⋆｡˚『 ╭ \`LAVORO\` ╯ 』˚｡⋆\n╭\n│  『 💼 』 \`La tua occupazione\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setlavoro studente*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setmusica: `ㅤㅤ⋆｡˚『 ╭ \`MUSICA\` ╯ 』˚｡⋆\n╭\n│  『 🎵 』 \`Il tuo genere musicale preferito\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setmusica Pop, Rock*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setcibo: `ㅤㅤ⋆｡˚『 ╭ \`CIBO\` ╯ 』˚｡⋆\n╭\n│  『 🍕 』 \`Il tuo piatto preferito\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setcibo Pizza Margherita*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setfilm: `ㅤㅤ⋆｡˚『 ╭ \`FILM\` ╯ 』˚｡⋆\n╭\n│  『 🎬 』 \`Il tuo film/serie preferito\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setfilm Avengers*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setgioco: `ㅤㅤ⋆｡˚『 ╭ \`GIOCO\` ╯ 』˚｡⋆\n╭\n│  『 🎮 』 \`Il tuo videogioco preferito\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setgioco Minecraft*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setsport: `ㅤㅤ⋆｡˚『 ╭ \`SPORT\` ╯ 』˚｡⋆\n╭\n│  『 🏃 』 \`Il tuo sport preferito\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setsport Calcio*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            setlingua: `ㅤㅤ⋆｡˚『 ╭ \`LINGUA\` ╯ 』˚｡⋆\n╭\n│  『 🌍 』 \`Le tue lingue parlate\`\n│\n│  『 💡 』 \`Esempio:\`\n│      *⤷* *${usedPrefix}setlingua Italiano, Inglese*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`
        }

        await conn.sendMessage(m.chat, {
            text: helpMessages[type] || '『 ❌ 』- \`Comando non valido\`',
            mentions: [m.sender],
            contextInfo: {
                ...(global.fake?.contextInfo || {}),
                externalAdReply: {
                    title: `⚙️ Configurazione Profilo`,
                    body: `${phone} • Livello ${currentLevel} • ${formatNumber(user.euro || 0)}€`,
                    thumbnailUrl: pp,
                    sourceUrl: '',
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    showAdAttribution: false
                }
            }
        }, { quoted: m })
        return
    }

    if (type === 'del') {
        const validFields = {
            'desc': 'description', 'bio': 'description', 'genere': 'gender',
            'ig': 'instagram', 'citta': 'city', 'compleanno': 'birthday',
            'hobby': 'hobby', 'stato': 'status', 'lavoro': 'occupation',
            'musica': 'music', 'cibo': 'food', 'film': 'movie',
            'gioco': 'game', 'sport': 'sport', 'lingua': 'language'
        }

        const fieldToDelete = text.toLowerCase()
        if (!validFields[fieldToDelete]) {
            await conn.sendMessage(m.chat, {
                text: `ㅤㅤ⋆｡˚『 ╭ \`ERRORE\` ╯ 』˚｡⋆\n╭\n│  『 ❌ 』 \`Campo non valido!\`\n│\n│  『 📌 』 \`Campi disponibili:\`\n│      *⤷* *${Object.keys(validFields).join(', ')}*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                mentions: [m.sender],
                contextInfo: {
                    ...(global.fake?.contextInfo || {}),
                    externalAdReply: {
                        title: `❌ Errore - Campo non valido`,
                        body: `${phone} • Livello ${currentLevel}`,
                        thumbnailUrl: pp,
                        sourceUrl: '',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m })
            return
        }

        const actualField = validFields[fieldToDelete]
        const oldValue = user.profile[actualField] || 'Vuoto'
        user.profile[actualField] = ''

        const fieldDisplayNames = {
            'description': '📝 Bio', 'gender': '⚧️ Genere', 'instagram': '📸 Instagram',
            'city': '🌆 Città', 'birthday': '🎂 Compleanno', 'hobby': '🎨 Hobby',
            'status': '💝 Stato', 'occupation': '💼 Lavoro', 'music': '🎵 Musica',
            'food': '🍕 Cibo', 'movie': '🎬 Film', 'game': '🎮 Gioco',
            'sport': '🏃 Sport', 'language': '🌍 Lingua'
        }

        const displayName = fieldDisplayNames[actualField] || '✨ Campo'

        await conn.sendMessage(m.chat, {
            text: `ㅤㅤ⋆｡˚『 ╭ \`CAMPO ELIMINATO\` ╯ 』˚｡⋆\n╭\n│  『 🗑️ 』 \`Campo rimosso con successo\`\n│\n│  『 ${displayName.split(' ')[0]} 』 \`${displayName.split(' ').slice(1).join(' ')}:\`\n│      *⤷* *Valore precedente: ${oldValue}*\n│      *⤷* *Nuovo valore: Vuoto*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
            mentions: [m.sender],
            contextInfo: {
                ...(global.fake?.contextInfo || {}),
                externalAdReply: {
                    title: `🗑️ Campo Eliminato - ${name}`,
                    body: `${phone} • Livello ${currentLevel} • ${displayName}`,
                    thumbnailUrl: pp,
                    sourceUrl: '',
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    showAdAttribution: false
                }
            }
        }, { quoted: m })

        await m.react('🗑️')
        return
    }

    switch (type) {
        case 'setdesc':
        case 'setbio':
            if (text.length > 100) {
                await conn.sendMessage(m.chat, {
                    text: `ㅤㅤ⋆｡˚『 ╭ \`ERRORE\` ╯ 』˚｡⋆\n╭\n│  『 ❌ 』 \`Testo troppo lungo!\`\n│      *⤷* *Massimo: 100 caratteri*\n│      *⤷* *Attuale: ${text.length} caratteri*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                    mentions: [m.sender],
                    contextInfo: {
                        ...(global.fake?.contextInfo || {}),
                        externalAdReply: {
                            title: `❌ Errore - Testo troppo lungo`,
                            body: `${phone} • ${text.length}/100 caratteri`,
                            thumbnailUrl: pp,
                            sourceUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m })
                return
            }
            user.profile.description = text
            break

        case 'setgenere':
            user.profile.gender = text
            break

        case 'setig':
            if (!text.match(/^[a-zA-Z0-9._]+$/)) {
                await conn.sendMessage(m.chat, {
                    text: `ㅤㅤ⋆｡˚『 ╭ \`ERRORE\` ╯ 』˚｡⋆\n╭\n│  『 ❌ 』 \`Username Instagram non valido\`\n│      *⤷* *Usa solo lettere, numeri, . e _*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                    mentions: [m.sender],
                    contextInfo: {
                        ...(global.fake?.contextInfo || {}),
                        externalAdReply: {
                            title: `❌ Username Instagram non valido`,
                            body: `${phone} • Livello ${currentLevel}`,
                            thumbnailUrl: pp,
                            sourceUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m })
                return
            }
            user.profile.instagram = text
            break

        case 'setcitta':
            user.profile.city = text
            break

        case 'setcompleanno':
            if (!text.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                await conn.sendMessage(m.chat, {
                    text: `ㅤㅤ⋆｡˚『 ╭ \`ERRORE\` ╯ 』˚｡⋆\n╭\n│  『 ❌ 』 _*Formato data non valido*_\n│      *⤷* \`Usa formato DD/MM/YYYY\`\n│      *⤷* \`Esempio: 19/04/2008\`\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                    mentions: [m.sender],
                    contextInfo: {
                        ...(global.fake?.contextInfo || {}),
                        externalAdReply: {
                            title: `❌ Formato data non valido`,
                            body: `${phone} • Usa DD/MM/YYYY`,
                            thumbnailUrl: pp,
                            sourceUrl: '',
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            showAdAttribution: false
                        }
                    }
                }, { quoted: m })
                return
            }
            user.profile.birthday = text
            break

        case 'sethobby': user.profile.hobby = text; break
        case 'setstato': user.profile.status = text; break
        case 'setlavoro': user.profile.occupation = text; break
        case 'setmusica': user.profile.music = text; break
        case 'setcibo': user.profile.food = text; break
        case 'setfilm': user.profile.movie = text; break
        case 'setgioco': user.profile.game = text; break
        case 'setsport': user.profile.sport = text; break
        case 'setlingua': user.profile.language = text; break

        default:
            await m.reply('『 ❌ 』- \`Comando non valido\`')
            return
    }

    global.db.data.users[m.sender] = user

    const fieldMap = {
        setdesc: ['description', '📝', 'Bio'],
        setbio: ['description', '📝', 'Bio'],
        setgenere: ['gender', '⚧️', 'Genere'],
        setig: ['instagram', '📸', 'Instagram'],
        setcitta: ['city', '🌆', 'Città'],
        setcompleanno: ['birthday', '🎂', 'Compleanno'],
        sethobby: ['hobby', '🎨', 'Hobby'],
        setstato: ['status', '💝', 'Stato'],
        setlavoro: ['occupation', '💼', 'Lavoro'],
        setmusica: ['music', '🎵', 'Musica'],
        setcibo: ['food', '🍕', 'Cibo'],
        setfilm: ['movie', '🎬', 'Film'],
        setgioco: ['game', '🎮', 'Gioco'],
        setsport: ['sport', '🏃', 'Sport'],
        setlingua: ['language', '🌍', 'Lingua']
    }

    let [field, emoji, label] = fieldMap[type] || ['description', '✨', 'Profilo']
    let newValue = user.profile[field]

    await conn.sendMessage(m.chat, {
        text: `ㅤㅤ⋆｡˚『 ╭ \`PROFILO AGGIORNATO\` ╯ 』˚｡⋆\n╭\n│  『 ✅ 』 _*salvato con successo*_\n│  『 ${emoji} 』 \`${label}:\`\n│      *⤷* *${newValue}*\n│\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
        mentions: [m.sender],
        contextInfo: {
            ...(global.fake?.contextInfo || {}),
            externalAdReply: {
                title: `✅ ${label} Aggiornato - ${name}`,
                body: `${phone} • Livello ${currentLevel} • ${formatNumber(user.euro || 0)}€`,
                thumbnailUrl: pp,
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m })

    await m.react('✅')
}

handler.tags = ['profilo']
handler.command = /^(set(desc|bio|genere|ig|citta|compleanno|hobby|stato|lavoro|musica|cibo|film|gioco|sport|lingua)|del)$/i
handler.register = true
export default handler
