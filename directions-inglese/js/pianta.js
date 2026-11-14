/* La pianta di Greenford: SORGENTE UNICA per il gioco (js/citta.js) e per il render (_blender_citta.py).
   Coordinate in px della pianta (100 px = 1 m in Blender). Tenere il blocco in JSON valido.
   X = strade verticali (i = 0..2), Y = strade orizzontali (j = 0..2), S = partenza davanti alla stazione.
   COL/RIG = bordi degli isolati: colonna c = 0..3, riga r = 0..3.
   isolati: "c,r" -> edifici in fila da ovest a est, con la facciata verso sud.
   semafori: incroci [i, j]. vie: v<i> verticali, h<j> orizzontali. */
window.PIANTA = {
  "X": [130, 320, 580],
  "Y": [150, 350, 550],
  "S": [320, 668],
  "COL": [[6, 107], [153, 297], [343, 557], [603, 694]],
  "RIG": [[6, 124], [176, 326], [374, 524], [576, 690]],
  "isolati": {
    "1,0": ["school"],
    "2,0": ["park"],
    "0,1": ["hospital"],
    "1,1": ["church", "library"],
    "2,1": ["bank", "cafe", "cinema"],
    "3,1": ["police"],
    "0,2": ["postoffice"],
    "1,2": ["supermarket", "bakery"],
    "2,2": ["pharmacy", "restaurant"],
    "1,3": ["hotel"]
  },
  "semafori": [[1, 2], [2, 1]],
  "vie": {
    "v0": "Green Street",
    "v1": "Station Road",
    "v2": "Market Street",
    "h0": "Park Road",
    "h1": "High Street",
    "h2": "King Street"
  }
};
