// ==UserScript==
// @name         AnimeWorldPlayerNew
// @namespace    AWPN
// @version      1.0.0
// @description  AWPN è un userscript che sostituisce il player nativo di AnimeWorld con una nuova interfaccia elegante in stile YouTube. Include scorciatoie da tastiera, auto-resume e molto altro.
// @author       Vincy02
// @match        *://www.animeworld.ac/play/*
// @updateURL    https://raw.githubusercontent.com/Vincy02/AnimeWorldPlayerNew/main/animeworld-player.user.js
// @downloadURL  https://raw.githubusercontent.com/Vincy02/AnimeWorldPlayerNew/main/animeworld-player.user.js
// @run-at       document-start
// @grant        unsafeWindow
// ==/UserScript==

(() => {
    'use strict';

    const AW_BLUE = '#165fa7';
    const AW_BLUE_HOVER = '#1a75cf';
    const CFG = {
        vol: 'aw_yt_vol',
        mute: 'aw_yt_mute',
        speed: 'aw_yt_speed',
        autonext: 'aw_yt_autonext',
        resume: 'aw_yt_resume:'
    };

    // --- SCRIPT BLOCKER ---
    const _srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get() { return _srcDesc.get.call(this); },
        set(val) {
            if (typeof val === 'string' && val.includes('playerServersAndDownloads')) return;
            _srcDesc.set.call(this, val);
        }
    });

    const _ctrlDesc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'controls');
    if (_ctrlDesc) {
        Object.defineProperty(HTMLVideoElement.prototype, 'controls', {
            configurable: true,
            enumerable: true,
            get() { return _ctrlDesc.get.call(this); },
            set(val) {
                if (this.id === 'aw-video') return;
                _ctrlDesc.set.call(this, val);
            }
        });
    }

    const _setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, val) {
        if (this.tagName === 'VIDEO' && this.id === 'aw-video' && name === 'controls') return;
        return _setAttribute.call(this, name, val);
    };

    // --- UTILS ---
    const ls = {
        get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
        set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
        del: (k) => { try { localStorage.removeItem(k); } catch { } }
    };

    const fmtTime = (sec) => {
        if (isNaN(sec)) return '0:00';
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
    };

    const createEl = (tag, className, html = '') => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (html) el.innerHTML = html;
        return el;
    };

    // --- ICONS ---
    const ICONS = {
        play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
        pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
        vol_up: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
        vol_down: '<svg viewBox="0 0 24 24"><path d="M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>',
        vol_off: '<svg viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.98 2L21 18.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>',
        fs: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
        fs_exit: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
        next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
        pip: '<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3C1.9 3 1 3.88 1 4.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>',
        settings: '<svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>',
        keyboard: '<svg viewBox="0 0 24 24"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>',
        check: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
        chevron_left: '<svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>',
        spinner: '<svg viewBox="0 0 50 50" class="yt-spinner"><circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle></svg>'
    };

    // --- CSS ---
    const injectCSS = () => {
        const style = createEl('style', '', `
            /* Container & Video */
            #aw-yt-player { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'YouTube Noto', Roboto, Arial, sans-serif; user-select: none; }
            #aw-yt-player * { box-sizing: border-box; }
            #aw-video { width: 100%; height: 100%; display: block; outline: none; background: #000; }
            video::-webkit-media-controls { display: none !important; }
            video::-webkit-media-controls-enclosure { display: none !important; }
            video::-internal-media-controls-overlay-cast-button { display: none !important; }
            
            /* Gradients & Top Bar */
            .aw-gradient-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 120px; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); pointer-events: none; z-index: 10; opacity: 0; transition: opacity 0.3s; }
            .aw-gradient-top { position: absolute; top: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); pointer-events: none; z-index: 10; opacity: 0; transition: opacity 0.3s; }
            #aw-yt-player.ui-active .aw-gradient-bottom, #aw-yt-player.ui-active .aw-gradient-top { opacity: 1; }
            
            .aw-top-bar { position: absolute; top: 0; left: 0; right: 0; padding: 16px 24px; z-index: 15; opacity: 0; transition: opacity 0.3s; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
            #aw-yt-player.ui-active .aw-top-bar { opacity: 1; }
            .aw-title { color: #fff; font-size: 18px; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .aw-subtitle { color: rgba(255,255,255,0.8); font-size: 14px; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }

            /* Controls Bottom Bar */
            .aw-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0 12px; z-index: 15; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
            #aw-yt-player.ui-active .aw-controls { opacity: 1; pointer-events: all; }
            
            /* Progress Bar */
            .aw-progress-area { height: 16px; display: flex; align-items: center; cursor: pointer; position: relative; margin-bottom: 2px; }
            .aw-progress-bg { width: 100%; height: 3px; background: rgba(255,255,255,0.3); position: relative; transition: height 0.1s; display: flex; align-items: flex-end; }
            .aw-progress-area:hover .aw-progress-bg { height: 5px; }
            .aw-progress-load { position: absolute; left: 0; bottom: 0; height: 100%; background: rgba(255,255,255,0.4); width: 0%; transition: width 0.2s; }
            .aw-progress-fill { position: absolute; left: 0; bottom: 0; height: 100%; background: ${AW_BLUE}; width: 0%; z-index: 2; }
            .aw-progress-thumb { position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(0); width: 12px; height: 12px; border-radius: 50%; background: ${AW_BLUE}; z-index: 3; transition: transform 0.1s; }
            .aw-progress-area:hover .aw-progress-thumb { transform: translateY(-50%) scale(1); }
            
            /* Hover Tooltip */
            .aw-progress-hover { position: absolute; top: -30px; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; pointer-events: none; opacity: 0; transition: opacity 0.1s; white-space: nowrap; }
            .aw-progress-area:hover .aw-progress-hover { opacity: 1; }

            /* Buttons & Toolbar */
            .aw-toolbar { display: flex; justify-content: space-between; align-items: center; height: 48px; }
            .aw-left, .aw-right { display: flex; align-items: center; }
            .aw-btn { background: none; border: none; color: #fff; width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; cursor: pointer; opacity: 0.9; transition: opacity 0.2s; position: relative; }
            .aw-btn:hover { opacity: 1; }
            .aw-btn svg { width: 24px; height: 24px; fill: currentColor; }
            
            /* Tooltips */
            .aw-tooltip { position: absolute; top: -35px; background: rgba(28,28,28,0.9); color: #fff; padding: 6px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
            .aw-btn:hover .aw-tooltip { opacity: 1; }
            
            /* Volume Slider */
            .aw-vol-group { display: flex; align-items: center; overflow: hidden; width: 0; opacity: 0; transition: width 0.2s, opacity 0.2s; height: 44px; }
            .aw-btn-vol:hover + .aw-vol-group, .aw-vol-group:hover, .aw-btn-vol:focus + .aw-vol-group, .aw-vol-group:focus-within { width: 65px; opacity: 1; }
            .aw-vol-slider { -webkit-appearance: none !important; -moz-appearance: none !important; width: 60px; height: 3px; color: #fff !important; --pct: 100%; background: linear-gradient(to right, currentColor var(--pct), rgba(255,255,255,0.3) var(--pct)) !important; outline: none !important; cursor: pointer; border-radius: 2px; }
            .aw-vol-slider::-webkit-slider-thumb { -webkit-appearance: none !important; width: 12px; height: 12px; border-radius: 50%; color: #f2f2f2 !important; background: currentColor !important; cursor: pointer; transition: transform 0.1s; box-shadow: 0 0 2px rgba(0,0,0,0.5); margin-top: -4px; }
            .aw-vol-slider::-moz-range-thumb { width: 12px; height: 12px; border: none; border-radius: 50%; color: #f2f2f2 !important; background: currentColor !important; cursor: pointer; transition: transform 0.1s; box-shadow: 0 0 2px rgba(0,0,0,0.5); }
            .aw-vol-slider::-webkit-slider-runnable-track { -webkit-appearance: none !important; height: 3px; border-radius: 2px; }
            .aw-vol-slider::-webkit-slider-thumb:hover, .aw-vol-slider::-moz-range-thumb:hover { transform: scale(1.2); }
            
            /* Time */
            .aw-time { color: #ddd; font-size: 13px; margin-left: 10px; font-variant-numeric: tabular-nums; display: flex; gap: 4px; }
            
            /* Center Play Animation & Spinner */
            .aw-center-anim { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1.5); background: rgba(0,0,0,0.6); border-radius: 50%; width: 72px; height: 72px; display: flex; justify-content: center; align-items: center; color: #fff; opacity: 0; pointer-events: none; z-index: 20; transition: opacity 0.3s, transform 0.3s; }
            .aw-center-anim.show { opacity: 1; transform: translate(-50%, -50%) scale(1); animation: aw-fade-out 0.8s forwards; }
            @keyframes aw-fade-out { 0% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); } }
            .aw-center-anim svg { width: 36px; height: 36px; fill: currentColor; }
            
            .yt-spinner { animation: rotate 2s linear infinite; z-index: 2; position: absolute; top: 50%; left: 50%; margin: -25px 0 0 -25px; width: 50px; height: 50px; display: none; }
            .yt-spinner.show { display: block; }
            .yt-spinner circle { stroke: ${AW_BLUE}; stroke-linecap: round; animation: dash 1.5s ease-in-out infinite; }
            @keyframes rotate { 100% { transform: rotate(360deg); } }
            @keyframes dash { 0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; } }

            /* Settings Menu */
            .aw-settings-menu { position: absolute; bottom: 60px; right: 16px; background: rgba(28,28,28,0.95); border-radius: 12px; width: 250px; color: #fff; font-size: 14px; z-index: 30; opacity: 0; pointer-events: none; transform: translateY(10px); transition: opacity 0.2s, transform 0.2s; box-shadow: 0 8px 24px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column; }
            .aw-settings-menu.open { opacity: 1; pointer-events: all; transform: translateY(0); }
            
            .aw-menu-panel { width: 100%; transition: transform 0.3s; display: flex; flex-direction: column; }
            .aw-menu-header { display: flex; align-items: center; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; font-weight: 500; }
            .aw-menu-header svg { width: 20px; height: 20px; fill: #fff; margin-right: 12px; }
            .aw-menu-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; cursor: pointer; transition: background 0.2s; }
            .aw-menu-item:hover { background: rgba(255,255,255,0.1); }
            .aw-menu-item .label { display: flex; align-items: center; gap: 12px; }
            .aw-menu-item svg { width: 20px; height: 20px; fill: #fff; }
            .aw-menu-item .val { color: #aaa; font-size: 13px; }
            
            /* Toggle Switch */
            .aw-switch { position: relative; width: 34px; height: 14px; border-radius: 7px; cursor: pointer; }
            .aw-switch::before { content: ''; position: absolute; inset: 0; border-radius: 7px; color: #fff !important; background: currentColor !important; opacity: 0.3; transition: color 0.2s, opacity 0.2s; }
            .aw-switch::after { content: ''; position: absolute; top: -3px; left: -2px; width: 20px; height: 20px; color: #fff !important; background: currentColor !important; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.4); transition: transform 0.2s, color 0.2s; z-index: 2; }
            .aw-switch.on::before { color: ${AW_BLUE} !important; opacity: 0.5; }
            .aw-switch.on::after { transform: translateX(18px); color: ${AW_BLUE} !important; }

            /* Overlays (Resume, Next, Shortcuts) */
            .aw-dialog-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); z-index: 40; display: flex; justify-content: center; align-items: center; opacity: 0; pointer-events: none; transition: opacity 0.3s; backdrop-filter: blur(4px); }
            .aw-dialog-overlay.show { opacity: 1; pointer-events: all; }
            .aw-dialog { background: #1c1c1c; padding: 24px; border-radius: 12px; color: #fff; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .aw-dialog h2 { margin: 0 0 12px; font-size: 20px; font-weight: 500; }
            .aw-dialog p { margin: 0 0 24px; color: #aaa; font-size: 14px; line-height: 1.5; }
            .aw-dialog-btns { display: flex; gap: 12px; justify-content: center; }
            .aw-btn-dialog { padding: 10px 20px; border: none; border-radius: 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity 0.2s, background 0.2s; }
            .aw-btn-dialog.primary { background: ${AW_BLUE}; color: #fff; }
            .aw-btn-dialog.primary:hover { background: ${AW_BLUE_HOVER}; }
            .aw-btn-dialog.secondary { background: rgba(255,255,255,0.1); color: #fff; }
            .aw-btn-dialog.secondary:hover { background: rgba(255,255,255,0.2); }
            
            /* Shortcuts Help */
            .aw-kbd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; text-align: left; margin-bottom: 24px; align-items: start; }
            .aw-kbd-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .aw-kbd-desc { color: #eee; font-size: 13px; line-height: 1.2; }
            .aw-kbd-keys { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
            .aw-kbd-key { background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 4px; font-family: 'Roboto Mono', monospace; font-weight: bold; color: #fff; font-size: 12px; white-space: nowrap; }
        `);
        document.head.appendChild(style);
    };

    // --- LOGIC ---
    class AWPlayer {
        constructor(url, token) {
            this.url = url;
            this.token = token;
            this.uiActive = true;
            this.hideTimer = null;
            this.settingsOpen = false;
            this.allowPlay = false; // Prevents site scripts from forcing autoplay

            this.buildDOM();
            this.bindEvents();
            this.loadState();
        }


        loadNewEpisode(url, token) {
            this.allowPlay = false;
            this.token = token;
            this.url = url;
            this.video.src = url;
            if (this.nextOverlay) this.nextOverlay.classList.remove('show');
            if (this.resumeOverlay) this.resumeOverlay.classList.remove('show');
            this.video.currentTime = 0;
            this.progressFill.style.width = '0%';
            this.populateTitle();
            this.nextEpNode = document.querySelector('.episode a.active')?.parentElement?.nextElementSibling?.querySelector('a') || null;
            this.btnNext.style.display = this.nextEpNode ? '' : 'none';
            this.btnPlay.innerHTML = ICONS.play;
            this.btnPlay.querySelector('.aw-tooltip').textContent = 'Riproduci (k)';
            this.loadState(); // Re-trigger resume logic for new episode
        }

        buildDOM() {
            const container = document.querySelector('#player');
            container.innerHTML = '';

            this.wrap = createEl('div', 'ui-active');
            this.wrap.id = 'aw-yt-player';

            this.video = createEl('video');
            this.video.id = 'aw-video';
            this.video.src = this.url;
            this.video.autoplay = false;
            this.video.disableRemotePlayback = true;
            this.video.disablePictureInPicture = true; // We use our own custom button if needed

            // Overlays
            this.gradTop = createEl('div', 'aw-gradient-top');
            this.gradBottom = createEl('div', 'aw-gradient-bottom');
            this.spinner = createEl('div', 'yt-spinner show', ICONS.spinner);
            this.centerAnim = createEl('div', 'aw-center-anim');

            // Top Bar
            this.topBar = createEl('div', 'aw-top-bar');
            this.titleEl = createEl('div', 'aw-title');
            this.subtitleEl = createEl('div', 'aw-subtitle');
            this.topBar.append(this.titleEl, this.subtitleEl);

            this.populateTitle();

            // Controls
            this.controls = createEl('div', 'aw-controls');

            // Progress
            this.progressArea = createEl('div', 'aw-progress-area');
            this.progressBg = createEl('div', 'aw-progress-bg');
            this.progressLoad = createEl('div', 'aw-progress-load');
            this.progressFill = createEl('div', 'aw-progress-fill');
            this.progressThumb = createEl('div', 'aw-progress-thumb');
            this.progressHover = createEl('div', 'aw-progress-hover', '0:00');
            this.progressFill.append(this.progressThumb);
            this.progressBg.append(this.progressLoad, this.progressFill);
            this.progressArea.append(this.progressBg, this.progressHover);

            // Toolbar
            this.toolbar = createEl('div', 'aw-toolbar');

            // Left
            this.left = createEl('div', 'aw-left');
            this.btnPlay = this.mkBtn(ICONS.play, 'Riproduci (k)');
            this.btnNext = this.mkBtn(ICONS.next, 'Prossimo (N)');

            this.nextEpNode = document.querySelector('.episode a.active')?.parentElement?.nextElementSibling?.querySelector('a') || null;
            if (!this.nextEpNode) this.btnNext.style.display = 'none';

            this.btnVol = createEl('button', 'aw-btn aw-btn-vol', ICONS.vol_up);
            const ttipVol = createEl('span', 'aw-tooltip', 'Muto (m)');
            this.btnVol.appendChild(ttipVol);

            this.volGroup = createEl('div', 'aw-vol-group');
            this.volSlider = createEl('input', 'aw-vol-slider');
            this.volSlider.type = 'range'; this.volSlider.min = 0; this.volSlider.max = 1; this.volSlider.step = 0.05;
            this.volGroup.append(this.volSlider);

            this.timeEl = createEl('div', 'aw-time', '<span class="current">0:00</span><span>/</span><span class="total">0:00</span>');

            this.left.append(this.btnPlay, this.btnNext, this.btnVol, this.volGroup, this.timeEl);

            // Right
            this.right = createEl('div', 'aw-right');
            this.btnSettings = this.mkBtn(ICONS.settings, 'Impostazioni');
            this.btnPip = this.mkBtn(ICONS.pip, 'Picture-in-Picture (i)');
            this.btnFs = this.mkBtn(ICONS.fs, 'Schermo intero (f)');
            this.right.append(this.btnSettings, this.btnPip, this.btnFs);

            this.toolbar.append(this.left, this.right);
            this.controls.append(this.progressArea, this.toolbar);

            // Settings Menu
            this.buildSettingsMenu();

            // Dialogs
            this.resumeOverlay = this.mkDialog('resume', 'Riprendere la visione?', 'Vuoi riprendere da dove eri rimasto?', 'Sì, riprendi', "No, dall'inizio");
            this.nextOverlay = this.mkDialog('next', 'Prossimo episodio', 'Inizia tra <span class="countdown" style="font-weight:bold;color:#fff;">5</span> secondi...', 'Riproduci ora', 'Annulla');
            this.kbdOverlay = this.buildKeyboardHelp();

            this.wrap.append(this.video, this.gradTop, this.topBar, this.gradBottom, this.spinner, this.centerAnim, this.controls, this.settingsMenu, this.resumeOverlay, this.nextOverlay, this.kbdOverlay);
            container.appendChild(this.wrap);
        }

        mkBtn(icon, tipText) {
            const b = createEl('button', 'aw-btn', icon);
            b.append(createEl('span', 'aw-tooltip', tipText));
            return b;
        }

        mkDialog(id, title, desc, pTxt, sTxt) {
            const over = createEl('div', 'aw-dialog-overlay');
            over.id = `aw-dialog-${id}`;
            const d = createEl('div', 'aw-dialog', `<h2>${title}</h2><p>${desc}</p>`);
            const btns = createEl('div', 'aw-dialog-btns');
            const btnS = createEl('button', 'aw-btn-dialog secondary btn-sec', sTxt);
            const btnP = createEl('button', 'aw-btn-dialog primary btn-pri', pTxt);
            btns.append(btnS, btnP);
            d.append(btns);
            over.append(d);
            return over;
        }

        populateTitle() {
            const h1 = document.querySelector('h1.title');
            const ep = document.querySelector('.episode a.active');
            if (h1) this.titleEl.textContent = h1.textContent.trim();
            if (ep) this.subtitleEl.textContent = 'Episodio ' + ep.textContent.trim();
        }

        buildSettingsMenu() {
            this.settingsMenu = createEl('div', 'aw-settings-menu');

            this.menuMain = createEl('div', 'aw-menu-panel');

            // Auto Next Toggle
            const itemAuto = createEl('div', 'aw-menu-item');
            const lAuto = createEl('div', 'label', ICONS.next + '<span>Riproduzione automatica</span>');
            this.toggleAuto = createEl('div', 'aw-switch');
            itemAuto.append(lAuto, this.toggleAuto);
            itemAuto.onclick = () => {
                this.toggleAuto.classList.toggle('on');
                ls.set(CFG.autonext, this.toggleAuto.classList.contains('on'));
            };

            // Speed Menu Trigger
            const itemSpeed = createEl('div', 'aw-menu-item');
            const lSpeed = createEl('div', 'label', ICONS.play + '<span>Velocità</span>');
            this.valSpeed = createEl('div', 'val', 'Normale');
            itemSpeed.append(lSpeed, this.valSpeed);
            itemSpeed.onclick = () => this.showSpeedMenu();

            // Keyboard Trigger
            const itemKbd = createEl('div', 'aw-menu-item');
            itemKbd.innerHTML = `<div class="label">${ICONS.keyboard}<span>Scorciatoie</span></div>`;
            itemKbd.onclick = () => { this.closeSettings(); this.kbdOverlay.classList.add('show'); };

            this.menuMain.append(itemAuto, itemSpeed, itemKbd);

            // Speed Submenu
            this.menuSpeed = createEl('div', 'aw-menu-panel');
            this.menuSpeed.style.display = 'none';
            const headSpeed = createEl('div', 'aw-menu-header', ICONS.chevron_left + '<span>Velocità di riproduzione</span>');
            headSpeed.onclick = () => this.showMainMenu();
            this.menuSpeed.append(headSpeed);

            [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].forEach(s => {
                const i = createEl('div', 'aw-menu-item', `<div class="label">${s === 1 ? 'Normale' : s}</div>`);
                i.onclick = () => this.setSpeed(s);
                i.dataset.speed = s;
                this.menuSpeed.append(i);
            });

            this.settingsMenu.append(this.menuMain, this.menuSpeed);
        }

        buildKeyboardHelp() {
            const over = createEl('div', 'aw-dialog-overlay');
            const d = createEl('div', 'aw-dialog', '<h2>Scorciatoie da tastiera</h2>');
            d.style.maxWidth = '600px';
            const grid = createEl('div', 'aw-kbd-grid');
            const cuts = [
                ['Riproduci / Pausa', ['k', 'Spazio']], ['Schermo intero', ['f']], ['Muto', ['m']], ['Mini player (PiP)', ['i']],
                ['Indietro 10s', ['j']], ['Avanti 10s', ['l']],
                ['Indietro 5s', ['←']], ['Avanti 5s', ['→']],
                ['Alza volume', ['↑']], ['Abbassa volume', ['↓']], ['Impostazioni', ['?']]
            ];
            cuts.forEach(([desc, keys]) => {
                const keysHtml = keys.map(k => `<span class="aw-kbd-key">${k}</span>`).join('');
                grid.insertAdjacentHTML('beforeend', `<div class="aw-kbd-row"><span class="aw-kbd-desc">${desc}</span><div class="aw-kbd-keys">${keysHtml}</div></div>`);
            });
            const btn = createEl('button', 'aw-btn-dialog primary', 'Chiudi');
            btn.onclick = () => over.classList.remove('show');
            d.append(grid, btn);
            over.append(d);
            return over;
        }

        loadState() {
            const v = ls.get(CFG.vol, 1);
            const m = ls.get(CFG.mute, false);
            this.video.volume = v;
            this.video.muted = m;
            this.volSlider.value = m ? 0 : v;
            this.updateVolIcon();
            this.volSlider.dispatchEvent(new Event('input'));

            this.setSpeed(ls.get(CFG.speed, 1));

            if (ls.get(CFG.autonext, false)) this.toggleAuto.classList.add('on');

            const checkResume = () => {
                const savedPos = parseFloat(ls.get(CFG.resume + this.token, 0));
                if (savedPos > 5 && isFinite(this.video.duration) && this.video.duration - savedPos > 30) {
                    this.resumeOverlay.querySelector('p').textContent = `Vuoi riprendere da ${fmtTime(savedPos)}?`;
                    this.resumeOverlay.classList.add('show');
                    this.allowPlay = false;
                    this.video.pause();
                }
            };
            if (this.video.readyState >= 1 && isFinite(this.video.duration)) {
                checkResume();
            } else {
                this.video.addEventListener('loadedmetadata', checkResume, { once: true });
            }
        }

        bindEvents() {
            const v = this.video;

            // --- UI Interaction ---
            this.wrap.onmousemove = () => this.wakeUI();
            this.wrap.onmouseleave = () => { if (!v.paused && !this.settingsOpen) this.sleepUI(); };

            this.btnSettings.onclick = (e) => { e.stopPropagation(); this.toggleSettings(); };
            this.wrap.onclick = (e) => { if (this.settingsOpen && !e.target.closest('.aw-settings-menu')) this.closeSettings(); };

            // --- Playback ---
            const toggle = () => {
                if (this.resumeOverlay && this.resumeOverlay.classList.contains('show')) return;
                this.allowPlay = true;
                v.paused ? v.play() : v.pause();
            };
            v.onclick = toggle;
            this.btnPlay.onclick = toggle;

            v.ondblclick = () => this.btnFs.click();

            v.addEventListener('play', () => {
                if (!this.allowPlay) {
                    v.pause();
                    return;
                }
                this.btnPlay.innerHTML = ICONS.pause;
                this.btnPlay.querySelector('.aw-tooltip').textContent = 'Pausa (k)';
                this.wakeUI();
                this.flashCenter(ICONS.play);
            });

            v.onpause = () => {
                this.btnPlay.innerHTML = ICONS.play;
                this.btnPlay.querySelector('.aw-tooltip').textContent = 'Riproduci (k)';
                this.wakeUI();
                this.flashCenter(ICONS.pause);
            };

            // --- Progress & Time ---
            let seeking = false;

            v.ontimeupdate = () => {
                if (!v.duration) return;
                const pct = (v.currentTime / v.duration) * 100;
                if (!seeking) {
                    this.progressFill.style.width = pct + '%';
                    this.timeEl.querySelector('.current').textContent = fmtTime(v.currentTime);
                }
                this.timeEl.querySelector('.total').textContent = fmtTime(v.duration);
                if (v.currentTime > 5 && v.duration - v.currentTime > 30) {
                    ls.set(CFG.resume + this.token, v.currentTime);
                } else if (v.duration - v.currentTime <= 30) {
                    ls.del(CFG.resume + this.token);
                }
            };

            v.onprogress = () => {
                if (v.buffered.length > 0) {
                    const pct = (v.buffered.end(v.buffered.length - 1) / v.duration) * 100;
                    this.progressLoad.style.width = pct + '%';
                }
            };

            // --- Seeking ---
            const applySeek = (e, final) => {
                const rect = this.progressBg.getBoundingClientRect();
                let p = (e.clientX - rect.left) / rect.width;
                p = Math.max(0, Math.min(1, p));
                if (final && v.duration) {
                    v.currentTime = p * v.duration;
                } else if (v.duration) {
                    this.progressFill.style.width = (p * 100) + '%';
                    this.timeEl.querySelector('.current').textContent = fmtTime(p * v.duration);
                }
            };
            this.progressArea.onmousedown = (e) => { seeking = true; applySeek(e, false); };
            window.addEventListener('mousemove', (e) => { if (seeking) applySeek(e, false); });
            window.addEventListener('mouseup', (e) => { if (seeking) { applySeek(e, true); seeking = false; } });

            this.progressArea.onmousemove = (e) => {
                const rect = this.progressBg.getBoundingClientRect();
                let p = (e.clientX - rect.left) / rect.width;
                p = Math.max(0, Math.min(1, p));
                this.progressHover.style.left = (p * 100) + '%';
                if (v.duration) this.progressHover.textContent = fmtTime(p * v.duration);
            };

            // --- Loading state ---
            v.onwaiting = () => this.spinner.classList.add('show');
            v.onplaying = () => this.spinner.classList.remove('show');
            v.oncanplay = () => this.spinner.classList.remove('show');

            // --- Volume ---
            const updateVolSliderBg = (val) => {
                this.volSlider.style.setProperty('--pct', `${val * 100}%`);
            };

            this.volSlider.oninput = () => {
                const val = parseFloat(this.volSlider.value);
                v.volume = val;
                v.muted = val === 0;
                this.updateVolIcon();
                updateVolSliderBg(val);
                ls.set(CFG.vol, val);
                ls.set(CFG.mute, v.muted);
            };
            this.btnVol.onclick = () => {
                v.muted = !v.muted;
                const targetVol = v.muted ? 0 : v.volume;
                this.volSlider.value = targetVol;
                updateVolSliderBg(targetVol);
                this.updateVolIcon();
                ls.set(CFG.mute, v.muted);
            };

            // --- Fullscreen & PiP ---
            this.btnFs.onclick = () => {
                if (!document.fullscreenElement) this.wrap.requestFullscreen().catch(() => { });
                else document.exitFullscreen().catch(() => { });
            };
            document.onfullscreenchange = () => {
                const isFs = !!document.fullscreenElement;
                this.btnFs.innerHTML = isFs ? ICONS.fs_exit : ICONS.fs;
                this.btnFs.querySelector('.aw-tooltip').textContent = isFs ? 'Esci da schermo intero (f)' : 'Schermo intero (f)';
            };

            this.btnPip.onclick = () => {
                if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => { });
                else v.requestPictureInPicture().catch(() => { });
            };
            v.onenterpictureinpicture = () => this.btnPip.querySelector('.aw-tooltip').textContent = 'Esci da PiP (i)';
            v.onleavepictureinpicture = () => this.btnPip.querySelector('.aw-tooltip').textContent = 'Mini player (PiP) (i)';

            // --- Next Episode Logic ---
            this.btnNext.onclick = () => { if (this.nextEpNode) loadEpisode(this.nextEpNode.dataset.id, true); };

            let nextTimer;
            v.onended = () => {
                if (!this.nextEpNode || !this.toggleAuto.classList.contains('on')) return;
                this.nextOverlay.classList.add('show');
                let count = 5;
                const cEl = this.nextOverlay.querySelector('.countdown');
                cEl.textContent = count;
                nextTimer = setInterval(() => {
                    count--;
                    cEl.textContent = count;
                    if (count <= 0) {
                        clearInterval(nextTimer);
                        loadEpisode(this.nextEpNode.dataset.id, true);
                    }
                }, 1000);
            };

            this.nextOverlay.querySelector('.btn-sec').onclick = () => {
                clearInterval(nextTimer);
                this.nextOverlay.classList.remove('show');
            };
            this.nextOverlay.querySelector('.btn-pri').onclick = () => {
                clearInterval(nextTimer);
                loadEpisode(this.nextEpNode.dataset.id, true);
            };


            // --- Resume Logic ---
            this.resumeOverlay.querySelector('.btn-pri').onclick = () => {
                v.currentTime = parseFloat(ls.get(CFG.resume + this.token, 0));
                this.resumeOverlay.classList.remove('show');
                this.allowPlay = true;
                v.play();
            };
            this.resumeOverlay.querySelector('.btn-sec').onclick = () => {
                v.currentTime = 0;
                ls.del(CFG.resume + this.token);
                this.resumeOverlay.classList.remove('show');
                this.allowPlay = true;
                v.play();
            };

            // --- Keyboard Shortcuts ---
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                if (this.resumeOverlay && this.resumeOverlay.classList.contains('show')) return;
                const k = e.key.toLowerCase();

                if (k === '?') { this.kbdOverlay.classList.add('show'); return; }

                if ([' ', 'k', 'j', 'l', 'f', 'm', 'i', 'arrowright', 'arrowleft', 'arrowup', 'arrowdown'].includes(k) || (!isNaN(k) && k.trim() !== '')) {
                    e.preventDefault();
                    if (k === ' ' || k === 'k') toggle();
                    else if (k === 'f') this.btnFs.click();
                    else if (k === 'm') this.btnVol.click();
                    else if (k === 'i') this.btnPip.click();
                    else if (k === 'l') { v.currentTime += 10; this.flashAction(ICONS.next, '+10s'); }
                    else if (k === 'j') { v.currentTime -= 10; this.flashAction('<svg viewBox="0 0 24 24"><path d="M18 18l-8.5-6L18 6v12zM8 6v12h-2V6h2z"/></svg>', '-10s'); }
                    else if (k === 'arrowright') { v.currentTime += 5; this.flashAction(ICONS.next, '+5s'); }
                    else if (k === 'arrowleft') { v.currentTime -= 5; this.flashAction('<svg viewBox="0 0 24 24"><path d="M18 18l-8.5-6L18 6v12zM8 6v12h-2V6h2z"/></svg>', '-5s'); }
                    else if (k === 'arrowup') {
                        this.volSlider.value = Math.min(1, parseFloat(this.volSlider.value) + 0.05);
                        this.volSlider.dispatchEvent(new Event('input'));
                        this.flashAction(ICONS.vol_up, Math.round(this.volSlider.value * 100) + '%');
                    }
                    else if (k === 'arrowdown') {
                        this.volSlider.value = Math.max(0, parseFloat(this.volSlider.value) - 0.05);
                        this.volSlider.dispatchEvent(new Event('input'));
                        this.flashAction(ICONS.vol_down, Math.round(this.volSlider.value * 100) + '%');
                    }
                    else if (!isNaN(k) && k.trim() !== '') {
                        if (v.duration) {
                            const pct = parseInt(k, 10) * 10;
                            v.currentTime = (pct / 100) * v.duration;
                            this.flashCenter(`<span style="font-size:24px;font-weight:bold;">${pct}%</span>`);
                        }
                    }
                }
            });
        }

        wakeUI() {
            this.wrap.classList.add('ui-active');
            clearTimeout(this.hideTimer);
            if (!this.video.paused && !this.settingsOpen) {
                this.hideTimer = setTimeout(() => this.sleepUI(), 2500);
            }
        }

        sleepUI() {
            this.wrap.classList.remove('ui-active');
        }

        updateVolIcon() {
            const v = this.video.volume, m = this.video.muted;
            let icon = ICONS.vol_up;
            if (m || v === 0) icon = ICONS.vol_off;
            else if (v < 0.5) icon = ICONS.vol_down;
            this.btnVol.innerHTML = icon;
            this.btnVol.appendChild(createEl('span', 'aw-tooltip', m ? 'Attiva audio (m)' : 'Muto (m)'));
        }

        flashCenter(iconHtml) {
            this.centerAnim.innerHTML = iconHtml;
            this.centerAnim.classList.remove('show');
            void this.centerAnim.offsetWidth; // trigger reflow
            this.centerAnim.classList.add('show');
        }

        flashAction(icon, text) {
            this.flashCenter(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">${icon}<span style="font-size:14px;font-weight:bold;margin-top:2px;">${text}</span></div>`);
        }

        toggleSettings() {
            this.settingsOpen = !this.settingsOpen;
            if (this.settingsOpen) {
                this.settingsMenu.classList.add('open');
                this.showMainMenu();
                clearTimeout(this.hideTimer);
            } else {
                this.settingsMenu.classList.remove('open');
                this.wakeUI();
            }
        }

        closeSettings() {
            this.settingsOpen = false;
            this.settingsMenu.classList.remove('open');
            this.wakeUI();
        }

        showMainMenu() {
            this.menuMain.style.display = 'block';
            this.menuSpeed.style.display = 'none';
        }

        showSpeedMenu() {
            this.menuMain.style.display = 'none';
            this.menuSpeed.style.display = 'block';
        }

        setSpeed(s) {
            this.video.playbackRate = s;
            ls.set(CFG.speed, s);
            this.valSpeed.textContent = s === 1 ? 'Normale' : s;

            this.menuSpeed.querySelectorAll('.aw-menu-item').forEach(el => {
                if (el.querySelector('svg')) el.querySelector('svg').remove();
                if (parseFloat(el.dataset.speed) === s) {
                    el.insertAdjacentHTML('afterbegin', ICONS.check);
                } else {
                    el.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24"></svg>'); // placeholder
                }
            });
            this.showMainMenu();
            this.closeSettings();
            this.flashCenter(`<span style="font-size:24px;font-weight:bold;">${s}x</span>`);
        }
    }

    // --- INIT & LOGIC ---
    let activePlayer = null;

    const setActiveEpisode = (token) => {
        const all = Array.from(document.querySelectorAll('.episode a'));
        const idx = all.findIndex(a => a.dataset.id === token);
        all.forEach((a, i) => a.classList.toggle('active', i === idx));
        const prevBtn = document.querySelector('.prevnext.prev'); if (prevBtn) prevBtn.style.display = idx > 0 ? '' : 'none';
        const nextBtn = document.querySelector('.prevnext.next'); if (nextBtn) nextBtn.style.display = idx < all.length - 1 ? '' : 'none';
        const epNum = all[idx]?.dataset?.num || all[idx]?.textContent?.trim() || '';
        document.querySelectorAll('.episodeNum').forEach(el => el.textContent = epNum);
    };

    const loadEpisode = async (token, pushState = false) => {
        if (!token) return;
        setActiveEpisode(token);
        if (pushState) {
            const epLink = document.querySelector(`.episode a[data-id="${token}"]`);
            if (epLink?.href) history.pushState({}, '', epLink.href);
        }

        try {
            const res = await fetch(`/api/episode/serverPlayerAnimeWorld?alt=1&id=${token}`);
            const html = await res.text();
            const m = html.match(/file\s*:\s*["']([^"']+)["']/i);
            if (m) {
                const url = m[1].replace(/\\\//g, '/');
                if (activePlayer) {
                    activePlayer.loadNewEpisode(url, token);
                } else {
                    activePlayer = new AWPlayer(url, token);
                }
            }
        } catch (e) { console.error('Errore caricamento AW Player:', e); }
    };

    const wireControls = () => {
        document.querySelectorAll('.episode a').forEach(a => {
            if (a.dataset.npWired) return;
            a.dataset.npWired = '1';
            a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); loadEpisode(a.dataset.id, true); });
        });
        document.querySelectorAll('.prevnext').forEach(btn => {
            if (btn.dataset.npWired) return;
            btn.dataset.npWired = '1';
            btn.addEventListener('click', e => {
                e.preventDefault(); e.stopPropagation();
                const isNext = btn.classList.contains('next');
                const active = document.querySelector('.episode a.active');
                if (!active) return;
                const target = isNext ? active.parentElement.nextElementSibling?.querySelector('a') : active.parentElement.previousElementSibling?.querySelector('a');
                if (target) loadEpisode(target.dataset.id, true);
            });
        });

        // Hide Original/Alternative buttons to avoid conflicts
        ['.control[data-value="original"]', '.control[data-value="alternative"]'].forEach(sel =>
            document.querySelectorAll(sel).forEach(el => {
                el.style.setProperty('display', 'none', 'important');
                el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true);
            })
        );
    };

    const init = async () => {
        injectCSS();
        wireControls();
        const token = document.querySelector('#player')?.dataset?.id;
        if (token) loadEpisode(token, false);
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
