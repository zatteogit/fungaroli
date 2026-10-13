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
