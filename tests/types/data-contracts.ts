import type { GrowthSeries, OutingSeries } from "../../src/js/weather-types.js";
import type { NotebookNote, SharedObservation, PhenoObservation } from "../../src/js/notebook-types.js";
declare function growth(value: GrowthSeries): void;
declare function outing(value: OutingSeries): void;
declare function note(value: NotebookNote): void;
declare function shared(value: SharedObservation): void;
declare function phenology(value: PhenoObservation): void;
declare const series: GrowthSeries;
declare const privateNote: NotebookNote;
declare const publicObservation: SharedObservation;
declare const observation: PhenoObservation;
growth({ ...series, p: [0, null] });
outing({ time: [], fetchedAt: "2026-10-27T10:00:00Z", p: [null] });
note(privateNote);
shared(publicObservation);
// @ts-expect-error Missing data is null, never a numeric string.
growth({ ...series, soilm: ["0.3"] });
// @ts-expect-error Provider acquisition time must be explicit.
outing({ time: [], p: [0] });
// @ts-expect-error A public observation cannot carry the private GPS point.
shared({ ...publicObservation, position: privateNote.position });
// @ts-expect-error No automatic research consent in a botanical observation.
phenology({ ...observation, researchConsent: true });
// @ts-expect-error Private coordinates must be numeric.
note({ ...privateNote, position: { latitude: "42", longitude: 12, accuracy: 5, capturedAt: "2026-10-27T10:00:00Z" } });
