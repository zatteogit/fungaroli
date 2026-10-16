import json, sys, os, urllib.parse, unicodedata, re
claims = json.load(open(sys.argv[1])); rawdir = sys.argv[2]
def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii","ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+"," ",s).strip()
for c in claims:
    fn = os.path.join(rawdir, urllib.parse.quote(c["doi"], safe="")+".json")
    d = json.load(open(fn))
    if "message" not in d:
        print(f"## {c['id']} {c['doi']} -> NOT IN CROSSREF {d}"); continue
    m = d["message"]
    authors = m.get("author", [])
    fam = [a.get("family","") + ("" if not a.get("given") else ", "+a["given"]) for a in authors]
    ed = [a.get("family","") for a in m.get("editor", [])]
    yr_print = (m.get("published-print") or {}).get("date-parts",[[None]])[0][0]
    yr_online = (m.get("published-online") or {}).get("date-parts",[[None]])[0][0]
    yr_issued = (m.get("issued") or {}).get("date-parts",[[None]])[0][0]
    cont = (m.get("container-title") or [""])
    cont = cont[0] if cont else ""
    title = (m.get("title") or [""])[0]
    vol = m.get("volume"); iss = m.get("issue"); pg = m.get("page") or m.get("article-number")
    lic = [l.get("URL") for l in m.get("license",[])]
    flags = []
    if c.get("first") and (not fam or norm(c["first"]).split()[0] not in norm(fam[0])):
        flags.append(f"PRIMO AUTORE: atteso {c['first']} trovato {fam[0] if fam else ed}")
    if c.get("year") and c["year"] not in (yr_print, yr_online, yr_issued):
        flags.append(f"ANNO: atteso {c['year']} trovato print={yr_print} online={yr_online} issued={yr_issued}")
    if c.get("journal") and norm(c["journal"])[:12] not in norm(cont) and norm(cont)[:12] not in norm(c["journal"]):
        flags.append(f"RIVISTA: attesa {c['journal']} trovata {cont}")
    if c.get("volume") and str(vol) != c["volume"]:
        flags.append(f"VOLUME: atteso {c['volume']} trovato {vol}")
    if c.get("pages"):
        if norm(str(pg)).replace(" ","") != norm(c["pages"]).replace(" ",""):
            flags.append(f"PAGINE: attese {c['pages']} trovate {pg}")
    if c.get("issue") and str(iss) != c["issue"]:
        flags.append(f"FASCICOLO: atteso {c['issue']} trovato {iss}")
    if c.get("nauthors") and len(authors) != c["nauthors"]:
        flags.append(f"N.AUTORI: attesi {c['nauthors']} trovati {len(authors)}")
    if c.get("title_kw") and norm(c["title_kw"]) not in norm(title):
        flags.append(f"TITOLO: atteso '{c['title_kw']}' trovato '{title}'")
    print(f"## {c['id']} {c['doi']} {'OK' if not flags else 'DIFF'}")
    print(f"   {'; '.join(fam[:8])}{' ...' if len(fam)>8 else ''} ({len(authors)} aut.) ed={ed[:3]}")
    print(f"   {title[:150]}")
    print(f"   {cont} {vol}({iss}) {pg} | print={yr_print} online={yr_online} | type={m.get('type')} | lic={lic[:3]}")
    for f in flags: print("   !!", f)
