# Poisson GLM log(mu) = a_year + bP*rollP_26 + bT*rollT_20 + bT2*rollT_20^2 sul blocco "All"
# del CSV degli autori (solo analisi locale, nessuna ridistribuzione). Ampiezza implicita sigma = sqrt(-1/(2 bT2)).
import csv, sys, math
import numpy as np
rows = [r for r in csv.DictReader(open(sys.argv[1])) if r['site'] == 'All']
for label, lo, hi in (('1/8-30/11', '08-01', '11-30'), ('5/8-21/11', '08-05', '11-21')):
    sel = [r for r in rows if lo <= r['date'][5:10] <= hi]
    years = sorted({r['year'] for r in sel})
    y = np.array([float(r['Mnb']) for r in sel])
    T = np.array([float(r['rollT_20']) for r in sel]); P = np.array([float(r['rollP_26']) for r in sel])
    Xy = np.array([[1.0 if r['year'] == yy else 0.0 for yy in years] for r in sel])
    X = np.column_stack([Xy, P, T, T**2])
    beta = np.zeros(X.shape[1]); beta[:len(years)] = math.log(max(y.mean(), 1e-3))
    for _ in range(100):
        eta = X @ beta; mu = np.exp(eta); z = eta + (y - mu) / mu; W = mu
        new = np.linalg.solve(X.T @ (W[:, None] * X) + 1e-8*np.eye(X.shape[1]), X.T @ (W * z))
        if np.max(np.abs(new - beta)) < 1e-9: beta = new; break
        beta = new
    bP, bT, bT2 = beta[-3:]
    topt = -bT / (2*bT2); sigma = math.sqrt(-1/(2*bT2))
    # dispersione di Pearson
    mu = np.exp(X @ beta); phi = float(np.sum((y-mu)**2/mu) / (len(y)-X.shape[1]))
    rel = {d: round(math.exp(-0.5*(d/sigma)**2), 2) for d in (2, 3.5, 4, 6)}
    fr = {d: round(math.exp(-0.5*(d/3.5)**2), 2) for d in (2, 3.5, 4, 6)}
    print(f'{label}: n={len(y)} Topt={topt:.2f} C sigma={sigma:.2f} C bP={bP:.3f} per mm/g, dispersione Pearson={phi:.1f}; risposta relativa a +-d gradi: dati {rel} | Fronda tsd 3,5 {fr}')
