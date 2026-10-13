// Aggiornamento editoriale della sola copia iniziale del glossario. Una bozza
// salvata o pubblicata da un autore non viene mai sostituita dal repository.
export function glossarySeedUpdate(db,payload,now,nonce,release) {
  const actor='release:glossary-illustrations-v2';
  return [
    db.prepare("UPDATE cms_documents SET version=1,published_version=1,draft=?,published=?,write_nonce=?,updated_at=?,updated_by=? WHERE id='glossary' AND version=0 AND published_version=0 AND updated_by='seed' AND draft=published AND json_extract(draft,'$.version')=1").bind(payload,payload,nonce,now,actor),
    db.prepare("INSERT INTO cms_revisions(document_id,version,payload,created_at,actor) SELECT id,version,draft,updated_at,updated_by FROM cms_documents WHERE id='glossary' AND write_nonce=?").bind(nonce),
    db.prepare("UPDATE cms_meta SET value=? WHERE key='release' AND EXISTS(SELECT 1 FROM cms_documents WHERE id='glossary' AND write_nonce=?)").bind(release,nonce),
    db.prepare("INSERT INTO cms_releases(id,created_at,actor,note,snapshot) SELECT ?,?,?,?,json_group_object(id,published_version) FROM cms_documents HAVING EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(release,now,actor,'Fonti italiane specifiche per le voci illustrate; revisione originale conservata.',release),
    db.prepare("INSERT INTO cms_audit(actor,action,document_id,version,created_at) SELECT updated_by,'publish',id,version,updated_at FROM cms_documents WHERE id='glossary' AND write_nonce=?").bind(nonce),
  ];
}

// Only pristine repository seeds may receive the contextual vocabulary release.
export function glossaryContextSeedUpdate(db,payload,now,nonce,release){
 const actor='release:glossary-contexts-v3';
 return [
  db.prepare("UPDATE cms_documents SET version=version+1,published_version=version+1,draft=?,published=?,write_nonce=?,updated_at=?,updated_by=? WHERE id='glossary' AND draft=published AND ((version=0 AND published_version=0 AND updated_by='seed' AND json_extract(draft,'$.version') IN (1,2)) OR (version=1 AND published_version=1 AND updated_by='release:glossary-illustrations-v2' AND json_extract(draft,'$.version')=2))").bind(payload,payload,nonce,now,actor),
  db.prepare("INSERT INTO cms_revisions(document_id,version,payload,created_at,actor) SELECT id,version,draft,updated_at,updated_by FROM cms_documents WHERE id='glossary' AND write_nonce=?").bind(nonce),
  db.prepare("UPDATE cms_meta SET value=? WHERE key='release' AND EXISTS(SELECT 1 FROM cms_documents WHERE id='glossary' AND write_nonce=?)").bind(release,nonce),
  db.prepare("INSERT INTO cms_releases(id,created_at,actor,note,snapshot) SELECT ?,?,?,?,json_group_object(id,published_version) FROM cms_documents HAVING EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(release,now,actor,'Omonimi risolti per contesto; significati botanici di aculei e substrato, polloni distinti dal ceduo.',release),
  db.prepare("INSERT INTO cms_audit(actor,action,document_id,version,created_at) SELECT updated_by,'publish',id,version,updated_at FROM cms_documents WHERE id='glossary' AND write_nonce=?").bind(nonce),
 ];
}

// Repository releases update only untouched seeds (or earlier repository releases).
// Compare the exact previous payload/version to protect concurrent author saves.
export function repositorySeedUpdate(db,id,previous,payload,now,nonce,release){
 const actor='release:repository-seed:discover-v1';
 return [
  db.prepare("UPDATE cms_documents SET version=version+1,published_version=version+1,draft=?,published=?,write_nonce=?,updated_at=?,updated_by=? WHERE id=? AND version=? AND published_version=version AND draft=published AND published=? AND published<>? AND ((version=0 AND updated_by='seed') OR updated_by LIKE 'release:repository-seed:%')").bind(payload,payload,nonce,now,actor,id,previous.version,previous.published,payload),
  db.prepare('INSERT INTO cms_revisions(document_id,version,payload,created_at,actor) SELECT id,version,draft,updated_at,updated_by FROM cms_documents WHERE id=? AND write_nonce=?').bind(id,nonce),
  db.prepare("UPDATE cms_meta SET value=? WHERE key='release' AND EXISTS(SELECT 1 FROM cms_documents WHERE id=? AND write_nonce=?)").bind(release,id,nonce),
  db.prepare("INSERT INTO cms_releases(id,created_at,actor,note,snapshot) SELECT ?,?,?,?,json_group_object(id,published_version) FROM cms_documents HAVING EXISTS(SELECT 1 FROM cms_meta WHERE key='release' AND value=?)").bind(release,now,actor,'Cataloghi, fotografie e testi descrittivi aggiornati; originali conservati.',release),
  db.prepare("INSERT INTO cms_audit(actor,action,document_id,version,created_at) SELECT updated_by,'publish',id,version,updated_at FROM cms_documents WHERE id=? AND write_nonce=?").bind(id,nonce),
 ];
}
