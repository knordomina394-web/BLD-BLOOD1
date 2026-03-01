// Plugin fatto da Deadly (trigger "ti amo" nelle frasi)

const handler = async (m, { conn }) => {
  try {
    const risposta = "*cazzo metti il mio nome in una frase emerito essere inutile*";

    await conn.sendMessage(
      m.chat,
      { text: risposta },
      { quoted: m }
    );

  } catch (e) {
    console.error('Errore trigger ti amo:', e);
  }
};

// 🔥 Rileva "ti amo" anche dentro una frase
handler.customPrefix = /(^|\s)bot(\s|$)/i;
handler.command = new RegExp;

export default handler;