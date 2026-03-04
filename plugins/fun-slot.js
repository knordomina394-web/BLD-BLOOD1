// --- DENTRO IL GESTORE DEL MENU CASINO ---
if (command === 'casino') {
    let intro = `*🎰 BENVENUTO NEL CASINÒ 🎰*`
    const buttons = [
        { buttonId: `.infoslot`, buttonText: { displayText: '🎰 SLOT MACHINE' }, type: 1 }, // Cambiato in .infoslot
        { buttonId: `.infobj`, buttonText: { displayText: '🃏 BLACKJACK' }, type: 1 },
        { buttonId: `.infocorsa`, buttonText: { displayText: '🏇 CORSA CAVALLI' }, type: 1 }
    ]
    return conn.sendMessage(m.chat, { text: intro, buttons }, { quoted: m })
}

// --- LOGICA INFO SLOT ---
if (command === 'infoslot') {
    let desc = `*🎰 SLOT MACHINE*\n\n*Punta 100 fiches e tenta la fortuna!*`
    const buttons = [{ buttonId: `.slot`, buttonText: { displayText: '🎰 GIOCA ORA' }, type: 1 }]
    return conn.sendMessage(m.chat, { text: desc, buttons }, { quoted: m })
}

// --- LOGICA SLOT EFFETTIVA ---
if (command === 'slot') {
    // ... (qui va il codice della slot che ti ho dato prima)
}

// --- QUESTO È IL PEZZO PIÙ IMPORTANTE (A fondo file) ---
// Controlla che 'infoslot' e 'slot' siano presenti qui!
handler.command = /^(casino|infoslot|slot|infobj|blakjak|blackjack|infocorsa|puntacorsa|infotoc|puntatoc|infodadi|dadi|daily|inforigore|rigore|inforoulette|playroulette|infogratta|gratta)$/i
handler.group = true
export default handler
