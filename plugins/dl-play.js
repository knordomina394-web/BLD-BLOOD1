import yts from "yt-search";
import { exec } from "child_process";
import fs from "fs";

const ytmp3 = (url) => {
  return new Promise((resolve, reject) => {
    const file = `./tmp/${Date.now()}.mp3`;
    exec(
      `yt-dlp -x --audio-format mp3 -o "${file}" ${url}`,
      (err) => {
        if (err) reject(err);
        else resolve(file);
      }
    );
  });
};

const ytmp4 = (url) => {
  return new Promise((resolve, reject) => {
    const file = `./tmp/${Date.now()}.mp4`;
    exec(
      `yt-dlp -f mp4 -o "${file}" ${url}`,
      (err) => {
        if (err) reject(err);
        else resolve(file);
      }
    );
  });
};

const handler = async (m, { conn, text, command }) => {
  try {
    if (!text?.trim()) return conn.reply(m.chat, `*Inserisci il nome della song*.`, m);

    const search = await yts(text);
    if (!search.all.length) return conn.reply(m.chat, '*Non ho trovato un cazzo che musica di merda ascolti*.', m);

    const videoInfo = search.all[0];
    const { title, url } = videoInfo;

    if (command === 'play1') {
      await conn.reply(m.chat, '*Sto sistemando il tuo audio aspetta* `, m);
      const audio = await ytmp3(url);
      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audio),
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m }
      );
      fs.unlinkSync(audio);

    } else if (command === 'play2' || command === 'ytmp4') {
      await conn.reply(m.chat, `*Download in corso dammi un secondo*`, m);
      const video = await ytmp4(url);

      const buttons = [
        { buttonId: `.tomp3 ${text}`, buttonText: { displayText: '*Converti in audio*' }, type: 1 }
      ];

      await conn.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(video),
          mimetype: "video/mp4",
          fileName: `${title}.mp4`,
          caption: '*Scaricato ora puoi ascoltare la tua Song*',
          buttons: buttons,
          headerType: 4
        },
        { quoted: m }
      );
      fs.unlinkSync(video);

    } else {
      throw "*Comando non riconosciuto".";
    }

  } catch (error) {
    return conn.reply(m.chat, `❗ *Errore*: ${error.message}`, m);
  }
};

handler.command = handler.help = ['play1', 'ytmp4', 'play2'];
handler.tags = ['downloader'];

export default handler