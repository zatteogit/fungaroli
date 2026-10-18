# Schema dati · ipotesi interna

Non è uno schema CMS implementato. Prima di adottarlo occorre verificare compatibilità con contenuti, media, ricerca e snapshot attuali. Un catalogo animale non può essere ottenuto rinominando `stem_ring` o riutilizzando le classi di tossicità dei funghi.

## Unità editoriale e tassonomia

Ogni voce ha un `id` stabile; `entry_kind` distingue `taxon` da `editorial_group`. Per un taxon: nome accettato, rango, riferimento tassonomico/versione, sinonimi. Per un gruppo: definizione editoriale, criteri d’inclusione e taxa membri quando verificati. Non rappresentare «farfalle diurne» come specie o «api solitarie» come taxon unico.

Un fatto si riferisce sempre al suo soggetto effettivo, eventualmente più ampio della scheda. La cautela ISS per «api/vespe/calabroni» non dimostra un carattere diagnostico di *Vespa crabro*. I gruppi editoriali possono sovrapporsi; evitare doppio conteggio nei risultati e dichiarare la gerarchia.

## Provenienza per campo

Ogni valore pubblicabile è una `claim` con `claim_id`, valore tipizzato, unità, stadio/sesso/casta pertinenti, riferimenti a fonti e localizzatore (sezione/pagina), ambito geografico, date di consultazione/verifica, eventuale data di fine validità, stato e revisore. Distinguere `verified_source` (la fonte dice questo) da `expert_reviewed` (il contenuto è stato anche validato per uso nell’app). Una fonte letta non equivale ad approvazione clinica.

`null` = non documentato. Array vuoto = nessun elemento nel dataset, non prova biologica di assenza. Valore `false` soltanto se la fonte sostiene esplicitamente l’assenza nel soggetto e stadio considerati. Inferenze editoriali in campi separati non pubblicati come dati.

| Area | Campi proposti | Vincoli |
|---|---|---|
| Nomi | `common_names`, `scientific_name`, `synonyms`, `taxon_reference`, `rank` | Nome comune non sempre univoco; sinonimi ricercabili |
| Raggruppamenti | `entry_kind`, `editorial_definition`, `member_taxa`, `themes` | Temi osservazione/convivenza combinabili, nessuna classe di pericolosità |
| Caratteri | `traits[]` con `field`, `values[]`, `stage`, `sex`, `caste`, `variability` | Vocabolari per gruppo: ali/antenne/corpo/pelliccia/piumaggio; non tutto applicabile a tutti |
| Misure | `body_measurements[]`: tipo, intervallo, unità, stadio | Corpo esclusi arti diverso da apertura alare; mai «Dimensione» senza parte misurata |
| Osservazione | `observable_cues[]`, `behaviours[]`, `traces[]` | Carattere osservabile diverso da prova identificativa; tracce con confondenti documentati |
| Ambiente | `habitats[]`, `distribution_records[]` | Area nominata e fonte; una presenza storica non è una presenza attuale su tracciato |
| Attività | `activity_periods[]`: mesi o testo qualitativo, stadio, area | Vietata conversione automatica di primavera in mesi; mese mancante sconosciuto, non zero |
| Ruolo | `ecological_roles[]`, `flower_visitation`, `pollination_evidence` | Visita osservata ≠ impollinazione provata; separare stadi quando hanno ruoli diversi |
| Rischi | `risk_scenarios[]`: meccanismo, esposizione, condizione, destinatario, fonte | Puntura/contatto/morso/vettore distinti; nessun punteggio unico specie |
| Azioni | `actions[]`: contesto, testo, urgenza editoriale, destinatario, fonte, revisione | `before_walk`, `encounter`, `after_walk`, `after_contact`; emergenza validata e visibile |
| Relazioni | `comparison_relations[]`: coppia, motivazione, fonte | Non dedurre sosia da caratteri in comune; non esportare automaticamente relazioni fungine |
| Conservazione | `conservation_notes[]`, `sensitive_location` | Stato normativo con versione e ambito; non inferire dalla rarità narrativa |
| Media | `media[]`, `illustrations[]` | Taxon/stadio espliciti, licenza per asset, parti raffigurate legate alle claim |
| Revisione | `publication_status`, `reviewers`, `review_due`, `known_gaps` | Nessuna pubblicazione di procedure senza revisione competente |

## Esempio minimo di claim, non dato da importare

```json
{
  "claim_id": "zecche-habitat-01",
  "subject_id": "zecche",
  "field": "habitats",
  "value": ["vegetazione_erbosa", "vegetazione_arbustiva"],
  "scope": {"geography": "Italia, informazione generale", "stage": null},
  "evidence": [{"source_id": "ISS-Z", "locator": "Informazioni generali: habitat; differenze tra specie"}],
  "source_checked_on": "2026-10-18",
  "review_status": "verified_source",
  "expert_reviewed_by": null,
  "does_not_support": ["presenza su uno specifico sentiero", "rischio infettivo locale"]
}
```

Vocabolari come `vegetazione_erbosa` sono **proposte da definire**, non chiavi già adottate. Non aggregare le preferenze di tutte le specie in un habitat diagnostico del gruppo.

## Rendering e filtri

La stessa claim alimenta scheda, ricerca e illustrazione; niente sintesi biologiche inventate nel renderer. Risultati per nomi prima, per caratteri solo come fallback con motivo esplicito. Opzioni «non osservato» e «non so» non eliminano taxa. Nessun esito «è questo animale» e nessun verdetto sanitario. Per evitare aspettative sbagliate, prima versione senza percorso automatico di riconoscimento per caratteri.

Se una fonte è obsoleta per un’azione sanitaria o bollettino, indicazione «Da aggiornare» e rimozione della specifica sintesi operativa fino a verifica; non eliminare l’accesso generale ai soccorsi. Una pagina informativa statica non deve diventare un allarme di presenza. I contenuti offline mostrano data e limiti e non pretendono aggiornamenti in tempo reale.

## Matrice immagini

Ogni illustrazione registra `asset_id`, soggetto/stadio, parti nominate (`head`, `antennae`, `thorax`, `abdomen`, `wings`, ecc. solo se pertinenti), claim/valori raffigurati, raster sorgente/hash, prompt/revisione, licenza e stato di validazione. Prima raster controllato, poi SVG a livelli realmente vettoriali. Il gruppo non deve ereditare i dettagli di una specie usata come esempio senza etichetta.

Controlli futuri: ogni valore illustrato esiste nel dataset; nessuna parte non documentata viene aggiunta; foto e illustrazioni hanno licenze e tassonomia coerenti; valori multipli e stadi rimangono distinti; dati mancanti tracciati. Integrare con `asset-drawn-from` e `asset-pending` dopo la decisione di schema, non modificandoli ora.
