import json, sys, re
for p in sys.argv[1:]:
    try:
        m = json.load(open(p))["message"]
    except Exception as e:
        print(p, "non JSON", e); continue
    au = m.get("author", [])
    names = ", ".join(a.get("family","?") for a in au[:6]) + (" …" if len(au)>6 else "")
    yr = (m.get("published-print") or m.get("published-online") or m.get("issued"))["date-parts"][0]
    lic = sorted({l["URL"] for l in m.get("license", [])})
    ab = re.sub("<[^>]+>", "", m.get("abstract","") or "")[:1500]
    print(f"== {p.split('/')[-1]} DOI {m.get('DOI')}\n  {names} ({yr})\n  {(m.get('title') or ['?'])[0]}\n  {(m.get('container-title') or ['?'])[0]} {m.get('volume','')}({m.get('issue','')}):{m.get('page', m.get('article-number',''))}\n  licenze: {lic}\n  rel: {m.get('relation',{})}\n  abstract: {ab}")
