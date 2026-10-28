import test from "node:test";
import assert from "node:assert/strict";
import { normalizePosition } from "../js/field-device.js";
import { normalizeNotebookNote } from "../js/notebook-entry.js";
import { sharedObservation } from "../js/community-observation.js";
import { packageAssets } from "../js/field-store.js";
import { routeSvg, packHtml, routeGpx } from "../js/field-render.js";
const position = {
  latitude: 42.12345,
  longitude: 12.11223,
  accuracy: 12,
  capturedAt: "2026-10-27T08:00:00Z",
};
const note = {
  id: "note-field-1",
  kind: "note",
  category: "fungo",
  title: "Un porcino",
  date: "2026-10-25",
  note: "Un ricordo",
  zoneId: "tancia",
  reference: { href: "#/specie/edulis", title: "Porcino" },
  position,
  record: {
    presence: "observed",
    amount: 1,
    minutes: 20,
    people: 1,
    elevation: 800,
    habitat: "unknown",
  },
};
test("GPS: coordinate, precisione e acquisizione sono validati; assenza non significa zero", () => {
  assert.equal(normalizePosition(null), null);
  assert.deepEqual(normalizePosition(position), position);
  for (const value of [
    { ...position, latitude: 91 },
    { ...position, longitude: -181 },
    { ...position, accuracy: -1 },
    { ...position, capturedAt: "ieri" },
    { ...position, latitude: "42" },
    { ...position, longitude: NaN },
  ])
    assert.throws(() => normalizePosition(value));
  assert.deepEqual(normalizeNotebookNote(note).position, position);
});
test("il punto privato non entra nell’osservazione condivisa o nel payload di ricerca", () => {
  const shared = sharedObservation(normalizeNotebookNote(note));
  assert.ok(shared.taxonId);
  assert.ok(!JSON.stringify(shared).includes("latitude"));
  assert.ok(!JSON.stringify(shared).includes("12.11223"));
  assert.equal(shared.position, undefined);
});
test("pacchetto offline: niente mappe scaricate, URL esterni, foto private o video", () => {
  const files = packageAssets({
    cover: "assets/zones/tancia.webp",
    species: [
      { photo: "assets/species/edulis.webp" },
      { photo: "https://tile.openstreetmap.org/10/1/1.png" },
      { photo: "data:image/jpeg;base64,abc" },
      { photo: "assets/video/test.mp4" },
    ],
  });
  assert.ok(files.includes("offline.html"));
  assert.ok(files.includes("assets/species/edulis.webp"));
  assert.ok(
    files.every(
      (f) =>
        !f.startsWith("http") && !f.startsWith("data:") && !f.endsWith(".mp4"),
    ),
  );
});
test("traccia offline: geometrie separate, nord in alto e posizione fuori inquadratura esplicita", () => {
  const lines = [
    [
      [42, 12],
      [42.01, 12.01],
    ],
    [
      [42.02, 12.02],
      [42.03, 12.03],
    ],
  ];
  const svg = routeSvg(lines, { ...position, latitude: 44 });
  assert.equal((svg.match(/<polyline/g) || []).length, 2);
  assert.match(svg, /fuori dall’inquadratura/);
  assert.match(svg, /nord in alto/);
  assert.doesNotMatch(svg, /NaN|Infinity/);
  assert.doesNotMatch(
    routeSvg([
      [
        [42, 12],
        [42, 12],
      ],
    ]),
    /NaN|Infinity/,
  );
});
test("copia offline: testi non eseguibili, acquisizione meteo esplicita, cautele e sosia completi", () => {
  const html = packHtml({
    zone: { title: "<script>x</script>", description: "Bosco" },
    date: "2026-10-27",
    preparedAt: position.capturedAt,
    weather: { text: "Asciutto", fetchedAt: position.capturedAt },
    species: [
      {
        name: "Porcino",
        features: ["Pori"],
        caution: "Controllo micologico",
        lookalikes: [{ name: "Sosia", diff: "Caratteri diversi" }],
      },
    ],
  });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Acquisito/);
  assert.match(html, /non aggiornamenti in tempo reale/);
  assert.match(html, /Controllo micologico/);
  assert.match(html, /Caratteri diversi/);
});

test("GPX offline: solo la geometria pubblica del catalogo, segmenti separati e testo XML protetto", () => {
  const xml = routeGpx({
    zone: { id: "tancia", title: "A & B" },
    trail: {
      name: "Sentiero",
      lines: [
        [
          [42, 12],
          [42.01, 12.01],
        ],
        [
          [43, 13],
          [43.01, 13.01],
        ],
      ],
    },
    position,
  });
  assert.equal((xml.match(/<trkseg>/g) || []).length, 2);
  assert.match(xml, /A &amp; B/);
  assert.doesNotMatch(xml, /42.12345|12.11223/);
});

