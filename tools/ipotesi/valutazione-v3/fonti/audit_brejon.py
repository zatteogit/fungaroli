import csv, sys, collections, datetime as dt
rows = list(csv.DictReader(open(sys.argv[1])))
print("rows", len(rows), "cols", len(rows[0]))
by = collections.defaultdict(dict)
for r in rows: by[r["site"]][r["Date"]] = r
print({k: len(v) for k, v in by.items()})
dates = sorted(by["All"])
print("unique dates", len(set(r["Date"] for r in rows)), dates[0], dates[-1])
tot = {k: sum(float(r["Mnb"]) for r in v.values()) for k, v in by.items()}
print("totals", tot)
allv = by["All"]
pos = sum(1 for r in allv.values() if float(r["Mnb"]) > 0)
print("All positive dates", pos, "zero", len(allv) - pos)
viol = [d for d in dates if float(allv[d]["Mnb"]) < float(by["Site_A"][d]["Mnb"]) + float(by["Site_B"][d]["Mnb"])]
print("dates All < A+B:", len(viol))
same_env = all(by["Site_A"][d]["Temp"] == allv[d]["Temp"] and by["Site_B"][d]["Precip"] == allv[d]["Precip"] for d in dates)
print("same env across aggregations", same_env)
# rolling window inclusion test within each year (skip first 35 days)
def chk(var, roll, k):
    e_incl = e_excl = 0; n = 0
    for y in sorted(set(d[:4] for d in dates)):
        ds = [d for d in dates if d[:4] == y]
        for i in range(k, len(ds)):
            t = [float(allv[ds[j]][var]) for j in range(len(ds))]
            incl = sum(t[i-k+1:i+1]) / k
            excl = sum(t[i-k:i]) / k
            v = float(allv[ds[i]][roll])
            e_incl = max(e_incl, abs(v-incl)); e_excl = max(e_excl, abs(v-excl)); n += 1
    return n, e_incl, e_excl
for var, roll, k in [("Temp","rollT_20",20),("Precip","rollP_26",26),("Precip","rollP_2",2)]:
    print(roll, "n=%d max_err_inclusive=%.3g max_err_exclusive=%.3g" % chk(var, roll, k))
# methods interval 08-05..11-21
mi = [d for d in dates if "08-05" <= d[5:] <= "11-21"]
print("methods interval rows", len(mi), "zeros", sum(1 for d in mi if float(allv[d]["Mnb"]) == 0))
out = [d for d in dates if not ("08-05" <= d[5:] <= "11-21")]
print("outside rows", len(out), "positives outside", sum(1 for d in out if float(allv[d]["Mnb"]) > 0))
# per-year totals
for y in sorted(set(d[:4] for d in dates)):
    print(y, {k: sum(float(by[k][d]["Mnb"]) for d in dates if d[:4]==y) for k in by})
