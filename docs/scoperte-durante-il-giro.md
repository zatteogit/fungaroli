# Funghi al centro, scoperte durante il giro

La home sceglie un’uscita a funghi. Piante, frutti e alberi sono suggerimenti secondari, mai un secondo indice della zona: non modificano la scelta del luogo, del giorno, del sentiero o l’indice dei funghi. Il catalogo e la ricerca botanica restano in **Scopri**, con alias compatibili per gli indirizzi precedenti.

`js/outing-discoveries.js` usa i campioni e l’indice delle categorie del tracciato scelto. Se esiste un tracciato ma non ha campioni, non ripiega su ambienti diversi della zona. Soltanto in assenza del tracciato usa i campioni della zona, dichiarando questo ambito. Sono richiesti almeno tre campioni validi. Non sono inventate concentrazioni o presenze di piante.

Per i dieci profili botanici documentati rimangono i calendari della parte utile, i fattori di ambiente e quota, il contesto meteo disponibile e le eventuali note private abilitate. La graduatoria resta sperimentale, senza parametri di maturazione inventati per i frutti. I dati climatici mancanti restano mancanti. La graduatoria secondaria usa la data dell’uscita e favorisce il calendario indicativo; non rappresenta una probabilità. Per le altre piante il suggerimento usa soltanto la compatibilità cartografica esplicitamente dichiarata e il calendario di **fioritura**, mai trasformato in calendario di raccolta. Le specie pericolose restano nel catalogo e nei confronti, escluse dai suggerimenti.

Il blocco mostra al massimo due piante e un albero associato alla categoria dominante. La scheda contestuale è lo stesso renderer della pagina, aperto in modale senza cambiare rotta; conserva zona e riferimenti per l’appunto nel taccuino. I suggerimenti e le note sono facoltativi.

## Cataloghi e immagini, 13 ottobre 2026

- 54 piante: 19 con usi alimentari documentati, 17 da osservare, 15 tossiche e 3 mortali. È un catalogo regionale rappresentativo, non tutta la flora.
- 30 alberi. Quote qualitative quando mancano limiti numerici, nessuna associazione micorrizica aggiunta a intuito.
- 162 fotografie botaniche e 27 nuove fotografie per nove alberi: originali singoli, autori e licenze nelle schede. Le copertine dei dodici collage sono sostituite. Fonti botaniche: Dryades, Università di Trieste; colchico: fotografie di Réginald Hulhoven con licenze Commons verificate.
- 44 fotografie per le 22 specie aggiuntive di funghi: iNaturalist research grade, comunità tassonomica concordante, CC BY 4.0 o CC0. Questa qualifica non è una certificazione micologica. Gallerie, miniature e zoom sono distinti. Hygrophorus latitabundus è documentato sotto il nome H. limacinus della fonte, con il riferimento alla revisione di Bellanger et al. (2021). Morchella rimane s.l.

Le informazioni bibliografiche, i nomi della fonte, le attribuzioni e le licenze consultabili sono conservati in `data/plants.json`, `data/trees.json`, `data/media.json` e `data/media-trees.json`.

## Testi e avvisi

Le 61 schede di funghi e sosia descrivono caratteri e rischi: nessuna istruzione «scarta se…», nessun verdetto a partire da un singolo carattere. Le osservazioni non sono una checklist da completare per confermare la specie. Le indicazioni culinarie riguardano il raccolto già controllato; leggi ed emergenze rimangono esplicite.

Un avviso con al massimo due punti e complessivamente 320 caratteri rimane un riquadro statico visibile. Gli avvisi più lunghi usano l’accordion. Per il cortinario rubello i danni renali sono associati all’orellanina della specie, non a tutti i funghi di colore fulvo. Riferimento sanitario: [ISSalute, Intossicazione da funghi](https://www.issalute.it/index.php/la-salute-dalla-a-alla-z-menu/i/intossicazione-da-funghi).

Gli aggiornamenti CMS del repository sostituiscono soltanto documenti iniziali non modificati o precedenti aggiornamenti gestiti dal repository. Bozze e pubblicazioni degli autori restano protette; confronto del payload e della versione evita sovrascritture concorrenti. Revisioni precedenti e audit sono conservati.
