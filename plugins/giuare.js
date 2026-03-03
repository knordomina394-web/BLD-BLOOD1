// Database globale persistente per la sessione
globalThis.sessioneGiullare = globalThis.sessioneGiullare || {};

let handler = async (m, { conn, command, participants }) => {
    let chat = m.chat;

    if (command === 'giullare') {
        if (globalThis.sessioneGiullare[chat]) {
            return m.reply(`⚠️ C'è già un povero diavolo sotto tortura. Aspetta che finisca.`);
        }

        let vittima;
        if (m.mentionedJid && m.mentionedJid[0]) {
            vittima = m.mentionedJid[0];
        } else {
            let members = participants.map(u => u.id).filter(v => v !== conn.user.jid);
            vittima = members[Math.floor(Math.random() * members.length)];
        }

        let nomeVittima = `@${vittima.split('@')[0]}`;
        globalThis.sessioneGiullare[chat] = vittima;

        let inizioMsg = `🚨 *PROTOCOLLO UMILIAZIONE ATTIVATO* 🚨\n`;
        inizioMsg += `──────────────────\n`;
        inizioMsg += `Bersaglio: ${nomeVittima}\n\n`;
        inizioMsg += `Ogni tua parola sarà punita all'istante. Hai 3 minuti di inferno totale. 🤡💀`;

        await conn.sendMessage(chat, { text: inizioMsg, mentions: [vittima] });

        // Timer di 3 minuti
        setTimeout(async () => {
            if (globalThis.sessioneGiullare[chat]) {
                delete globalThis.sessioneGiullare[chat];
                await conn.sendMessage(chat, { text: `🎭 Il tempo è scaduto per ${nomeVittima}. Puoi tornare a strisciare nella tua insignificanza.` });
            }
        }, 180000);
    }
};

handler.before = async function (m, { conn }) {
    if (!m.chat || !m.sender || m.isBaileys) return;
    
    let chat = m.chat;
    let giullareAttivo = globalThis.sessioneGiullare[chat];

    if (giullareAttivo && m.sender === giullareAttivo) {
        // Reazione immediata
        await conn.sendMessage(chat, { react: { text: "🤡", key: m.key } });

        const cattiverie = [
            `Zitto, sacco di bava. 🤮`,
            `Ancora parli? Nessuno vuole sentire il tuo rumore.`,
            `Sei la prova che il preservativo era necessario. 🤡`,
            `Il tuo quoziente intellettivo è un errore di sistema. 💀`,
            `Taci, rifiuto umano. Ogni tua parola puzza.`,
            `Ma non ti stanchi di essere così patetico?`,
            `Qualcuno tiri lo sciacquone, il giullare ha riaperto bocca. 🚽`,
            `Sei più inutile di un semaforo nel deserto.`,
            `Tua madre si vergogna di te, e noi pure. 💩`,
            `Non scrivermi più, mi sporchi il database.`,
            `Sei lo zimbello del gruppo. Ridiamo tutti di te.`,
            `Spero che il tuo telefono esploda ora. 💣`,
            `Sei un vuoto a perdere biologico.`,
            `Hai la faccia di uno che mangia i sassi. 🪨`,
            `Zitto e mangia la merda che ti tiriamo addosso.`,
            `Sei un concentrato di mediocrità. Sparisci.`,
            `Ma non ti senti un coglione a farti insultare da un bot?`,
            `Hai la profondità mentale di un piattino da caffè.`,
            `Sei l'unico che ha deluso persino un computer.`,
            `Stai zitto, aborto mancato. 🤮`,
            `Tuo padre è andato a prendere le sigarette e ha fatto bene.`,
            `Sei più fastidioso della sabbia nelle mutande.`,
            `Ogni tua parola è un insulto all'evoluzione.`,
            `Sei un errore genetico senza rimedio.`,
            `La tua faccia è la ragione per cui gli alieni non ci visitano.`,
            `Sei utile quanto un ombrello bucato sotto un uragano.`,
            `Cercati un hobby, tipo contare i peli del sedere, ma taci.`,
            `Sei così sfigato che se cadesse un premio dal cielo ti colpirebbe in testa.`,
            `La tua intelligenza è in modalità aereo da quando sei nato.`,
            `Ma chi ti caga? Vai a giocare sull'autostrada.`,
            `Sei così brutto che il tuo specchio ha chiesto il divorzio.`,
            `Ma perché non vai a vendere il ghiaccio al Polo Nord?`,
            `Sei una macchia di unto sulla camicia della società.`,
            `Taci, ammasso informe di molecole sprecate.`,
            `Sei così noioso che persino l'insonnia guarirebbe guardandoti.`,
            `La tua vita è un bug che non vale la pena fixare.`,
            `Hai il carisma di una melanzana ammuffita.`,
            `Sei la personificazione del 'vabbè, fa niente'.`,
            `Il tuo albero genealogico è un cerchio perfetto. 🎡`,
            `Sei così insignificante che la tua ombra si vergogna di seguirti.`,
            `Spero che il tuo caricabatterie si rompa per sempre.`,
            `Sei un fallimento certificato ISO 9001.`,
            `La tua esistenza è uno spreco di ossigeno utile ad altri.`,
            `Sei così stupido che cerchi di scorrere le foto sui libri di carta.`,
            `Taci, sacco di bava e fallimento.`,
            `Hai la grazia di un elefante in una cristalleria.`,
            `Sei la prova che Dio ha un senso dell'umorismo crudele.`,
            `Sei così inutile che persino la solitudine ti rifiuta.`,
            `Vai a fare un bagno nell'acido, magari ti pulisci l'anima.`,
            `Sei un prototipo venuto male, riprova nel prossimo secolo. 🤮`
        ];

        let insulto = cattiverie[Math.floor(Math.random() * cattiverie.length)];
        await conn.sendMessage(chat, { text: insulto }, { quoted: m });
    }
    return true;
};

handler.help = ['giullare'];
handler.tags = ['giochi'];
handler.command = /^(giullare)$/i;
handler.group = true;

export default handler;
