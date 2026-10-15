"""QA TypeSafe/Jev sul minigioco del tester (Meucci 3 AM · Circuito interrotto)."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

API = "https://api.typesafe.ai/v1/systemone"
HERE = Path(__file__).resolve().parent
OBIETTIVO = (
    "Terza professionale (manutenzione, livello base): provare un fusibile col tester "
    "in sicurezza. Tensione staccata, multimetro in prova di continuità (Ω con cicalino), "
    "puntali sui due capi metallici, lettura OL = circuito aperto = fusibile interrotto; "
    "fusibile buono = il tester suona e segna un valore vicino a 0 Ω."
)

ITEMS = [
    {
        "q": "La corrente è staccata. Su che funzione giri la manopola del tester per provare il fusibile?",
        "options": ["OFF (spento)", "V~ (tensione)", "A (corrente)", "Ω 🔊 (continuità)"],
        "correct": 3,
        "spiegazioni": {
            "OFF (spento)": "Così il tester è spento: non misura niente. Gira la manopola su una funzione.",
            "V~ (tensione)": "Con V~ misuri la tensione: serve per controllare che la corrente sia davvero "
            "staccata. Per sapere se il fusibile è interrotto serve la prova di continuità: Ω 🔊.",
            "A (corrente)": "Con A misuri la corrente, con il circuito acceso. Il fusibile si prova a "
            "corrente staccata, con la continuità: Ω 🔊.",
            "Ω 🔊 (continuità)": "Giusto! Ω 🔊 è la prova di continuità: se il circuito è chiuso, il tester suona.",
        },
    },
    {
        "q": "Il tester (in prova di continuità, puntali sui due capi del fusibile) segna OL e non suona. "
        "Che cosa vuol dire?",
        "options": [
            "Il fusibile è interrotto: il filo dentro si è bruciato.",
            "Il fusibile è buono: la corrente passa.",
            "Il tester è rotto.",
        ],
        "correct": 0,
        "spiegazioni": {
            "Il fusibile è interrotto: il filo dentro si è bruciato.": "Esatto. OL vuol dire circuito aperto: "
            "la corrente non passa. Il fusibile va cambiato.",
            "Il fusibile è buono: la corrente passa.": "No: se la corrente passasse, il tester suonerebbe e "
            "segnerebbe un numero vicino a 0.",
            "Il tester è rotto.": "Il tester funziona: OL vuol dire che fra i due puntali il circuito è aperto.",
        },
        "finale": "Col fusibile nuovo: il tester suona e segna 0.2 Ω, quasi 0: il circuito è chiuso.",
    },
]


def ask_item(key: str, item: dict, idx: int) -> dict:
    options = item["options"]
    state = {
        "obiettivo_lezione": OBIETTIVO,
        "domanda": item["q"],
        "opzioni": [{"indice": i, "testo": t} for i, t in enumerate(options)],
        "risposta_dichiarata_corretta": options[item["correct"]],
        "spiegazioni_mostrate_allo_studente": item["spiegazioni"],
        "testo_successivo": item.get("finale"),
    }
    payload = {
        "model": "jev-latest",
        "state": state,
        "questions": {
            "unica_corretta": {
                "type": "noul",
                "instructions": (
                    "Tra le opzioni, la sola risposta tecnicamente corretta è quella in "
                    "`risposta_dichiarata_corretta`? No se un'altra opzione è altrettanto corretta "
                    "o se quella dichiarata è sbagliata."
                ),
            },
            "spiegazioni_vere": {
                "type": "noul",
                "instructions": (
                    "Tutte le frasi in `spiegazioni_mostrate_allo_studente` (e `testo_successivo`, se c'è) "
                    "sono vere, al livello semplificato a cui sono dette per una terza professionale? "
                    "Una semplificazione vera va bene; rispondi No solo se c'è un'affermazione falsa "
                    "o che contraddice la risposta corretta."
                ),
            },
            "distrattori_ok": {
                "type": "noul",
                "instructions": "I distrattori sono sbagliati ma plausibili per uno studente di terza professionale?",
            },
            "allineata": {
                "type": "noul",
                "instructions": "La domanda misura l'obiettivo in `obiettivo_lezione`?",
            },
            "problema": {
                "type": "choice",
                "instructions": "Qual è il problema principale di questo item, se c'è?",
                "criteria": {
                    "nessuno": "Item solido, pronto per la classe",
                    "ambigua": "Più di una risposta difendibile",
                    "corretta_sbagliata": "La risposta dichiarata non è quella giusta",
                    "spiegazione_falsa": "Una spiegazione contiene un'affermazione falsa",
                    "distrattori_deboli": "Distrattori troppo ovvi",
                    "fuori_obiettivo": "Non misura l'obiettivo",
                },
            },
        },
    }
    t0 = time.perf_counter()
    r = requests.post(
        API,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=90,
    )
    out = {"idx": idx, "q": item["q"], "status": r.status_code, "latency_ms": round((time.perf_counter() - t0) * 1000)}
    if r.status_code != 200:
        out["error"] = r.text[:400]
        return out
    body = r.json()
    ans = body.get("answers", {})
    out["model"] = body.get("model")
    for k in ("unica_corretta", "spiegazioni_vere", "distrattori_ok", "allineata"):
        out[k] = ans.get(k, {}).get("noul")
    prob = ans.get("problema", {})
    out["problema"] = prob.get("choice")
    out["problema_conf"] = prob.get("confidence")
    out["problema_probs"] = prob.get("probabilities")
    return out


def main() -> None:
    key = get_typesafe_api_key()
    if not key:
        raise SystemExit("Chiave typesafe assente")
    results = [ask_item(key, it, i) for i, it in enumerate(ITEMS)]
    review = [
        r for r in results
        if r.get("status") != 200
        or any((r.get(k) is not None and r[k] < 0.7) for k in ("unica_corretta", "spiegazioni_vere", "allineata"))
        or (r.get("problema") and r["problema"] != "nessuno")
    ]
    for r in results:
        print(
            f"#{r['idx']+1} http={r['status']} unica={r.get('unica_corretta')} vere={r.get('spiegazioni_vere')} "
            f"distr={r.get('distrattori_ok')} allin={r.get('allineata')} prob={r.get('problema')} "
            f"({r.get('problema_conf')}) model={r.get('model')}"
        )
    out_path = HERE / "_qa_jev_minigioco.json"
    out_path.write_text(
        json.dumps({"obiettivo": OBIETTIVO, "items": ITEMS, "results": results, "review": review},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"da_rivedere={len(review)} report={out_path}")


if __name__ == "__main__":
    main()
