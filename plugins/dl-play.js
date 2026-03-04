import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import ytSearch from 'yt-search'

const execPromise = promisify(exec)
const vic = new Map()
const CACHE_TTL = 15 * 60 * 1000
const gonnabealongyr = 20 * 60 // 20 minuti
const tmpDir = path.join(process.cwd(), 'temp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

// Formati migliorati per stabilità
const A_FORMATS = ['bestaudio[ext=m4a]/bestaudio', 'bestaudio', '140', '251']
const V_FORMATS = ['bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]/best']

async function runYtDlp(args) {
    const commands = ['yt-dlp', 'yt-dlp.exe', 'python3 -m yt_dlp', 'python -m yt_dlp']
    for (const cmd of commands) {
        try {
            const { stdout } = await execPromise(`${cmd} ${args.join(' ')}`, { maxBuffer: 50 * 1024 * 1024 })
            return stdout
        } catch (e) { continue }
    }
    throw new Error('YT_DLP_NOT_FOUND')
}

let handler = async (m, { conn, command, text, usedPrefix }) => {
    if (!text) {
        return conn.reply(m.chat, `*╭─ׄ✦☾⋆⁺₊✧ Bloodbot ✧₊⁺⋆☽✦─ׅ⭒*\n*├* ⁉️ _Uso:_ \`${usedPrefix + command} <nome/url>\`\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`, m)
    }

    await conn.sendPresenceUpdate('composing', m.chat)

    try {
        const search = await ytSearch(text)
        const video = search.videos[0]
        if (!video) throw '❌ Risultato non trovato'

        if (video.seconds > gonnabealongyr) throw `⏱️ Il video è troppo lungo! Max 20 min (attuale: ${video.timestamp})`

        // SE L'UTENTE SCRIVE SOLO .PLAY -> MOSTRO I BOTTONI
        if (command === 'play') {
            const sections = [
                {
                    title: "Scegli il formato",
                    rows: [
                        { title: "🎵 Audio (MP3)", rowId: `${usedPrefix}playaudio ${video.url}`, description: "Scarica in alta qualità audio" },
                        { title: "🎥 Video (MP4)", rowId: `${usedPrefix}playvideo ${video.url}`, description: "Scarica in 720p/480p" }
                    ]
                }
            ]

            const listMessage = {
                text: `*╭─ׄ✦☾⋆⁺₊✧ Bloodbot ✧₊⁺⋆☽✦─ׅ⭒*\n*├* 📝 *Titolo:* ${video.title}\n*├* ⏱️ *Durata:* ${video.timestamp}\n*├* 👤 *Canale:* ${video.author.name}\n*╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─*`,
                footer: "Seleziona un'opzione qui sotto",
                title: "Download Disponibile",
                buttonText: "Scarica Ora 📥",
                sections
            }

            // Fallback se le liste non funzionano sul tuo bot (usa bottoni semplici)
            try {
                return await conn.sendMessage(m.chat, listMessage, { quoted: m })
            } catch (e) {
                // Se il tuo bot non supporta le liste (es. versioni vecchie), mandiamo testo + info
                return conn.reply(m.chat, `*Risultato:* ${video.title}\n\nUsa:\n${usedPrefix}playaudio ${video.url}\n${usedPrefix}playvideo ${video.url}`, m)
            }
        }

        // SE IL COMANDO È SPECIFICO (playaudio/playvideo) -> SCARICO DIRETTAMENTE
        await conn.reply(m.chat, `⏳ _Download in corso... attendi_`, m)
        await downloadMedia(m, conn, command, video.url, video)

    } catch (e) {
        conn.reply(m.chat, `⚠️ *Errore:* ${e}`, m)
    }
}

async function downloadMedia(m, conn, command, url, video) {
    const isVideo = command === 'playvideo'
    const ext = isVideo ? 'mp4' : 'mp3'
    const fileName = path.join(tmpDir, `${Date.now()}.${ext}`)
    const formats = isVideo ? V_FORMATS : A_FORMATS

    let success = false
    for (const f of formats) {
        try {
            const args = [
                `"${url}"`,
                `-f "${f}"`,
                `-o "${fileName}"`,
                '--no-playlist',
                isVideo ? '--merge-output-format mp4' : '-x --audio-format mp3 --audio-quality 0'
            ]
            
            await runYtDlp(args)
            
            if (fs.existsSync(fileName)) {
                const stats = fs.statSync(fileName)
                if (stats.size > 5000) { // Check se il file non è corrotto (min 5KB)
                    const buffer = fs.readFileSync(fileName)
                    
                    if (isVideo) {
                        await conn.sendMessage(m.chat, { video: buffer, caption: `✅ *${video.title}*\n> \`Bloodbot\``, mimetype: 'video/mp4' }, { quoted: m })
                    } else {
                        await conn.sendMessage(m.chat, { 
                            audio: buffer, 
                            mimetype: 'audio/mpeg', 
                            fileName: `${video.title}.mp3`,
                            contextInfo: {
                                externalAdReply: {
                                    title: video.title,
                                    body: video.author.name,
                                    thumbnailUrl: video.thumbnail,
                                    sourceUrl: url,
                                    mediaType: 1,
                                    showAdAttribution: true
                                }
                            }
                        }, { quoted: m })
                    }
                    success = true
                    break
                }
            }
        } catch (e) {
            console.error(`Format fail: ${f}`, e.message)
            continue
        } finally {
            if (fs.existsSync(fileName)) fs.unlinkSync(fileName)
        }
    }

    if (!success) throw "Impossibile scaricare il media. Riprova più tardi."
}

handler.command = ['play', 'playaudio', 'playvideo']
export default handler