test("service worker: video e Range non entrano nella cache dei pacchetti offline", async () => {
  const { readFileSync } = await import("node:fs"),
    vm = await import("node:vm");
  const listeners = {};
  vm.runInNewContext(
    readFileSync(new URL("../sw.js", import.meta.url), "utf8"),
    {
      self: { addEventListener: (name, fn) => (listeners[name] = fn) },
      URL,
      location: { origin: "https://fronda.test" },
      Response,
    },
  );
  for (const [path, headers] of [
    ["/assets/video/test.mp4", {}],
    ["/assets/species/edulis.webp", { range: "bytes=0-100" }],
  ]) {
    let handled = false;
    listeners.fetch({
      request: new Request("https://fronda.test" + path, { headers }),
      respondWith: () => (handled = true),
    });
    assert.equal(handled, false, path);
  }
});

test("push ricevuti: anche dati malformati producono una notifica, senza aprire origini esterne", async () => {
  const { readFileSync } = await import("node:fs"),
    vm = await import("node:vm");
  const listeners = {},
    shown = [],
    origin = "https://fronda.test";
  vm.runInNewContext(
    readFileSync(new URL("../sw.js", import.meta.url), "utf8"),
    {
      self: {
        addEventListener: (name, fn) => (listeners[name] = fn),
        registration: {
          showNotification: async (title, options) =>
            shown.push({ title, options }),
        },
      },
      URL,
      location: { origin },
      Response,
    },
  );
  for (const value of [
    null,
    "bad",
    { url: "https://evil.test/" },
    { url: "http://[" },
    { url: "/#/zona/tancia/2026-10-29" },
    { url: "/#/zona/tancia/1" },
  ]) {
    let done;
    listeners.push({
      data: { json: () => value },
      waitUntil: (p) => (done = p),
    });
    await done;
    assert.ok(shown.at(-1).options.data.url.startsWith(origin + "/"));
  }
  // Il link per data (avvisi dell'uscita) passa il filtro come quello per scarto.
  assert.equal(shown.at(-2).options.data.url, origin + "/#/zona/tancia/2026-10-29");
  assert.equal(shown.length, 6);
  assert.equal(shown.at(-1).options.data.url, origin + "/#/zona/tancia/1");
});

test("crediti fotografici: copertina e schede conservano autore, fonte e collegamento alla licenza", () => {
  const html = packHtml({
    zone: { title: "Bosco" },
    date: "2026-10-27",
    preparedAt: position.capturedAt,
    cover: "assets/cover.webp",
    coverCredit: "Autore · CC BY",
    coverCreditUrl: "https://example.org/cover",
    species: [
      {
        name: "Specie",
        credit: "Fotografo · CC BY",
        creditUrl: "https://example.org/photo",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      },
    ],
  });
  assert.match(html, /Autore · CC BY/);
  assert.match(html, /href="https:\/\/example.org\/cover"/);
  assert.match(html, /href="https:\/\/example.org\/photo"/);
  assert.match(html, /creativecommons.org/);
});

test("lettore offline: risposte HTML reindirizzate ripulite e URL canonici risolti dalla stessa cache", async () => {
  const { readFileSync } = await import("node:fs"),
    vm = await import("node:vm"),
    source = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  for (const path of [
    "/offline.html?outing=test",
    "/offline?outing=test",
    "/offline/?outing=test",
  ]) {
    const listeners = {},
      cached = new Response("<h1>Reader</h1>", {
        headers: { "content-type": "text/html" },
      });
    Object.defineProperty(cached, "redirected", { value: true });
    let matched;
    vm.runInNewContext(source, {
      self: { addEventListener: (name, fn) => (listeners[name] = fn) },
      URL,
      Response,
      location: { origin: "https://fronda.test" },
      caches: {
        open: async () => ({
          match: async (req) => {
            matched = String(req);
            return cached;
          },
        }),
      },
    });
    let result;
    listeners.fetch({
      request: new Request("https://fronda.test" + path, {
        redirect: "manual",
      }),
      respondWith: (p) => (result = p),
    });
    const response = await result;
    assert.equal(matched, "https://fronda.test/offline.html");
    assert.equal(response.redirected, false);
    assert.equal(await response.text(), "<h1>Reader</h1>");
  }
});
