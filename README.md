<div align="center">

# 🎬 AWPN Custom Player

[![Installa AWPN](https://img.shields.io/badge/Installa-AWPN-0078D7?style=flat-square&logo=git)](https://raw.githubusercontent.com/Vincy02/AnimeWorldPlayerNew/main/animeworld-player.user.js)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Ready-green?style=flat-square&logo=tampermonkey)](https://www.tampermonkey.net/)

**AWPN** (AnimeWorld Player New) è un userscript per Tampermonkey (o similari, es. Greasemonkey) che migliora il player nativo di AnimeWorld, sostituendolo con una nuova interfaccia **elegante, fluida e con funzionalità aggiuntive in stile YouTube**.

</div>

<br>

## Funzionalità

- **Design Moderno (YouTube-like)**: Interfaccia utente ridisegnata con barra di avanzamento dinamica e animazioni fluide a centro schermo (Play/Pausa, Seek, Volume).
- **Auto-Resume Intelligente**: Chiudi la pagina senza preoccupazioni. Al tuo ritorno, il player ti chiederà se desideri riprendere la visione dall'esatto secondo in cui ti eri fermato.
- **Comandi da Tastiera**: Gestisci l'intera riproduzione senza mai toccare il mouse tramite un set completo di scorciatoie (vedi tabella in basso).
- **Auto-Next Integrato**: Avanzamento automatico al prossimo episodio, con un comodo conto alla rovescia annullabile.
- **Memoria Persistente**: Le tue preferenze su velocità di riproduzione, volume e stato muto vengono salvate e mantenute tra un episodio e l'altro.
- **Protezione Anti-Sovrapposizione**: Blocco contro l'interferenza degli script del sito originale, per un'esperienza fluida senza controlli doppi o popup.

## Privacy & Sicurezza

- **100% Privato**: Tutti i dati (salvataggi del tempo, velocità, impostazioni del player) sono salvati **esclusivamente nel `localStorage` del tuo browser**.
- **Nessun Server Esterno**: Lo script non comunica con server esterni, database o analytics. I tuoi dati restano sul tuo computer.

## Installazione

1. Installa l'estensione **Tampermonkey** sul tuo browser.
2. Clicca sul seguente link per installare lo script:
   **[Installa AWPN](https://raw.githubusercontent.com/Vincy02/AnimeWorldPlayerNew/main/animeworld-player.user.js)**
3. Conferma l'installazione su Tampermonkey.
4. Apri un episodio su AnimeWorld e goditi il nuovo player!

## Scorciatoie da Tastiera

| Tasto | Azione |
| :---: | :--- |
| <kbd>Spazio</kbd> o <kbd>K</kbd> | Play / Pausa |
| <kbd>F</kbd> | Schermo intero (Attiva/Disattiva) |
| <kbd>I</kbd> | Mini-player (Picture-in-Picture) |
| <kbd>M</kbd> | Muto (Attiva/Disattiva) |
| <kbd>J</kbd> o <kbd>←</kbd> | Indietro di 10 secondi |
| <kbd>L</kbd> o <kbd>→</kbd> | Avanti di 10 secondi |
| <kbd>↑</kbd> | Aumenta il volume del 10% |
| <kbd>↓</kbd> | Abbassa il volume del 10% |
| <kbd>0</kbd>...<kbd>9</kbd> | Salta a una percentuale del video (0% ... 90%) |

## Modifica e Sviluppo

Se vuoi modificare lo script:
1. Clona questa repository: `git clone https://github.com/Vincy02/AnimeWorldPlayerNew.git`
2. Modifica il file `animeworld-player.user.js`.
3. Il player utilizza icone SVG pure e CSS Variables per gestire il tema visivo.

---
>**Disclaimer**:<br>
*Questo script è un progetto NON ufficiale e non è in alcun modo affiliato con AnimeWorld.*