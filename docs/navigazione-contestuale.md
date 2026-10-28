# Navigazione e azioni contestuali

La revisione del 27 ottobre riduce le scelte globali e usa il morph sulle barre,
lasciando stabili contenuti, dati e posizione di lettura. Le destinazioni Uscite,
Mappa, Scopri e Taccuino restano montate e riconoscibili.

- In home e nei cataloghi l’utente sceglie una proposta o una scheda; non compare
  un’azione globale di annotazione. La ricerca resta sempre disponibile.
- Nelle schede, nelle uscite e nelle letture pertinenti, «Annota» rimane nel
  contenuto. Quando esce dalla parte visibile della pagina, la stessa possibilità
  emerge nella barra e conserva specie, riferimento o zona correnti.
- Nel Taccuino «Annota» è l’azione principale; il racconto dell’uscita resta
  secondario. Anche qui la barra evita di duplicare l’azione già visibile.
- Profilo, aspetto, feedback e informazioni sono nel contesto personale del
  Taccuino; non formano una fila di utility su tutte le pagine. Il profilo è anche
  raggiungibile dalla testata del Taccuino e resta facoltativo. Le cautele nel
  contenuto e le informazioni collegate alla zona non vengono spostate.
- Il confronto conserva soltanto Cerca e Cambia in testata.

## Movimento e input

`src/js/contextual-navigation.ts` controlla una sola progressione per larghezza,
spazio e opacità della capsula d’azione, con la molla già usata dalla dock.
La molla della densità a scroll continua a gestire separatamente l’altezza.
Nessun ridimensionamento del corpo pagina; il suo spazio inferiore resta fisso.
I testi e le icone non vengono deformati e non si applicano blur animati.

La capsula non è interattiva durante ingresso/uscita finché non è raggiungibile;
un controllo nascosto è `inert`, fuori dal percorso di tastiera e disabilitato.
Durante una pressione o con focus tastiera sull’azione, la geometria resta ferma.
Se nel frattempo cambia la rotta, la pressione non può annotare un altro contesto.
«Riduci movimento» applica direttamente il nuovo stato. La preferenza del tema
resta nella stessa chiave locale e si sceglie esplicitamente nel Taccuino.

Telefono e desktop condividono gerarchia e contesto: cambiano disposizione e
spazio disponibile. Su desktop le etichette restano visibili finché entrano
nello spazio effettivamente libero tra marchio e azioni della pagina, anche
tra 900 e 1099 px. Il riferimento è il centro della finestra, anche quando
marchio e comandi hanno ingombri diversi. Solo se quel centro causa una
collisione la barra si sposta del minimo necessario entro l’intervallo libero.
Questa posizione segue anche la larghezza animata della capsula «Annota».
Solo se le voci e l’eventuale «Annota» non entrano si usano le icone, con gli
stessi quattro accessi e i loro nomi accessibili. Il calcolo si aggiorna con
dimensioni, font e contesto, senza misurazioni durante lo scroll.
