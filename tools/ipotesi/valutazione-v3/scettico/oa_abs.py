import json, sys
for p in sys.argv[1:]:
    try: m=json.load(open(p))
    except Exception as e: print(p,"non JSON",e); continue
    inv=m.get("abstract_inverted_index") or {}
    pos=sorted((i,w) for w,l in inv.items() for i in l)
    print("==",m.get("doi"),m.get("publication_year"),m.get("publication_date"),m.get("title"))
    print(" ".join(w for _,w in pos))
