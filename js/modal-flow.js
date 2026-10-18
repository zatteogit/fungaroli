// Un solo dialog modale attivo. I passaggi precedenti restano chiusi nel DOM,
// con controlli e contenuto intatti, fino al ritorno o all'uscita dal percorso.
const frames = [], pendingSuspensions = new WeakSet();
let lastTrigger = null;
const activeModal = () => [...document.querySelectorAll('dialog[open]:modal')].at(-1);
function show(dialog) { delete dialog.dataset.modalFlowLeaving; dialog.showModal(); }
function returnLabel(dialog) {
  const title = dialog.getAttribute('aria-labelledby')?.split(' ')[0];
  return dialog.getAttribute('aria-label') || (title && document.getElementById(title)?.textContent) || 'passaggio precedente';
}
function addBack(frame) {
  if (!frame.child.open) return;
  const existing = frame.child.querySelector('[data-modal-flow-back]');
  const internalBack = !!frame.child.querySelector('[data-entity-back]:not([hidden])');
  if (existing) { if(existing.hidden!==internalBack)existing.hidden=internalBack; return; }
  let header = frame.child.querySelector('header,.profile-header,.wiz-bar,.lb-top');
  if (!header) {
    header = document.createElement('div'); header.className = 'modal-flow-nav';
    frame.child.prepend(header);
  }
  header.classList.add('modal-flow-header');
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'modal-flow-back'; back.dataset.modalFlowBack = '';
  back.hidden = internalBack;
  back.setAttribute('aria-label', `Torna a ${returnLabel(frame.parent)}`);
  back.title = back.getAttribute('aria-label');
  back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>';
  back.addEventListener('click', () => frame.child.close());
  header.prepend(back);
}
function removeBack(frame) {
  const back = frame.child.querySelector('[data-modal-flow-back]'), header = back?.parentElement;
  back?.remove(); header?.classList.remove('modal-flow-header');
  if (header?.classList.contains('modal-flow-nav')) header.remove();
}
function restoreContainer(frame) {
  if (!frame.container?.isConnected || !frame.child.isConnected) return;
  frame.container.insertBefore(frame.child,frame.next?.parentNode===frame.container?frame.next:null);
}
function discard(frame) {
  removeBack(frame);
  restoreContainer(frame);
  delete frame.parent.dataset.modalSuspended;
  // La chiusura di sospensione non è una chiusura del percorso. Ora invece
  // esegue i normali cleanup (anche listener once) senza riaprire il dialog.
  frame.parent.dispatchEvent(new Event('close'));
}
function finish(frame) {
  const index = frames.indexOf(frame);
  if (index < 0) return;
  frame.child.dataset.modalFlowLeaving = '';
  frames.splice(index, 1); removeBack(frame);
  restoreContainer(frame);
  if (frame.exit || location.hash !== frame.hash || !frame.parent.isConnected) {
    const rest = frames.splice(0);
    discard(frame); rest.reverse().forEach(discard);
    return;
  }
  delete frame.parent.dataset.modalSuspended;
  show(frame.parent);
  frame.parent.scrollTop = frame.scroll;
  queueMicrotask(() => {
    if (!frame.parent.open) return;
    if (frame.focus?.isConnected) frame.focus.focus({preventScroll:true});
    frame.parent.scrollTop = frame.scroll;
  });
}
export function openModal(dialog) {
  if (dialog.matches(':modal')) return;
  // Un singleton già conservato (es. scheda aperta dal glossario) torna attivo:
  // non può diventare contemporaneamente antenato e figlio del proprio percorso.
  const prior = frames.findIndex(frame => frame.parent === dialog);
  if (prior >= 0) {
    const removed = frames.splice(prior), active = activeModal();
    active?.close();
    for (const frame of removed.reverse()) {
      if (frame.parent !== dialog) discard(frame);
      else { removeBack(frame); restoreContainer(frame); delete dialog.dataset.modalSuspended; }
    }
    show(dialog);
    frames.forEach(addBack);
    return;
  }
  const parent = activeModal();
  let frame;
  if (parent && parent !== dialog) {
    const focus = parent.contains(document.activeElement) ? document.activeElement : parent.contains(lastTrigger) ? lastTrigger : null;
    frame = {parent,child:dialog,focus,scroll:parent.scrollTop,hash:location.hash,exit:false};
    // Il visore può vivere dentro la spiegazione: un dialog chiuso nasconde
    // anche i discendenti nel top layer, quindi il nuovo pannello va separato.
    if (parent.contains(dialog)) {
      frame.container=dialog.parentNode; frame.next=dialog.nextSibling;
      document.body.append(dialog);
    }
    frames.push(frame); parent.dataset.modalSuspended = '';
    pendingSuspensions.add(parent);
    parent.close();
  }
  try { show(dialog); }
  catch (error) { if (frame) finish(frame); throw error; }
  if (frame) addBack(frame);
}
export const modalScrollPosition = dialog => frames.find(frame=>frame.parent===dialog)?.scroll ?? dialog.scrollTop;
if (typeof document !== 'undefined') {
  document.addEventListener('beforetoggle', event => {
    if (event.newState==='closed' && frames.some(frame=>frame.child===event.target)) event.target.dataset.modalFlowLeaving='';
  }, true);
  // Intercetta soltanto l'evento nativo causato dalla sospensione; il cleanup
  // resta registrato e verrà eseguito alla chiusura effettiva del percorso.
  document.addEventListener('close', event => {
    if (event.isTrusted && pendingSuspensions.has(event.target)) {
      pendingSuspensions.delete(event.target); event.stopImmediatePropagation(); return;
    }
    const frame = frames.find(frame => frame.child === event.target);
    if (frame) finish(frame);
  }, true);
  document.addEventListener('click', event => {
    lastTrigger = event.target.closest('button,a,input,textarea,select');
    const child = event.target.closest('dialog'), frame = frames.find(frame => frame.child === child);
    // Indietro/Escape tornano al passo precedente; la X esce dal percorso.
    if (frame && event.target.closest('button[aria-label^="Chiudi"],[data-close],.wiz-close,[data-note-close],[data-report-dismiss],[data-learning-close],[data-finder-close],[data-share-close],[data-lb="close"],[data-entity-close]')) frame.exit = true;
  }, true);
  addEventListener('hashchange', () => {
    const previous = frames.splice(0);
    previous.reverse().forEach(discard);
    activeModal()?.close();
  });
  new MutationObserver(() => {
    for (const frame of [...frames].reverse()) {
      if (!frame.child.isConnected) finish(frame);
      else addBack(frame); // Anche dopo un cambio di passo nel compositore.
    }
  }).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
}
