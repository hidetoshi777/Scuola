"""Controllo breve degli audio e dei comandi nel browser, anche a 390 px."""
import functools
import hashlib
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
handler = functools.partial(SimpleHTTPRequestHandler, directory=str(ROOT.parent))
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{server.server_port}/plesso-meucci-3d/"
report = {}
try:
    with sync_playwright() as p:
        candidates = [Path(p.chromium.executable_path),
                      Path(os.environ['PROGRAMFILES']) / 'Google/Chrome/Application/chrome.exe',
                      Path(os.environ['PROGRAMFILES(X86)']) / 'Microsoft/Edge/Application/msedge.exe']
        browser = p.chromium.launch(executable_path=str(next(f for f in candidates if f.exists())))
        page = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.add_init_script("""window.__voices = []; const OriginalAudio = window.Audio;
          window.Audio = function(...args) { const a = new OriginalAudio(...args); window.__voices.push(a); return a; };""")
        page.goto(url, wait_until='domcontentloaded')
        page.locator('#dialogue.open').wait_for(timeout=35000)
        page.locator('#loader.hidden').wait_for(state='attached', timeout=35000)
        if page.evaluate('window.__voices[0].paused'):
            page.locator('#voice-replay').click()
        page.wait_for_function("window.__voices[0].currentTime > 0", timeout=10000)
        assert page.locator('#voice-replay').inner_text() == 'Ferma audio'
        page.locator('#voice-replay').click()
        assert page.evaluate('window.__voices[0].paused')
        page.locator('#voice-replay').click()
        page.wait_for_function("!window.__voices[0].paused")
        page.locator('#voice-toggle').click()
        assert page.evaluate('window.__voices[0].paused')
        assert page.locator('#voice-replay').is_disabled()
        page.locator('#voice-toggle').click()
        page.wait_for_function("!window.__voices[0].paused")
        first_src = page.evaluate('window.__voices[0].src')
        page.locator('#dialogue-continue').click()
        page.wait_for_function('(old) => window.__voices[0].src !== old && !window.__voices[0].paused', arg=first_src)
        mobile = page.evaluate("""() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          dialogue: (() => {const r = document.querySelector('#dialogue').getBoundingClientRect();
            return {left:r.left, right:r.right, top:r.top, bottom:r.bottom};})(),
          buttons: [...document.querySelectorAll('.dialogue-actions button')].map(b => {
            const r = b.getBoundingClientRect(); return {text:b.textContent, width:r.width, height:r.height}; })
        })""")
        assert not mobile['overflow']
        assert 0 <= mobile['dialogue']['left'] < mobile['dialogue']['right'] <= 390
        assert mobile['dialogue']['top'] >= 0 and mobile['dialogue']['bottom'] <= 844
        assert all(b['height'] >= 44 for b in mobile['buttons'])
        screenshot = Path(os.environ.get('TEMP', '.')) / 'meucci-voce-mobile.png'
        page.screenshot(path=str(screenshot))
        page.locator('#dialogue-continue').click()
        assert page.evaluate('window.__voices[0].paused')
        page.locator('#btn-hud-toggle').click()
        page.locator('[data-stop="6"]').click()
        page.wait_for_timeout(1800)
        page.keyboard.press('e')
        page.locator('#dialogue.open').wait_for()
        assert page.locator('#dialogue-who').inner_text() == 'Tu'
        assert page.locator('#voice-controls').is_hidden()
        page.locator('#dialogue-continue').click()
        assert page.locator('#dialogue-who').inner_text() == 'Prof'
        page.wait_for_function('!window.__voices[0].paused')
        page.locator('#voice-toggle').click()
        page.reload(wait_until='domcontentloaded')
        page.locator('#dialogue.open').wait_for(timeout=35000)
        assert page.locator('#voice-toggle').inner_text() == 'Voce: spenta'
        assert page.locator('#voice-replay').is_disabled()
        durations = page.evaluate("""async () => {
          const {VOCE_PROF} = await import('./js/battute-prof.js');
          const result = [];
          for (const line of VOCE_PROF.lines) {
            const audio = new Audio(); audio.preload = 'metadata';
            const duration = await new Promise((resolve,reject) => {
              audio.onloadedmetadata = () => resolve(audio.duration);
              audio.onerror = () => reject(new Error(line.file));
              audio.src = './audio/' + line.file;
            });
            result.push({file:line.file, seconds:duration});
          }
          return result;
        }""")
        assert all(0 < d['seconds'] < 30 for d in durations)
        assert not errors, errors
        report = {"esito": "ok", "audio": durations, "mobile_390": mobile,
                  "verifiche": ["riproduzione MP3", "ferma e riascolta", "voce on/off",
                    "stop alla chiusura", "cambio battuta senza sovrapposizione", "solo voce Prof",
                    "preferenza conservata dopo ricarica", "nessun errore JavaScript"],
                  "contenuti_didattici": "Invariati; QA Jev esistente: _qa_jev_minigioco.json, review vuota.",
                  "sha256_minigioco": hashlib.sha256((ROOT / 'js/minigioco-tester.js').read_bytes()).hexdigest(),
                  "screenshot": str(screenshot)}
        (ROOT / '_qa_voce_prof.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        browser.close()
finally:
    server.shutdown()
