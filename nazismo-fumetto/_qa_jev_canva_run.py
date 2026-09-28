"""QA TypeSafe/Jev su slide Canva «Il Nazismo» (smoke one-shot)."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

OUT = Path(r"G:\Scuola\nazismo-fumetto\_qa_jev_canva_nazismo.json")
API = "https://api.typesafe.ai/v1/systemone"
CANVA = {
    "titolo": "Il Nazismo",
    "design_id": "DAGe-xaxEtU",
    "edit_url": "https://www.canva.com/d/CSGZIMt6736dOG0",
    "autore": "Prof. Rossano Bella",
}

# Affermazioni estratte dal testo Canva (get-design-content), raggruppate.
CLAIMS = [
    {
        "id": "crisi_1929_riparazioni",
        "sezione": "Ragioni ascesa",
        "testo": (
            "La crisi del 1929 e gli enormi risarcimenti chiesti dai vincitori "
            "della prima guerra mondiale portarono a una devastazione economica."
        ),
    },
    {
        "id": "inflazione_bambini",
        "sezione": "Ragioni ascesa",
        "testo": (
            "I bambini fanno pile di denaro, tanto era alta l’inflazione "
            "(il denaro non valeva niente). [Nella slide segue il discorso sulla crisi del 1929.]"
        ),
    },
    {
        "id": "weimar_imposta",
        "sezione": "Ragioni ascesa",
        "testo": (
            "La Repubblica di Weimar imposta dai vincitori della prima guerra "
            "mondiale (a Versailles) era formalmente democratica, ma debolissima."
        ),
    },
    {
        "id": "hitler_elezioni_democratiche",
        "sezione": "Presa del potere / vs Mussolini",
        "testo": (
            "Mussolini prende il potere con la Marcia su Roma, quasi un colpo di Stato. "
            "Hitler vince democraticamente le elezioni."
        ),
    },
    {
        "id": "hitler_imperatore",
        "sezione": "Presa del potere",
        "testo": (
            "Dopo le elezioni, Hitler smantella la democrazia: partito unico, "
            "repressione degli oppositori e potere concentrato. Hitler diventa "
            "praticamente un imperatore assoluto. Mussolini dovrà sempre mediare con il Re."
        ),
    },
    {
        "id": "lebensraum",
        "sezione": "Mein Kampf",
        "testo": (
            "Secondo Hitler la Germania doveva espandersi a Est per conquistare "
            "terre, risorse e dominio politico sull’Europa (Lebensraum / spazio vitale)."
        ),
    },
    {
        "id": "norimberga",
        "sezione": "Shoah",
        "testo": (
            "Con le leggi di Norimberga (1935) gli ebrei furono esclusi dalla vita "
            "pubblica: niente cittadinanza piena, matrimoni misti proibiti, "
            "discriminazione quotidiana."
        ),
    },
    {
        "id": "campi_distinzione",
        "sezione": "Shoah",
        "testo": (
            "Campi di sterminio (es. Auschwitz-Birkenau, Treblinka, Sobibor) creati "
            "per uccidere su larga scala, soprattutto in Polonia. Campi di "
            "concentramento (es. Dachau, primo grande campo in Germania) per "
            "prigionieri politici e «nemici» del regime, con altissima mortalità "
            "ma non solo camere a gas come scopo unico."
        ),
    },
    {
        "id": "dachau_prima",
        "sezione": "Shoah",
        "testo": (
            "Dachau fu il primo grande campo aperto in Germania, ancora prima "
            "della conquista nazista dell’Europa dell’Est."
        ),
    },
    {
        "id": "italia_neutrale_franco",
        "sezione": "Rapporti con Mussolini",
        "testo": (
            "L’Italia sarebbe potuta restare neutrale come ad esempio fece la "
            "Spagna di Franco. Ma dinanzi a una Germania che pareva invincibile, "
            "troppa era la tentazione per tirarsi indietro."
        ),
    },
]


def ask_claim(key: str, claim: dict) -> dict:
    state = {
        "contesto": (
            "Slide didattiche di storia per scuola secondaria sul Nazismo "
            "(1933-1945), a cura del Prof. Rossano Bella. Obiettivo: far capire "
            "ascesa, ideologia, Shoah e confronti con il fascismo italiano, "
            "senza falsificare i fatti."
        ),
        "sezione": claim["sezione"],
        "affermazione": claim["testo"],
    }
    payload = {
        "model": "jev-latest",
        "state": state,
        "questions": {
            "fattualmente_ok": {
                "type": "noul",
                "instructions": (
                    "L’affermazione in `affermazione` è storicamente accettabile "
                    "per una lezione di scuola secondaria? Sì se corretta o con "
                    "semplificazione didattica innocua. No se contiene un errore "
                    "di fatto, un anacronismo, o una formula che insegna qualcosa "
                    "di falso."
                ),
            },
            "semplificazione_rischiosa": {
                "type": "noul",
                "instructions": (
                    "Anche se non è un falso clamoroso, l’affermazione è una "
                    "semplificazione che rischia di far capire male agli studenti "
                    "(es. confondere date, cause, o meccanismi politici)?"
                ),
            },
            "gravita": {
                "type": "score",
                "instructions": "Quanto è grave il problema didattico, se c’è?",
                "criteria": [
                    "nessuno / solo stile",
                    "sfumatura da precisare in classe",
                    "errore o semplificazione da correggere nelle slide",
                ],
            },
            "problema": {
                "type": "choice",
                "instructions": "Tipo di problema principale, se c’è.",
                "criteria": {
                    "nessuno": "Affermazione solida per la scuola",
                    "errore_fatto": "Errore fattuale chiaro",
                    "anacronismo": "Date/eventi mescolati o fuori posto",
                    "semplificazione_fuorviante": "Troppo semplificata fino a essere fuorviante",
                    "iperbole": "Esagerazione retorica fuorviante",
                    "manca_contesto": "Vera ma senza un contesto essenziale",
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
        "id": claim["id"],
        "sezione": claim["sezione"],
        "testo": claim["testo"],
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
    out["fattualmente_ok"] = ans.get("fattualmente_ok", {}).get("noul")
    out["semplificazione_rischiosa"] = ans.get("semplificazione_rischiosa", {}).get("noul")
    grav = ans.get("gravita", {})
    out["gravita_score"] = grav.get("score")
    out["gravita_conf"] = grav.get("confidence")
    prob = ans.get("problema", {})
    out["problema"] = prob.get("choice")
    out["problema_conf"] = prob.get("confidence")
    out["problema_probs"] = prob.get("probabilities")
    return out


def main() -> None:
    key = get_typesafe_api_key()
    if not key:
        raise SystemExit("Chiave typesafe assente")
    results = []
    print(f"claims={len(CLAIMS)} design={CANVA['design_id']}")
    for i, claim in enumerate(CLAIMS):
        row = ask_claim(key, claim)
        results.append(row)
        flag = "REVIEW" if (
            row.get("status") != 200
            or (row.get("problema") and row["problema"] != "nessuno")
            or (row.get("fattualmente_ok") is not None and row["fattualmente_ok"] < 0.55)
            or (row.get("gravita_score") is not None and row["gravita_score"] >= 1.3)
        ) else "ok"
        print(
            f"[{i+1:02d}/{len(CLAIMS)}] {flag:6} "
            f"ok={row.get('fattualmente_ok')} "
            f"rischio={row.get('semplificazione_rischiosa')} "
            f"grav={row.get('gravita_score')} "
            f"prob={row.get('problema')} conf={row.get('problema_conf')} "
            f"— {claim['id']}"
        )

    hard = [
        r for r in results
        if r.get("status") != 200
        or (r.get("problema") and r["problema"] != "nessuno")
        or (r.get("fattualmente_ok") is not None and r["fattualmente_ok"] < 0.55)
        or (r.get("gravita_score") is not None and r["gravita_score"] >= 1.3)
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {"canva": CANVA, "results": results, "review": hard},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("---")
    print(f"ok_http={sum(1 for r in results if r.get('status')==200)}/{len(results)}")
    print(f"da_rivedere={len(hard)}")
    print(f"report={OUT}")
    for r in hard:
        print(f"  • {r['id']}: {r.get('problema')} (fattuale={r.get('fattualmente_ok')})")
        print(f"    {r['testo'][:120]}…")


if __name__ == "__main__":
    main()
