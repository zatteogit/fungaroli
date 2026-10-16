import csv, sys
rows = [r for r in csv.DictReader(open(sys.argv[1])) if r["site"] == "All"]
tot = sum(float(r["Mnb"]) for r in rows)
def share(cond):
    s = sum(float(r["Mnb"]) for r in rows if cond(r)); n = sum(1 for r in rows if cond(r))
    return s, s / tot, n
print("total", tot)
print("T20 in [10,15]:", share(lambda r: 10 <= float(r["rollT_20"]) <= 15))
print("P26 in [2,4] mm/d:", share(lambda r: 2 <= float(r["rollP_26"]) <= 4))
print("both:", share(lambda r: 10 <= float(r["rollT_20"]) <= 15 and 2 <= float(r["rollP_26"]) <= 4))
# count-weighted mean T20 and P26
print("count-weighted mean T20 %.2f, P26 %.2f" % (sum(float(r["Mnb"])*float(r["rollT_20"]) for r in rows)/tot, sum(float(r["Mnb"])*float(r["rollP_26"]) for r in rows)/tot))
# top 10% days by count
pos = sorted([r for r in rows if float(r["Mnb"]) > 0], key=lambda r: -float(r["Mnb"]))
top = pos[:16]
print("top16 days T20 range %.1f-%.1f P26 range %.2f-%.2f" % (min(float(r["rollT_20"]) for r in top), max(float(r["rollT_20"]) for r in top), min(float(r["rollP_26"]) for r in top), max(float(r["rollP_26"]) for r in top)))
# simple T bins
for lo in range(4, 22, 2):
    s, f, n = share(lambda r: lo <= float(r["rollT_20"]) < lo+2)
    print(f"T20 [{lo},{lo+2}) days={n} count={s:.0f} share={f:.2f} rate={s/max(n,1):.2f}")
