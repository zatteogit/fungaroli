import json, sys, time, urllib.request, urllib.parse
dois = sys.argv[1:]
for d in dois:
    url = "https://api.crossref.org/works/" + urllib.parse.quote(d, safe="/")
    req = urllib.request.Request(url, headers={"User-Agent": "fronda-verifica/1.0 (mailto:noreply@example.org)"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            m = json.load(r)["message"]
        au = m.get("author", [])
        first = au[0].get("family", "?") if au else "?"
        yr = (m.get("published-print") or m.get("published-online") or m.get("issued"))["date-parts"][0][0]
        lic = ",".join(sorted({l["URL"].split("/licenses/")[-1] for l in m.get("license", []) if "creativecommons" in l["URL"]}))
        print(f"{d} | {first}{' et al.' if len(au)>2 else (' & '+au[1].get('family','') if len(au)==2 else '')} {yr} | {(m.get('title') or ['?'])[0][:90]} | {(m.get('container-title') or ['?'])[0]} {m.get('volume','')}({m.get('issue','')}):{m.get('page', m.get('article-number',''))} | CC:{lic}")
    except Exception as e:
        print(d, "ERRORE", e)
    time.sleep(1.1)
