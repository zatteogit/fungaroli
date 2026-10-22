# Gruppo pilota di cercatori esperti

Decisione di Matteo del 22/10/2026: il pilota si fa con inviti e una guida, **senza codice dedicato** (nessun link
d'invito, nessun segno sugli account, nessun cruscotto). Se il pilota parte davvero, un cruscotto di copertura per
zona e settimana si valuta dopo.

## Perché

La reciprocità mostra un riepilogo solo con almeno 3 persone diverse su 2 giorni nella stessa zona (o provincia) e
specie, negli ultimi 7 giorni. Con utenti sparsi quasi nessun gruppo ci arriva e chi condivide vede «dati
insufficienti». Un gruppo di esperti che esce spesso negli stessi boschi raggiunge la soglia e, soprattutto, porta
le **uscite a vuoto con la durata**: il dato che serve per capire se l'indice funziona.

## Chi invitare

- Chi nel questionario ha risposto **sì** a «Vuoi che ti ricontatti?» e ha lasciato un contatto. L'elenco si scarica
  dal CMS come amministratore: `GET /api/survey/v1/responses?survey=esperti-reatino&format=csv` (colonne `consent_recontact` e
  `contact`). Il contatto si usa solo per questo invito, come promesso nel questionario.
- Poche persone, meglio se nelle stesse zone: 6–10 cercatori che escono abitualmente nel Reatino bastano a far
  scattare i riepiloghi in alcune zone (stima, non verificata). Più dispersi sono, meno il pilota serve.
- Nessun criterio di «bravura» da verificare: conta che escano spesso e che annotino anche quando non trovano.

## Durata

Da subito fino a fine stagione autunnale (indicativamente inizio dicembre), poi si riprende in primavera. Meglio
dirlo chiaro nell'invito: è un impegno breve.

## Messaggio d'invito (da adattare)

> Ciao [nome], sono Matteo. Hai risposto al questionario sui funghi e mi hai detto che posso ricontattarti: grazie.
>
> Sto provando Fronda, un'app gratuita per scegliere dove e quando uscire nel bosco. L'indice dei funghi che mostra
> è sperimentale: per capire se funziona servono uscite vere, comprese quelle andate a vuoto.
>
> Ti va di provarla fino a fine stagione? Ti chiedo solo di annotare le tue uscite, anche quelle senza funghi, con
> quanto hai cercato. I tuoi posti restano tuoi: Fronda non registra il GPS e negli aggregati mostra solo zone
> ampie, senza nomi e senza giorni precisi. In cambio vedi cosa hanno trovato gli altri.
>
> Qui la guida di una pagina: [link]. L'app: https://fungaroli.zatteo.workers.dev
>
> Se non ti va, nessun problema.

## Guida di una pagina (da inviare con l'invito)

**Prima di partire**
- Apri in Fronda la scheda dell'uscita: la zona e il giorno in cui vai. L'app salva da sola la previsione di quel
  giorno. È quella che poi si confronta con com'è andata.

**Dopo il giro**
- Tocca **Annota** e scegli l'uscita, oppure **Ci sono stato** sul giro salvato.
- Indica il luogo, il giorno e **quanto è durato il giro**.
- Per ogni fungo che cercavi: trovato (pochi, discreti, tanti) oppure **cercato, zero**. Uno zero vale quanto un
  ritrovamento.
- Se non sei sicuro del nome, lascialo vuoto: meglio nessun nome che uno sbagliato.

**Condividere**
- Per vedere i riepiloghi degli altri accedi con una passkey e scegli **Condividi con community Fronda** sulle uscite
  che vuoi. Si condivide voce per voce e si ritira quando vuoi.
- Gli altri vedono solo totali per zona ampia o provincia negli ultimi 7 giorni, mai il tuo nome, il punto o il
  giorno preciso.

**Cosa trovi in cambio**
- Nel Taccuino, «Le tue uscite e l'indice»: per ogni uscita, cosa diceva l'indice quel giorno e com'è andata.
- Nella home e nelle schede, i riepiloghi della community per zona o per provincia.

**Cosa non fare**
- Non annotare uscite di altri o ricordi vecchi: servono le tue uscite, annotate a caldo.
- L'app non identifica i funghi e non dice cosa è commestibile.

## Cosa guardiamo alla fine

Fatti, non giudizi sulle persone: quante uscite annotate, quante con la previsione salvata prima, quante a vuoto con
la durata, in quante zone e settimane la soglia è stata raggiunta. Nessuna classifica dei partecipanti.
