"""QA TypeSafe/Jev su contenuti, fumetto e 8 FAQ «Da Luigi XIV all'Illuminismo» (IV AM)."""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import requests

TS_ROOT = Path(r"G:\Bot di Trading\trading_system")
sys.path.insert(0, str(TS_ROOT))
from config.config_secret import get_typesafe_api_key  # noqa: E402

OUT = Path(r"G:\Scuola\illuminismo\_qa_jev_illuminismo.json")
API = "https://api.typesafe.ai/v1/systemone"

ITEMS = [
    {
        "id": "faq_1_luigi_xiv",
        "tipo": "FAQ + Video + Fumetto Tavola 1",
        "domanda": "Chi era Luigi XIV e perché si chiamava Re Sole?",
        "testo": (
            "È il re di Francia (1643–1715) simbolo della monarchia assoluta: scelse il sole come emblema "
            "perché tutta la corte e lo Stato dovevano ruotare attorno a lui. Governava per diritto divino "
            "concentrando leggi, tasse ed esercito senza convocare gli Stati Generali (gli è attribuito il motto "
            "«Lo Stato sono io») e trattenne l’alta nobiltà nella reggia di Versailles per toglierle peso politico."
        ),
    },
    {
        "id": "faq_2_tre_ordini",
        "tipo": "FAQ + Video Slide 3 + Tavola 2",
        "domanda": "Com’era divisa la società nell’Antico Regime?",
        "testo": (
            "In tre ordini disuguali: 1° Clero e 2° Nobiltà (circa il 2%, hanno privilegi e non pagano tasse); "
            "3° Terzo Stato (circa il 98%: contadini, artigiani e borghesi come medici, avvocati e mercanti), "
            "che lavora e paga tutte le tasse senza poter decidere."
        ),
    },
    {
        "id": "faq_3_illuminismo_kant",
        "tipo": "FAQ + Video Slide 4 + Tavola 2",
        "domanda": "Che cos’è l’Illuminismo e cosa dice Kant?",
        "testo": (
            "È un movimento culturale del Settecento che vede nella ragione umana una luce («lume») "
            "per combattere ignoranza, superstizioni e privilegi. Immanuel Kant (1784) lo riassume "
            "nel motto «Sapere aude»: abbi il coraggio di servirti della tua propria intelligenza."
        ),
    },
    {
        "id": "faq_4_enciclopedia",
        "tipo": "FAQ + Video Slide 5 + Tavola 2",
        "domanda": "Cos’è l’Enciclopedia e dove circolavano le idee?",
        "testo": (
            "Opera in 28 volumi diretta da Diderot e d’Alembert (1751–1772): raccoglie scienza, filosofia "
            "e anche disegni sui mestieri pratici e sulle macchine, dando dignità al lavoro tecnico nonostante "
            "la censura. Le idee circolano nei salotti, nei caffè e sui primi giornali (opinione pubblica)."
        ),
    },
    {
        "id": "faq_5_montesquieu",
        "tipo": "FAQ + Video Slide 6 + Tavola 3",
        "domanda": "Che cosa propone Montesquieu contro la tirannia?",
        "testo": (
            "Ne Lo spirito delle leggi (1748) propone la separazione dei tre poteri: il potere legislativo "
            "(Parlamento, fa le leggi), il potere esecutivo (Governo, le applica) e il potere giudiziario "
            "(Giudici, puniscono chi le viola) devono restare separati per evitare che una sola persona diventi tiranno."
        ),
    },
    {
        "id": "faq_6_voltaire_rousseau",
        "tipo": "FAQ + Video Slide 7 + Tavola 3",
        "domanda": "Cosa difendono Voltaire e Jean-Jacques Rousseau?",
        "testo": (
            "Voltaire (Trattato sulla tolleranza, 1763) combatte il fanatismo e chiede tolleranza religiosa e "
            "libertà di parola. Jean-Jacques Rousseau (Il contratto sociale, 1762) afferma che la sovranità "
            "appartiene al popolo e tutti i cittadini nascono uguali davanti alla legge."
        ),
    },
    {
        "id": "faq_7_beccaria",
        "tipo": "FAQ + Video Slide 7 + Tavola 4",
        "domanda": "Perché Cesare Beccaria è famoso in tutto il mondo?",
        "testo": (
            "A Milano, nel libro Dei delitti e delle pene (1764), chiede di abolire la tortura e la pena di morte: "
            "le pene devono essere certe, giuste, rapide e proporzionate al reato per prevenire i crimini, non "
            "essere una vendetta crudele."
        ),
    },
    {
        "id": "faq_8_toscana_rivoluzioni",
        "tipo": "FAQ + Video Slide 8 + Tavola 4",
        "domanda": "Quale Stato applicò per primo Beccaria nel 1786?",
        "testo": (
            "Il Granducato di Toscana, il 30 novembre 1786, con il codice del granduca Pietro Leopoldo (Codice leopoldino): "
            "fu il primo Stato al mondo ad abolire per legge sia la tortura sia la pena di morte. Le idee illuministe "
            "ispirarono anche la Rivoluzione americana (1776) e, poco dopo la riforma toscana, la Rivoluzione francese "
            "(1789), con la Dichiarazione dei diritti dell’uomo e del cittadino."
        ),
    },
]


