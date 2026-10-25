// Regola editoriale, scala interna 0–100. Non modifica il modello.
// Prima le specie scelte con indice >= 6, poi le altre >= 6.
// Gli indici inferiori completano soltanto il minimo desiderato di tre.
export function selectOutingMushrooms(rows) {
  const sorted=rows.filter(r=>Number.isFinite(r.score)).sort((a,b)=>b.score-a.score||b.pot.score-a.pot.score);
  const favorable=sorted.filter(r=>r.score>=60);
  const prioritized=[...favorable.filter(r=>r.chosen),...favorable.filter(r=>!r.chosen)];
  const shown=prioritized.slice(0,6);
  if(shown.length<3){
    const low=sorted.filter(r=>r.score<60);
    shown.push(...[...low.filter(r=>r.chosen),...low.filter(r=>!r.chosen)].slice(0,3-shown.length));
  }
  const used=new Set(shown);
  return {shown,remaining:rows.filter(r=>!used.has(r))};
}
