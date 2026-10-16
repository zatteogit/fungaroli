import json, sys, time, urllib.request, urllib.parse, os
claims_path, outdir = sys.argv[1], sys.argv[2]
claims = json.load(open(claims_path))
UA = "fronda-source-audit/0.1 (research verification script)"
for c in claims:
    doi = c["doi"]
    fn = os.path.join(outdir, urllib.parse.quote(doi, safe="") + ".json")
    if os.path.exists(fn):
        continue
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi, safe="/")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
        open(fn, "wb").write(data)
        print("OK", doi)
    except urllib.error.HTTPError as e:
        open(fn, "w").write(json.dumps({"http_error": e.code}))
        print("HTTP", e.code, doi)
    except Exception as e:
        print("ERR", doi, e)
    time.sleep(1.2)
