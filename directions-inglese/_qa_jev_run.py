"""QA TypeSafe/Jev su «Excuse me, where is…?» (inglese, terza professionale AM).

Controlla:
  - ogni frase di js/frasi.js: inglese corretto e naturale + traduzione italiana giusta;
  - le domande chiuse del laboratorio (js/laboratorio.js) e della scheda: una sola risposta giusta;
  - le affermazioni dello Studio (regole e trucchi).
I percorsi sulla mappa NON li giudica Jev: li verifica la simulazione (tutti e 12 corretti).
Report in _qa_jev_directions.json.
"""
from __future__ import annotations

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE / "_qa_jev_directions.json"
API = "https://api.typesafe.ai/v1/systemone"
CONTESTO = (
    "Lezione di inglese per una terza professionale italiana con livello molto basso (circa A1). "
    "Tema: chiedere e dare indicazioni stradali (Excuse me, where is the pharmacy? Go straight on, turn left...). "
    "Le semplificazioni adatte al livello vanno bene; si segnalano solo errori veri."
)

FRASI = json.loads(re.search(r"window\.FRASI\s*=\s*(\{.*\})\s*;", (HERE / "js" / "frasi.js").read_text(encoding="utf-8"), re.S).group(1))
NOMI = {k[2:]: v["en"] for k, v in FRASI.items() if k.startswith("w_")}

LAB_POSTI = [("pharmacy", ["pharmacy", "police", "park"]), ("church", ["school", "church", "cinema"]),
             ("hospital", ["hotel", "hospital", "library"]), ("bank", ["bank", "bakery", "busstop"]),
             ("postoffice", ["supermarket", "postoffice", "museum"]), ("station", ["station", "police", "lights"]),
             ("lights", ["zebra", "crossroads", "lights"]), ("cafe", ["restaurant", "cafe", "hotel"])]
DESCR_ICONA = {
    "pharmacy": "edificio bianco con insegna verde e croce verde",
    "church": "edificio con campanile a punta e croce",
    "hospital": "edificio bianco con insegna blu H e croce rossa",
    "bank": "edificio con una grande moneta d'oro con il simbolo dell'euro e un bancomat",
    "postoffice": "edificio con insegna rossa, una busta da lettere e una cassetta postale rossa",
    "station": "edificio con orologio e il muso di un treno",
    "lights": "un semaforo rosso giallo verde",
    "cafe": "edificio con tazzina di caffè fumante",
}
FRECCE = {"F": "freccia dritta in su (vai dritto)", "L": "freccia che gira a sinistra", "R": "freccia che gira a destra",
          "left": "il posto è a sinistra della strada", "right": "il posto è a destra della strada"}
LAB_FRECCE = [("c_straight", "F"), ("c_left", "L"), ("c_onright", "right"), ("c_right", "R"),
              ("l_first", "L"), ("c_onleft", "left"), ("l_second", "R"), ("l_yourleft", "left")]