def ask_item(key: str, item: dict) -> dict:
    state = {
        "contesto": (
            "Lezione di storia per classe quarta professionale (livello chiaro, frasi brevi) "
            "sul tema «Da Luigi XIV all'Illuminismo», a cura del Prof. Rossano Bella. "
            "Obiettivo: spiegare il passaggio dall'assolutismo ai Lumi senza falsificare i fatti storici."
        ),
        "sezione": item["tipo"],
        "domanda": item["domanda"],
        "affermazione": item["testo"],
    }
    payload = {
        "model": "jev-latest",
        "state": state,
        "questions": {
            "fattualmente_ok": {
                "type": "noul",
                "instructions": (
                    "L’affermazione/risposta in `affermazione` è storicamente corretta "
                    "e coerente con `domanda` per una classe quarta di scuola superiore professionale? "
                    "Sì se è vera o se è una semplificazione didattica innocua. No se contiene "
                    "un errore di fatto, date sbagliate, attribuzioni errate o concetti falsi."
                ),
            },
            "semplificazione_rischiosa": {
                "type": "noul",
                "instructions": (
                    "L’affermazione è una semplificazione così eccessiva da rischiare di insegnare "
                    "qualcosa di fuorviante o anacronistico (es. confondere regno di Luigi XIV "
                    "e Illuminismo del ’700, date sbagliate, leggi inesistenti)?"
                ),
            },
            "gravita": {
                "type": "score",
                "instructions": "Quanto è grave l’eventuale problema storico/didattico?",
                "criteria": [
                    "nessuno / solo sintesi appropriata alla classe",
                    "sfumatura minore che può restare in quarta professionale",
                    "errore fattuale o data/concetto da correggere prima di pubblicare",
                ],
            },
            "problema": {
                "type": "choice",
                "instructions": "Classifica il problema principale, se esiste.",
                "criteria": {
                    "nessuno": "Contenuto storicamente solido e adatto alla classe",
                    "errore_fatto": "Errore fattuale o data/autore sbagliato",
                    "anacronismo": "Date o periodi mescolati in modo fuorviante",
                    "semplificazione_fuorviante": "Semplificato fino a risultare falso",
                    "incoerente_domanda": "La risposta non risponde alla domanda",
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
        "id": item["id"],
        "tipo": item["tipo"],
        "domanda": item["domanda"],
        "testo": item["testo"],
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
    results: list[dict] = []
    print(f"items={len(ITEMS)}")
    for idx, item in enumerate(ITEMS, 1):
        row = ask_item(key, item)
        results.append(row)
        flag = "REVIEW" if (
            row.get("status") != 200
            or (row.get("problema") and row["problema"] != "nessuno")
            or (row.get("fattualmente_ok") is not None and row["fattualmente_ok"] < 0.55)
            or (row.get("gravita_score") is not None and row["gravita_score"] >= 1.3)
        ) else "ok"
        print(
            f"[{idx:02d}/{len(ITEMS)}] {flag:6} ok={row.get('fattualmente_ok')} "
            f"rischio={row.get('semplificazione_rischiosa')} "
            f"grav={row.get('gravita_score')} prob={row.get('problema')} "
            f"({row.get('latency_ms')}ms) {item['id']}"
        )

    review = [
        r for r in results
        if r.get("status") != 200
        or (r.get("problema") and r["problema"] != "nessuno")
        or (r.get("fattualmente_ok") is not None and r["fattualmente_ok"] < 0.55)
        or (r.get("gravita_score") is not None and r["gravita_score"] >= 1.3)
    ]
    OUT.write_text(
        json.dumps({"items_checked": len(results), "review": review, "results": results}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Report saved to {OUT} | ok_http={sum(1 for r in results if r.get('status')==200)}/{len(results)} | review={len(review)}")


if __name__ == "__main__":
    main()
