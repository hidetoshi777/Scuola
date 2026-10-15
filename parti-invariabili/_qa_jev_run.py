"""QA TypeSafe/Jev su quiz Parti invariabili (smoke one-shot)."""
from __future__ import annotations

import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

DATA = Path(r"G:\Scuola\parti-invariabili\js\data.js")
API = "https://api.typesafe.ai/v1/systemone"
OBIETTIVO = (
    "Le parti invariabili del discorso in italiano: avverbio, preposizione, "
    "congiunzione, interiezione — riconoscimento e distinzione per prima superiore."
)


def load_quiz() -> list[dict]:
    """Estrae proveGioco da data.js via Node (gestisce apostrofi tipografici)."""
    import subprocess

    script = (
        "const fs=require('fs');"
        f"const t=fs.readFileSync({json.dumps(str(DATA))},'utf8');"
        "const m=t.match(/proveGioco:\\s*(\\[[\\s\\S]*?\\n\\s*\\])/);"
        "if(!m){console.error('missing'); process.exit(1)}"
        "const arr=Function('return ('+m[1]+')')();"
        "process.stdout.write(JSON.stringify(arr));"
    )
    proc = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        raise SystemExit(f"estrazione quiz fallita: {proc.stderr[:400]}")
    return json.loads(proc.stdout)


def ask_item(key: str, item: dict, idx: int) -> dict:
    options = item["options"]
    correct = options[item["correct"]]
    state = {
        "obiettivo_lezione": OBIETTIVO,
        "domanda": item["q"],
        "opzioni": [{"indice": i, "testo": t} for i, t in enumerate(options)],
        "risposta_dichiarata_corretta": correct,
        "indice_corretto": item["correct"],
        "tag": item.get("tag"),
        "spiegazione_autore": item.get("explain"),
    }
    payload = {
        "model": "jev-latest",
        "state": state,
        "questions": {
            "unica_corretta": {
                "type": "noul",
                "instructions": (
                    "Tra le opzioni, la sola risposta grammaticalmente corretta "
                    "per la domanda è quella dichiarata in `risposta_dichiarata_corretta`? "
                    "No se un'altra opzione è altrettanto corretta, o se quella "
                    "dichiarata è sbagliata."
                ),
            },
            "distrattori_ok": {
                "type": "noul",
                "instructions": (
                    "I distrattori (opzioni diverse dalla corretta) sono sbagliati "
                    "ma plausibili per uno studente di prima superiore? "
                    "No se sono ovviamente assurdi, oppure se qualcuno è in realtà corretto."
                ),
            },
            "allineata": {
                "type": "noul",
                "instructions": (
                    "La domanda misura l'obiettivo in `obiettivo_lezione` "
                    "(riconoscere/distinguere le parti invariabili)?"
                ),
            },
            "difficolta": {
                "type": "score",
                "instructions": (
                    "Difficoltà per uno studente di prima superiore che ha appena "
                    "studiato le parti invariabili."
                ),
                "criteria": [
                    "facile: richiamo diretto di definizione o elenco",
                    "media: richiede riconoscimento in contesto",
                    "difficile: caso limite, omonimia o uso ambiguo",
                ],
            },
            "problema": {
                "type": "choice",
                "instructions": "Qual è il problema principale di questo item, se c'è?",
                "criteria": {
                    "nessuno": "Item solido, pronto per la classe",
                    "ambigua": "Più di una risposta difendibile",
                    "corretta_sbagliata": "La risposta dichiarata non è quella giusta",
                    "distrattori_deboli": "Distrattori troppo ovvi o fuorvianti male",
                    "fuori_obiettivo": "Non misura le parti invariabili",
                    "spiegazione_debole": "La spiegazione dell'autore è imprecisa o fuorviante",
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
    ms = (time.perf_counter() - t0) * 1000
    out = {
        "idx": idx,
        "q": item["q"],
        "correct": correct,
        "tag": item.get("tag"),
        "status": r.status_code,
        "latency_ms": round(ms),
    }
    if r.status_code != 200:
        out["error"] = r.text[:400]
        return out
    body = r.json()
    ans = body.get("answers", {})
    out["model"] = body.get("model")
    out["usage"] = body.get("usage")
    out["unica_corretta"] = ans.get("unica_corretta", {}).get("noul")
    out["distrattori_ok"] = ans.get("distrattori_ok", {}).get("noul")
    out["allineata"] = ans.get("allineata", {}).get("noul")
    diff = ans.get("difficolta", {})
    out["difficolta_score"] = diff.get("score")
    out["difficolta_conf"] = diff.get("confidence")
    prob = ans.get("problema", {})
    out["problema"] = prob.get("choice")
    out["problema_conf"] = prob.get("confidence")
    out["problema_probs"] = prob.get("probabilities")
    return out


def main() -> None:
    key = get_typesafe_api_key()
    if not key:
        raise SystemExit("Chiave typesafe assente")
    quiz = load_quiz()
    print(f"quiz_items={len(quiz)}")
    results: list[dict] = []
    # Sequenziale: evita 429 su account nuovo; pochi item.
    for i, item in enumerate(quiz):
        row = ask_item(key, item, i)
        results.append(row)
        flag = ""
        if row.get("status") != 200:
            flag = "ERR"
        elif (row.get("unica_corretta") or 1) < 0.7 or row.get("problema") not in (
            None,
            "nessuno",
        ):
            flag = "REVIEW"
        print(
            f"[{i+1:02d}/{len(quiz)}] {flag or 'ok':6} "
            f"unica={row.get('unica_corretta')} "
            f"distr={row.get('distrattori_ok')} "
            f"allin={row.get('allineata')} "
            f"diff={row.get('difficolta_score')} "
            f"prob={row.get('problema')} "
            f"({row.get('latency_ms')}ms) "
            f"{row['q'][:60]}"
        )

    review = [
        r
        for r in results
        if r.get("status") != 200
        or (r.get("unica_corretta") is not None and r["unica_corretta"] < 0.7)
        or (r.get("problema") and r["problema"] != "nessuno")
        or (r.get("allineata") is not None and r["allineata"] < 0.7)
        or (r.get("distrattori_ok") is not None and r["distrattori_ok"] < 0.7)
    ]
    out_path = Path(r"G:\Scuola\parti-invariabili\_qa_jev_quiz.json")
    out_path.write_text(
        json.dumps({"obiettivo": OBIETTIVO, "results": results, "review": review}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("---")
    print(f"ok_http={sum(1 for r in results if r.get('status')==200)}/{len(results)}")
    print(f"da_rivedere={len(review)}")
    print(f"report={out_path}")
    for r in review:
        print(
            f"  REVIEW #{r['idx']+1}: problema={r.get('problema')} "
            f"unica={r.get('unica_corretta')} — {r['q']}"
        )


if __name__ == "__main__":
    main()