LAB_DOVE = [
    ("bank, pharmacy* uno accanto all'altro sullo stesso lato della strada", "The pharmacy is ___ the bank.", "next to"),
    ("church sopra la strada, school* esattamente di fronte dall'altro lato della strada", "The school is ___ the church.", "opposite"),
    ("cafe, hotel*, cinema in fila sullo stesso lato, hotel in mezzo", "The hotel is ___ the café and the cinema.", "between"),
    ("supermarket sopra la strada, post office* esattamente di fronte dall'altro lato", "The post office is ___ the supermarket.", "opposite"),
    ("hospital, park* uno accanto all'altro sullo stesso lato", "The park is ___ the hospital.", "next to"),
    ("bank, church*, school in fila sullo stesso lato, church in mezzo", "The church is ___ the bank and the school.", "between"),
]
LAB_DIALOGO = [
    ("___ me, where is the bank?", ["Excuse", "Thank", "Please"], "Excuse", ""),
    ("Go ___ on.", ["straight", "street", "stop"], "straight", ""),
    ("Turn ___.", ["left", "right", "straight"], "left", "accanto c'è una freccia che gira a sinistra"),
    ("Take the ___ right.", ["first", "second", "third"], "second", "accanto c'è il cartellino 2ª"),
    ("It's ___ the left.", ["on", "in", "of"], "on", ""),
    ("Is there a pharmacy ___ here?", ["near", "next", "far"], "near", ""),
    ("Thank you! — You're ___!", ["welcome", "please", "sorry"], "welcome", ""),
]
SCHEDA_COMPLETA = [
    ("___ me, where is the hotel?", "Excuse"), ("Go ___ on.", "straight"), ("It's ___ the right.", "on"),
    ("The bakery is ___ to the bank. (accanto)", "next"), ("Thank you! — You're ___!", "welcome"),
]
AFFERMAZIONI = [
    "«Excuse me» si usa per attirare l'attenzione di uno sconosciuto e chiedere qualcosa; «Sorry» si usa quando sbagli, per chiedere scusa (per esempio se urti qualcuno).",
    "«Where is the…?» = Dov'è il / la…? Si dice anche «Where's the…?».",
    "Per un posto preciso si usa «the» (il, lo, la): Where is the bank? = Dov'è la banca? Quando chiedi se ce n'è uno si usa «a» (un, una): Is there a bank near here? = C'è una banca qui vicino?",
    "first = prima (1ª), second = seconda (2ª), third = terza (3ª). «Take the second right»: conti le strade a destra, passi la prima e giri alla seconda.",
    "«It's on the left» e «It's on your left» vogliono dire la stessa cosa: è a sinistra.",
    "next to = accanto a; opposite = di fronte a (dall'altra parte della strada); between = tra; on the corner = all'angolo.",
    "Errore tipico: «Turn to left» o «Turn at left» sono sbagliati; si dice «Turn left».",
    "Errore tipico: «Go street on» è sbagliato; si dice «Go straight on». street = strada, straight = dritto.",
    "Errore tipico: «Sorry me, where is the bank?» è sbagliato; si dice «Excuse me, where is the bank?».",
    "Quando qualcuno ti dice «Thank you», rispondi «You're welcome» (prego). «Please» si usa per chiedere qualcosa (per favore).",
    "Trucco: alza le due mani davanti a te con il dorso verso di te e apri pollice e indice: la mano che forma una L dritta è la sinistra (L = Left).",
    "«right» vuol dire anche «giusto»: That's right! = Esatto!",
    "left e right sono la sinistra e la destra di chi cammina: se sulla mappa l'omino scende verso il basso, la sua destra è la tua sinistra.",
]


def costruisci_items() -> list[dict]:
    items = []
    for k, f in FRASI.items():
        items.append({"id": f"frase_{k}", "tipo": "traduzione", "en": f["en"], "it": f["it"]})
    for pid, ops in LAB_POSTI:
        items.append({"id": f"lab1_{pid}", "tipo": "chiusa", "domanda": f"What is it? (icona: {DESCR_ICONA[pid]})",
                      "opzioni": [NOMI[o] for o in ops], "corretta": NOMI[pid]})
    for k, ok in LAB_FRECCE:
        items.append({"id": f"lab2_{k}", "tipo": "chiusa", "domanda": f"Ascolta la frase «{FRASI[k]['en']}» e scegli la freccia giusta.",
                      "opzioni": list(FRECCE.values()), "corretta": FRECCE[ok]})
    for n, (scena, frase, ok) in enumerate(LAB_DOVE, 1):
        items.append({"id": f"lab3_{n}", "tipo": "chiusa", "domanda": f"Scena: {scena} (* = il posto della frase). Completa: {frase}",
                      "opzioni": ["next to", "opposite", "between"], "corretta": ok})
    for n, (frase, ops, ok, aiuto) in enumerate(LAB_DIALOGO, 1):
        items.append({"id": f"lab4_{n}", "tipo": "chiusa", "domanda": f"Completa: {frase}" + (f" ({aiuto})" if aiuto else ""),
                      "opzioni": ops, "corretta": ok})
    for n, (frase, ok) in enumerate(SCHEDA_COMPLETA, 1):
        items.append({"id": f"scheda5_{n}", "tipo": "chiusa", "domanda": f"Completa: {frase}",
                      "opzioni": ["on", "next", "Excuse", "straight", "welcome"], "corretta": ok})
    for n, a in enumerate(AFFERMAZIONI, 1):
        items.append({"id": f"studio_{n}", "tipo": "affermazione", "testo": a})
    return items


