"""QA TypeSafe/Jev su quiz Manzoni · Promessi sposi (smoke one-shot)."""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

DATA = Path(r"G:\Scuola\manzoni-promessi\js\data.js")
OUT = Path(r"G:\Scuola\manzoni-promessi\_qa_jev_quiz.json")
API = "https://api.typesafe.ai/v1/systemone"
OBIETTIVO = (
    "Alessandro Manzoni: lingua (fiorentino, risciacquatura in Arno), opere "
    "(Cinque Maggio, Marzo 1821, Promessi Sposi), romanzo storico, Provvidenza, "
    "personaggi — livello scuola superiore, allineato alle slide del Prof."
)


def load_quiz() -> list[dict]:
    script = (
        "const fs=require('fs');"
        f"const t=fs.readFileSync({json.dumps(str(DATA))},'utf8');"
        "const m=t.match(/quiz:\\s*(\\[[\\s\\S]*?\\n\\s*\\])/);"
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
    options = item["choices"]
    correct = options[item["correct"]]
    state = {
        "obiettivo_lezione": OBIETTIVO,
        "domanda": item["q"],
        "opzioni": [{"indice": i, "testo": t} for i, t in enumerate(options)],
        "risposta_dichiarata_corretta": correct,
        "indice_corretto": item["correct"],
        "tema": item.get("tema"),
    }
    payload = {
        "model": "jev-latest",
        "state": state,
        "questions": {
            "unica_corretta": {
                "type": "noul",
                "instructions": (
                    "Tra le opzioni, la sola risposta storicamente/letterariamente "
                    "corretta per la domanda (secondo la didattica italiana su Manzoni) "
                    "è quella in `risposta_dichiarata_corretta`? "
                    "No se un'altra opzione è altrettanto corretta, o se quella "
                    "dichiarata è sbagliata o troppo semplificata fino a essere falsa."
                ),
            },
            "distrattori_ok": {
                "type": "noul",
                "instructions": (
                    "I distrattori sono sbagliati ma plausibili per uno studente "
                    "delle superiori? No se sono ovviamente assurdi, oppure se "
                    "qualcuno è in realtà corretto."
                ),
            },
            "allineata": {
                "type": "noul",
                "instructions": (
                    "La domanda misura l'obiettivo in `obiettivo_lezione` "
                    "(Manzoni: lingua, opere, romanzo, Provvidenza, personaggi)?"
                ),
            },
            "difficolta": {
                "type": "score",
                "instructions": (
                    "Difficoltà per uno studente delle superiori che ha seguito "
                    "le slide su Manzoni."
                ),
                "criteria": [
                    "facile: richiamo diretto di fatto o definizione",
                    "media: richiede collegamento tra concetti",
                    "difficile: sfumatura critica o caso limite",
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
                    "fuori_obiettivo": "Non misura Manzoni / le slide",
                    "semplificazione_fuorviante": (
                        "La corretta è una semplificazione didattica che rischia "
                        "di essere storicamente o letterariamente falsa"
                    ),
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
        "tema": item.get("tema"),
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
    for i, item in enumerate(quiz):
        row = ask_item(key, item, i)
        results.append(row)
        flag = "REVIEW" if (
            row.get("status") != 200
            or (row.get("problema") and row["problema"] != "nessuno")
        ) else "ok"
        print(
            f"[{i+1:02d}/{len(quiz)}] {flag:6} "
            f"unica={row.get('unica_corretta')} "
            f"distr={row.get('distrattori_ok')} "
            f"allin={row.get('allineata')} "
            f"diff={row.get('difficolta_score')} "
            f"prob={row.get('problema')} "
            f"({row.get('latency_ms')}ms) "
            f"{row['q'][:64]}"
        )

    hard = [
        r for r in results
        if r.get("status") != 200 or (r.get("problema") and r["problema"] != "nessuno")
    ]
    OUT.write_text(
        json.dumps(
            {"obiettivo": OBIETTIVO, "results": results, "review": hard},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("---")
    print(f"ok_http={sum(1 for r in results if r.get('status')==200)}/{len(results)}")
    print(f"problemi_espliciti={len(hard)}")
    print(f"report={OUT}")
    for r in hard:
        print(
            f"  REVIEW #{r['idx']+1}: problema={r.get('problema')} "
            f"conf={r.get('problema_conf')} unica={r.get('unica_corretta')} — {r['q']}"
        )


if __name__ == "__main__":
    main()
