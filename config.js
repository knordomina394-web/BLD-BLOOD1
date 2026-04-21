import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const moduleCache = new NodeCache({ stdTTL: 300 });

/*⭑⭒━━━✦❘༻☾⋆⁺₊✧ 𝓴𝓷𝓸𝓻𝓫𝓸𝓽✧₊⁺⋆☽༺❘✦━━━⭒⭑*/

global.sam = ['393926427789',]
global.owner = ['393926427789',]
  ['393804625661', 'knor', true],
  ['393926427789', 'luigi', true],
  ['', '', true],
  ['xxxxxxxxxx' true], 
  ['xxxxxxxxxxxxx']
]
global.mods = ['xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx']
global.prems = ['xxxxxxxxxxx', 'xxxxxxxxxxx', 'xxxxxxxxxxx']

/*⭑⭒━━━✦❘༻🩸 INFO BOT 🕊️༺❘✦━━━⭒⭑*/

global.nomepack = '𝓴𝓷𝓸𝓻𝓫𝓸𝓽'
global.nomebot = '𝓴𝓷𝓸𝓻𝓫𝓸𝓽'
global.wm = '𝓴𝓷𝓸𝓻𝓫𝓸𝓽'
global.autore = '𝓴𝓷𝓸𝓻𝓫𝓸𝓽'
global.dev = '𝓴𝓷𝓸𝓻𝓫𝓸𝓽'
global.testobot = `𝓴𝓷𝓸𝓻𝓫𝓸𝓽`
global.versione = pkg.version
global.errore = '*ERRORE INATTESO*, UTILIZZA IL COMANDO .segnala (errore) per contattare lo sviluppatore. contatto diretto:+39 370 133 0693'

/*⭑⭒━━━✦❘༻🌐 LINK 🌐༺❘✦━━━⭒⭑*/

global.repobot ='https//wa.me/3926427789'
global.gruppo = 'https://chat.whatsapp.com/EPY9EqMNV6XD0PmVk8jbEb?mode=gi_t'
global.insta = 'https://www.instagram.com/knor9690?igsh=dmI1aHQ2eXd5aW9k'
/*⭑⭒━━━✦❘༻ MODULI ༺❘✦━━━⭒⭑*/

global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment

/*⭑⭒━━━✦❘🗝️ API KEYS 🌍༺❘✦━━━⭒⭑*/

global.APIKeys = { // le keys con scritto "varebot" vanno cambiate con keys valide
    spotifyclientid: 'varebot',
    spotifysecret: 'varebot',
    browserless: 'varebot',
    screenshotone: 'varebot',
    screenshotone_default: 'varebot',
    tmdb: 'varebot',
    gemini:'varebot',
    ocrspace: 'varebot',
    assemblyai: 'varebot',
    google: 'varebot',
    googlex: 'varebot',
    googleCX: 'varebot',
    genius: 'varebot',
    unsplash: 'varebot',
    removebg: 'FEx4CYmYN1QRQWD1mbZp87jV',
    openrouter: 'varebot',
    lastfm: '36f859a1fc4121e7f0e931806507d5f9',
}

/*⭑⭒━━━✦❘༻🪷 SISTEMA XP/EURO 💸༺❘✦━━━⭒⭑*/

global.multiplier = 1 // piu è alto piu è facile guardagnare euro e xp

/*⭑⭒━━━✦❘༻📦 RELOAD 📦༺❘✦━━━⭒⭑*/

let filePath = fileURLToPath(import.meta.url)
let fileUrl = pathToFileURL(filePath).href
const reloadConfig = async () => {
  const cached = moduleCache.get(fileUrl);
  if (cached) return cached;
  unwatchFile(filePath)
  console.log(chalk.bgHex('#3b0d95')(chalk.white.bold("File: 'config.js' Aggiornato")))
  const module = await import(`${fileUrl}?update=${Date.now()}`)
  moduleCache.set(fileUrl, module, { ttl: 300 });
  return module;
}
watchFile(filePath, reloadConfig)