def domande(item: dict) -> tuple[dict, dict]:
    if item["tipo"] == "traduzione":
        state = {"contesto": CONTESTO, "frase_inglese": item["en"], "traduzione_italiana": item["it"]}
        q = {
            "ok": {"type": "noul", "instructions": "La frase inglese è corretta e naturale E la traduzione italiana è giusta (anche se semplice)? No solo se c'è un errore vero."},
            "problema": {"type": "choice", "instructions": "Problema principale, se c'è.", "criteria": {
                "nessuno": "Tutto corretto", "inglese_errato": "Errore di inglese", "traduzione_errata": "Traduzione sbagliata o fuorviante",
                "innaturale": "Inglese corretto ma innaturale per un madrelingua"}},
        }
    elif item["tipo"] == "chiusa":
        state = {"contesto": CONTESTO, "domanda": item["domanda"], "opzioni": item["opzioni"], "risposta_dichiarata_corretta": item["corretta"]}
        q = {
            "ok": {"type": "noul", "instructions": "La risposta dichiarata corretta è giusta ED è l'unica opzione giusta fra quelle proposte?"},
            "problema": {"type": "choice", "instructions": "Problema principale, se c'è.", "criteria": {
                "nessuno": "Una sola risposta giusta, ed è quella dichiarata", "risposta_sbagliata": "La risposta dichiarata è sbagliata",
                "piu_risposte_giuste": "Anche un'altra opzione è accettabile", "ambigua": "La domanda è ambigua"}},
        }
    else:
        state = {"contesto": CONTESTO, "affermazione": item["testo"]}
        q = {
            "ok": {"type": "noul", "instructions": "L'affermazione didattica è vera al livello a cui è detta? Sì anche se semplificata. No se contiene un errore."},
            "problema": {"type": "choice", "instructions": "Problema principale, se c'è.", "criteria": {
                "nessuno": "Vera e adatta alla classe", "errore": "Contiene un errore di fatto o di lingua",
                "semplificazione_fuorviante": "Semplificata fino a diventare falsa"}},
        }
    return state, q


def chiedi(key: str, item: dict) -> dict:
    state, q = domande(item)
    for tentativo in range(3):
        t0 = time.perf_counter()
        try:
            r = requests.post(API, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                              json={"model": "jev-latest", "state": state, "questions": q}, timeout=90)
        except requests.RequestException as e:
            r = None
            err = str(e)
        if r is not None and r.status_code == 200:
            break
        time.sleep(2 + 3 * tentativo)
    out = {**item, "latency_ms": round((time.perf_counter() - t0) * 1000)}
    if r is None or r.status_code != 200:
        out["status"] = getattr(r, "status_code", None)
        out["error"] = (r.text[:300] if r is not None else err)
        return out
    body = r.json()
    ans = body.get("answers", {})
    out["status"] = 200
    out["model"] = body.get("model")
    out["ok"] = ans.get("ok", {}).get("noul")
    out["problema"] = ans.get("problema", {}).get("choice")
    out["problema_probs"] = ans.get("problema", {}).get("probabilities")
    return out


def da_rivedere(r: dict) -> bool:
    return r.get("status") != 200 or (r.get("problema") not in (None, "nessuno")) or (r.get("ok") is not None and r["ok"] < 0.55)


def main() -> None:
    key = get_typesafe_api_key()
    if not key:
        raise SystemExit("chiave typesafe assente")
    items = costruisci_items()
    solo = sys.argv[1:]
    if solo:
        items = [i for i in items if i["id"] in solo]
    print(f"items={len(items)}")
    with ThreadPoolExecutor(max_workers=6) as ex:
        results = list(ex.map(lambda it: chiedi(key, it), items))
    review = [r for r in results if da_rivedere(r)]
    for r in review:
        print(f"REVIEW {r['id']:22} ok={r.get('ok')} prob={r.get('problema')} {r.get('en') or r.get('domanda') or r.get('testo')}")
    if not solo:
        OUT.write_text(json.dumps({"items_checked": len(results), "review": review, "results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"ok_http={sum(1 for r in results if r.get('status') == 200)}/{len(results)} | review={len(review)}")


if __name__ == "__main__":
    main()
