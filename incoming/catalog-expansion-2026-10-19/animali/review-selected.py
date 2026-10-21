import json
from pathlib import Path
O=Path(__file__).parent
reviews=json.load(open(O/'review-decisions.json'))
def yes(suffix,point,rect,alt,caption,note):
 row=next(x for x in json.load(open(O/'candidates.json'))['photos'] if x['id'].endswith(suffix))
 reviews[row['id']]=dict(approved=True,attribution_approved=True,punto=point,riquadro=rect,alt=alt,caption=caption,nota=note)
def no(suffix,reason):
 row=next(x for x in json.load(open(O/'candidates.json'))['photos'] if x['id'].endswith(suffix));reviews[row['id']]=dict(approved=False,nota=reason)
yes('6e3edfc8',[.51,.50],[.13,.16,.74,.82],'Martora (Martes martes) su un ramo.','Martora (Martes martes), Drenthe, Paesi Bassi.','Figura leggibile, pelo e muso nitidi; testa rivolta verso osservatore. Non si attribuisce una fase biologica.')
yes('d1817718',[.52,.52],[.2,.12,.88,.96],'Faina (Martes foina), muso e pettorina chiara.','Faina (Martes foina), Drenthe, Paesi Bassi.','Soggetto nitido, pettorina e muso leggibili, sfondo naturale.')
yes('d68a0b4b',[.44,.52],[.18,.19,.67,.88],'Quercino (Eliomys quercinus), dettaglio del muso fra il legno.','Quercino (Eliomys quercinus), dettaglio del muso nel tronco; Spagna.','Dettaglio nitido: mascherina, orecchie e muso leggibili; il corpo è nel tronco e non viene dichiarato intero.')
yes('86de54cd',[.5,.52],[.18,.16,.84,.94],'Gatto selvatico (Felis silvestris), corpo e coda ad anelli.','Gatto selvatico (Felis silvestris), vista del corpo e della coda.','Soggetto intero nitido, coda e capo leggibili su sfondo sfocato. Nessuna localizzazione italiana dedotta.')
yes('54b5f76e',[.53,.48],[.06,.06,.94,.85],'Aquila reale (Aquila chrysaetos) in volo.','Aquila reale (Aquila chrysaetos) in volo a La Cañada, Ávila, Spagna.','Ali e testa nitide; contorno completo. Nessuna età o sesso dedotti.')
yes('42a9dee1',[.43,.52],[.16,.32,.7,.78],'Ape legnaiola (Xylocopa violacea) su fiori gialli.','Ape legnaiola (Xylocopa violacea), visita ai fiori.','Dettaglio macro nitido su fiore, corpo e ali visibili; la specie è attestata dalla fonte, nessuna determinazione visiva autonoma.')
yes('4145dd98',[.5,.49],[.4,.11,.64,.87],'Bruco di macaone (Papilio machaon), vista dorsale.','Bruco di macaone (Papilio machaon), vista dorsale; Keila, Estonia.','Fase larvale esplicita nel singolo file e nella fonte primaria; foto nitida, da confermare nei crop orizzontali.')
no('47e8a403','Seconda martora della stessa scena, quasi identica e senza carattere aggiuntivo abbastanza utile.')
yes('8adf7b53',[.58,.51],[.40,.19,.78,.88],'Faina (Martes foina) fra il legno, pettorina in vista.','Faina (Martes foina), altra postura con pettorina chiara; Drenthe, Paesi Bassi.','Vista frontale complementare alla laterale, corpo nitido in ambiente; stessa scena ma differenza informativa evidente.')
no('d1d4335d','A1200px muso e mantello risultano morbidi, corpo e coda parzialmente occlusi dalla vegetazione: non soddisfa selezione severa.')
no('3f400567','Solo parte del muso è visibile nella fessura; vista più occlusa e meno informativa rispetto al primo quercino nitido.')
yes('6ada9d16',[.53,.42],[.21,.10,.89,.75],'Gatto selvatico (Felis silvestris), dettaglio del capo.','Gatto selvatico (Felis silvestris), dettaglio del capo nel parco faunistico Wisentgehege Springe, Germania; in cattività.','Dettaglio del muso molto nitido complementare alla prima figura intera; cattività esplicita nella fonte.')
yes('6787d92c',[.51,.49],[.12,.03,.86,.94],'Lepre italica (Lepus corsicanus), corpo e orecchie in vista.','Lepre italica (Lepus corsicanus), fotografata in Francia secondo la fonte.','Animale vivo intero e nitido; terreno sassoso ma soggetto ben separato. Taxon esatto della fonte, nessuna presenza appenninica dedotta.')
yes('a297774a',[.52,.53],[.05,.18,.98,.89],'Aquila reale (Aquila chrysaetos), dettaglio del capo.','Aquila reale (Aquila chrysaetos), parco faunistico Wisentgehege Springe, Germania; in cattività.','Macro nitida di capo, becco e piumaggio, complementare alla sagoma in volo. Cattività esplicita.')
yes('6d48b8d6',[.52,.53],[.18,.18,.84,.86],'Ape legnaiola (Xylocopa violacea), dettaglio su lavanda.','Ape legnaiola (Xylocopa violacea) su lavanda a Oppède, Francia.','Vista ravvicinata complementare delle ali e del capo, sfondo sfocato; nessuna fase o sesso dedotti.')
yes('19d75882',[.52,.47],[.13,.10,.89,.93],'Donnola (Mustela nivalis), corpo e gola chiara.','Donnola (Mustela nivalis), British Wildlife Centre, Inghilterra; in cattività.','Corpo e testa leggibili su sfondo scuro; immagine della fonte con contrasto marcato, nessuna correzione creativa applicata. Cattività esplicita.')
(O/'review-decisions.json').write_text(json.dumps(reviews,ensure_ascii=False,indent=2)+'\n')
