const handler = async (m, { conn }) => {
  try {
    const risposta = "*Per svuotare gruppi ci pensa knor manda il link in privato o a me o a +39 392 642 7789*";

    await conn.sendMessage(
      m.chat,
      { text: risposta },
      { quoted: m }
    );

  } catch (e) {
    console.error('Errore trigger parole chiave:', e);
  }
};

// La regex ora include bot, nuke, nukk e svuotare
handler.customPrefix = /(^|\s)(nukke|nuke|nukk|svuotare)(\s|$)/i;
handler.command = new RegExp;

export default handler;
