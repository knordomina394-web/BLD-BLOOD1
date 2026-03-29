// Plugin Antinuke - Modificato per leggere la Whitelist Dinamica
// Collegato a gestione_antinuke.js

const handler = m => m;

handler.before = async function (m, { conn, participants, isBotAdmin }) {
  if (!m.isGroup) return;
  if (!isBotAdmin) return;

  const chat = global.db.data.chats[m.chat];
  if (!chat?.antinuke) return;

  // Monitora: Cambio nome (21), Rimozione (28), Promozione (29), Retrocessione (30)
  if (![21, 28, 29, 30].includes(m.messageStubType)) return;

  const sender = m.key?.participant || m.participant || m.sender;
  if (!sender) return;

  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
  const BOT_OWNERS = global.owner.map(o => o[0] + '@s.whatsapp.net');

  // --- LOGICA DI COLLEGAMENTO AL DATABASE ---
  // Estrae tutti i JID che hanno .whitelist === true nel database degli utenti
  const whitelistedUsers = Object.entries(global.db.data.users || {})
    .filter(([jid, user]) => user.whitelist === true)
    .map(([jid]) => jid);

  let founderJid = null;
  try {
    const metadata = await conn.groupMetadata(m.chat);
    founderJid = metadata.owner;
  } catch {
    founderJid = null;
  }

  // Unisce tutte le liste di chi è "intoccabile"
  const allowed = [
    botJid,
    ...BOT_OWNERS,
    ...whitelistedUsers, // <--- Qui legge quelli aggiunti con .addwhitelist
    founderJid
  ].filter(Boolean);

  // Fix per uscita volontaria
  if (m.messageStubType === 28) {
    const affected = m.messageStubParameters?.[0];
    if (affected === sender) return;
  }

  // Se chi ha fatto l'azione è in whitelist, ignora e chiudi
  if (allowed.includes(sender)) return;

  // Se arriviamo qui, l'azione è sospetta. Controlliamo se è un admin non autorizzato
  const senderData = participants.find(p => p.jid === sender);
  if (!senderData?.admin) return;

  // Identifica gli admin da retrocedere (tutti tranne gli autorizzati)
  const usersToDemote = participants
    .filter(p => p.admin)
    .map(p => p.jid)
    .filter(jid => jid && !allowed.includes(jid));

  // Esecuzione sanzioni (Retrocessione e Chiusura Gruppo)
  if (usersToDemote.length) {
    await conn.groupParticipantsUpdate(m.chat, usersToDemote, 'demote');
  }
  await conn.groupSettingUpdate(m.chat, 'announcement');

  const action =
    m.messageStubType === 21 ? 'cambio nome' :
    m.messageStubType === 28 ? 'rimozione membro' :
    m.messageStubType === 29 ? 'promozione admin' :
    'retrocessione admin';

  // Messaggio di allerta con lo stile richiesto
  const text = `
ㅤ⋆｡˚『 ╭ \`ANTINUKE ATTIVO\` ╯ 』˚｡⋆
╭
┃ 🚨 *Blocco Sicurezza Attivato*
┃ 👤 \`Autore:\` @${sender.split('@')[0]}
┃ 🚫 \`Azione:\` *${action}* NON autorizzata
┃
┃ 🔻 \`Sanzioni:\`
┃ ➤ *Admin rimossi a tappeto*
┃ ➤ *Gruppo chiuso (Sola lettura)*
┃
┃ 👑 \`Owner avvisati immediatamente.\`
╰⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒─ׄ─ׅ─ׄ─⭒`;

  await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      mentionedJid: [sender, ...usersToDemote, ...BOT_OWNERS].filter(Boolean),
    },
  });
};

export default handler;
