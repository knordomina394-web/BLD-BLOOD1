import axios from 'axios'
import ytSearch from 'yt-search'

let handler = async (m, { conn, command, text, usedPrefix }) => {
    if (!text) return m.reply(`*╭─ׄ✦☾⋆⁺₊✧ Bloodbot ✧₊⁺⋆☽✦─ׅ⭒*\n*├* ⁉️ _Uso:_ \`${usedPrefix + command} <nome/url>\`\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`)

    try {
        // 1. RICERCA
        const search = await ytSearch(text)
        const video = search.videos[0]
        if (!video) return m.reply('❌ Nessun risultato trovato.')

        // 2. MENU CON I BOTTONI CHE FUNZIONAVANO (.play)
        if (command === 'play') {
            const buttons = [
                {
                    buttonId: `${usedPrefix}playaudio ${video.url}`,
                    buttonText: { displayText: '🎵 AUDIO (MP3)' },
                    type: 1
                },
                {
                    buttonId: `${usedPrefix}playvideo ${video.url}`,
                    buttonText: { displayText: '🎥 VIDEO (MP4)' },
                    type: 1
                }
            ]

            const buttonMessage = {
                image: { url: video.thumbnail },
                caption: `*╭─ׄ✦☾⋆⁺₊✧ Bloodbot ✧₊⁺⋆☽✦─ׅ⭒*\n*├* 📝 *Titolo:* ${video.title}\n*├* ⏱️ *Durata:* ${video.timestamp}\n*├* 👤 *Canale:* ${video.author.name}\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                footer: 'Scegli il formato qui sotto',
                buttons: buttons,
                headerType: 4
            }

            return await conn.sendMessage(m.chat, buttonMessage, { quoted: m })
        }

        // 3. ESECUZIONE DOWNLOAD (.playaudio o .playvideo)
        await m.reply('⏳ _Download in corso... sto aggirando i blocchi di YouTube._')

        const isVideo = command === 'playvideo'
        let downloadUrl = null

        // TENTATIVO CON API DI BYPASS (Per evitare il blocco IP del server)
        try {
            // Proviamo la prima API (Vreden)
            const res = await axios.get(`https://api.vreden.my.id/api/yt${isVideo ? 'mp4' : 'mp3'}?url=${video.url}`)
            downloadUrl = res.data.result.download
        } catch (e) {
            // Fallback su seconda API (Lolhuman)
            try {
                const res2 = await axios.get(`https://api.lolhuman.xyz/api/yt${isVideo ? 'video' : 'audio'}?apikey=GataDios&url=${video.url}`)
                downloadUrl = isVideo ? res2.data.result.video : res2.data.result.audio
            } catch (e2) {
                throw new Error("Tutte le API di download sono al momento occupate. Riprova tra poco.")
            }
        }

        if (!downloadUrl) throw new Error("Impossibile ottenere il link di download.")

        // 4. INVIO FILE FINALE
        if (isVideo) {
            await conn.sendMessage(m.chat, { 
                video: { url: downloadUrl }, 
                caption: `✅ *${video.title}*\n> \`Bloodbot\``,
                mimetype: 'video/mp4' 
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, { 
                audio: { url: downloadUrl }, 
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${video.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: 'Audio Download - Bloodbot',
                        thumbnailUrl: video.thumbnail,
                        sourceUrl: video.url,
                        mediaType: 1,
                        showAdAttribution: true
                    }
                }
            }, { quoted: m })
        }

    } catch (e) {
        console.error('ERRORE:', e)
        m.reply(`❌ *ERRORE DI SISTEMA*\n\nYouTube sta bloccando le richieste dal server.\n\n_Dettaglio:_ ${e.message}`)
    }
}

handler.command = ['play', 'playaudio', 'playvideo']
handler.help = ['play <titolo>', 'playaudio <url>', 'playvideo <url>']
handler.tags = ['download']

export default handler
