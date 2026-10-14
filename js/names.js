// Nome scientifico per le card: solo il nome accettato (prima del ";"), senza autore ("L.", "Scop.", "(L.) Huds.").
// L'autore e i sinonimi restano nella scheda.
export function cardLatin(latin) {
  const [t0, t1, t2] = String(latin ?? '').split(';')[0].trim().split(/\s+/);
  if (!t0) return '';
  if (t1 === 'sect.' && t2) return `${t0} sect. ${t2}`;
  return t1 && /^[a-z×-]/.test(t1) ? `${t0} ${t1}` : t0;
}
