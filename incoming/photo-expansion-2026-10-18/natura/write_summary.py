import json,collections,hashlib,sys
from pathlib import Path
B=Path(__file__).resolve().parent;M=json.load(open(B/'manifest.json'));P=M['photos'];groups=collections.Counter(p['target_group']for p in P);sources=collections.Counter(p['source']for p in P);frozen='--frozen'in sys.argv
state='Manifest congelato. Acquisizione e preparazione concluse; nessun processo autonomo di acquisizione attivo.'if frozen else'Manifest cumulativo in preparazione: si stanno revisionando gli ultimi file della coda centrale. Nessun downloader autonomo è attivo.'
s=f'''# Fotografie Natura · 18–19 ottobre 2026

{state}

Il bundle contiene **{len(P)} fotografie distinte approvate**, con **{len(P)*3} WebP** tra formato normale, HD e miniatura. I derivati e le candidature non vengono contati come fotografie aggiuntive.

| Categoria | Nuove fotografie approvate |
|---|---:|
| Animali | {groups['animals']} |
| Piante | {groups['plants']} |
| Alberi | {groups['trees']} |

Le 18 schede Animali pubblicabili ricevono almeno una foto. Nove delle dieci Piante più povere passano da due a sei foto; il giglio rosso passa da due a quattro. Il catalogo canonico, il renderer, l’importazione, il CMS e la pubblicazione restano responsabilità del parent: questo agente ha modificato soltanto il bundle `natura/`.

## Fonti e accesso

- **Università di Trieste / Dryades:** {sources['Università di Trieste · Dryades']} fotografie approvate su 41 originali acquisiti. Pagine HTML conservate, autore e licenza CC BY-SA 4.0 verificati per ogni immagine, `sourceCaption` individuale preservata. Richieste seriali distanziate di almeno tre secondi per host, senza errori di accesso.
- **Wikimedia Commons:** {sources['Wikimedia Commons']} fotografie approvate. API e dominio delle immagini accessibili. Il primo tentativo parallelo incontrò HTTP 429 e fu arrestato; il parent ha poi gestito la ripresa mediante una coda globale seriale. Nessuna modifica di host, proxy, UA o query per aggirare il limite. Le 84 candidature hanno extmetadata completi in `commons-extmetadata.json`; il credito richiesto in `Attribution` è conservato in `attribution_required_text` e usato nell’attribuzione finale.
- **iNaturalist:** {sources['iNaturalist (research grade)']} fotografie approvate su quattro originali da osservazioni research-grade. Restano il gruppo di api e la pupa di Episyrphus balteatus, la cui fase è attestata dalle annotazioni e dalla descrizione della successiva schiusa. Conservati JSON integrali, taxon, `observation_id`, `photo_id`, autore e licenza della singola foto. Il processo è stato chiuso dopo il coordinamento degli slot; non resta sospeso in background.

Il SHA-1 degli originali Commons è confrontato con l’API. Per Dryades e iNaturalist SHA-1 e SHA-256 sono calcolati sui byte ricevuti, senza presentarli come checksum forniti dal sito.

## Gestione del colore

Sette originali approvati hanno un profilo non sRGB: cinque Adobe RGB (1998), uno ROMM/ProPhoto e uno SyncMaster. I 21 derivati di queste foto sono stati rigenerati tramite ImageCms, convertendo a sRGB prima di rimuovere i metadati. Riferimento convertito, WebP normale, HD e miniatura sono stati confrontati visivamente in `color-reviewed-exports.jpg`. Gli originali restano identici. Un ottavo originale non sRGB riguarda una cetonia esclusa e non produce asset approvati. Le immagini prive di ICC sono interpretate come RGB sRGB standard; il campo `color_conversion` distingue questo caso dalla conversione effettiva.

## Scelte editoriali e tassonomia

Ogni gruppo Animali mostra una specie esempio dichiarata sia nella didascalia sia nel testo alternativo. Gli adulti precedono la pupa del sirfide; la singola ape precede la fotografia del gruppo. Le foto di lupi e giovane cinghiale riportano i parchi faunistici quando attestati dalla fonte. Nessuna presenza nel Reatino o sui sentieri viene dedotta.

`taxon-audit.json` documenta le 15 pagine istituzionali Dryades. Il giglio rosso è attestato esattamente come *Lilium bulbiferum* subsp. *croceum* nel titolo della pagina. La fonte scrive *Narcissus poëticus* con dieresi; il catalogo usa *Narcissus poeticus*. La fonte di *Orchis mascula* è alla sottospecie nominale, compatibile con la scheda alla specie. `photo_taxon` e `source_taxon` conservano il nome dichiarato dalla fonte. Gli alberi a sottospecie non attestata restano esclusi.

I rigetti conservano originali e motivazioni: collage, fotografia plurima ambigua, possibile preparato, soggetto piccolo o nascosto, nitidezza insufficiente, viste troppo simili e limite editoriale di sei foto per pianta. Sono esclusi anche i suini maculati/possibili ibridi del parcheggio, benché iNaturalist dichiarasse Sus scrofa research-grade; il Papilio iNaturalist poco nitido è stato respinto nella revisione indipendente del parent. La foto di Aesculus è un focus stack di 15 scatti dichiarato dalla fonte, non una generazione AI.

## File di consegna e revisione

- `manifest.json`: soltanto fotografie approvate, metadati, crediti, modifiche, originali, hash, tre derivati e posizioni nei sei formati.
- `verification.json`: dimensioni, peso, SHA-256 e assenza di EXIF/XMP dei WebP.
- `original-review-*.jpg`, `dryades-original-review-*.jpg`, `inat-original-review-*.jpg`: tavole degli originali osservati realmente.
- `external-crop-review-*.jpg`: originale e sei ritagli effettivi per ogni foto; i punti sono stati corretti quando nascondevano fiore, testa o muso. Il visore deve offrire la foto completa, poiché un formato molto largo o stretto può mostrare soltanto parte del soggetto.
- `plant-gallery-review-*.jpg`: le dieci gallerie finali, con le foto preesistenti affiancate alle nuove; limite di sei rispettato.
- `duplicate-probe.json`: controllo dHash circoscritto alle foto botaniche/arboree già canoniche, seguito dal confronto visivo delle gallerie. Un hash differente non viene trattato da solo come prova di uno scatto indipendente.
- `source-rejections.json` e i rigetti del manifest: audit delle esclusioni, distinto dalle immagini approvate.

Nessuna suite di test, dry-run, installazione, importazione canonica o pubblicazione è stata avviata da questo agente.
'''
(B/'README.md').write_text(s)
summary=dict(status='frozen'if frozen else'preparing',approved_photographs=len(P),approved_derivatives=len(P)*3,by_group=dict(groups),by_source=dict(sources),animal_records_covered=len({p['target_key']for p in P if p['target_group']=='animals'}),plant_records_covered=len({p['target_key']for p in P if p['target_group']=='plants'}),tree_records_covered=len({p['target_key']for p in P if p['target_group']=='trees'}),rejected_acquired=len(M['rejected']),non_sRGB_approved=sum(c.get('color_conversion')=='ICC_to_sRGB'for c in P),converted_derivatives=3*sum(c.get('color_conversion')=='ICC_to_sRGB'for c in P),manifest_sha256=hashlib.sha256((B/'manifest.json').read_bytes()).hexdigest(),agent_modified_canonical=False,agent_started_test_suites=False,agent_autonomous_downloader_active=False)
(B/'SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(summary)
