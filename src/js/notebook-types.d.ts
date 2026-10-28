import type { PrivatePosition } from "./types.js";
export type NoteCategory =
  | "appunto"
  | "percorso"
  | "botanica"
  | "fungo"
  | "albero"
  | "animale"
  | "lettura";
import type { FieldRecord } from "./core/field-record-types.js";
export type { FieldRecord, Presence, Habitat, EffortClass, StopReason } from "./core/field-record-types.js";
export type PhenoCode =
  | "young_leaves"
  | "open_flowers"
  | "unripe_fruits"
  | "ripe_fruits"
  | "dry_fruits";
export interface PhenoPhase {
  code: PhenoCode;
  status: "present" | "absent" | "unsure";
}
export interface PhenoObservation {
  protocolVersion: "fungaroli-phenology-notes-v1";
  taxonId: string;
  identification: "unreviewed";
  phases: PhenoPhase[];
  availability: "unknown" | "none" | "few" | "many";
  minutes: number | null;
  patchLabel: string;
  locationPrecision: "zone" | "unspecified";
  researchConsent: false;
}
export interface NotebookPhoto {
  data: string;
  width: number;
  height: number;
}
export interface PhotoReference {
  key: string;
  width: number;
  height: number;
}
/** All notebook entry kinds remain opaque to the photo store, including legacy reports and saved outings. */
export interface NotebookEntry {
  id: string;
  photo?: NotebookPhoto | PhotoReference | null;
  photoUnavailable?: boolean;
  [key: string]: unknown;
}
export interface NotebookNote extends NotebookEntry {
  kind: "note";
  title: string;
  category: NoteCategory;
  date: string;
  zoneId: string | null;
  note: string;
  reference: { href: string; title: string } | null;
  observation: PhenoObservation | null;
  savedAt: string;
  record?: FieldRecord;
  photo?: NotebookPhoto;
  position?: PrivatePosition;
  weather?: {
    zoneId: string | null;
    date: string;
    icon: "sun" | "cloud" | "wind" | "fog" | "rain" | "storm" | "snow";
    tmin: number;
    tmax: number;
    capturedAt: string;
  };
}
/** Shared observations deliberately have no photo, precise position, note or consent. */
export interface SharedObservation extends FieldRecord {
  category: NoteCategory;
  taxonId: string;
  reference: string;
  zoneId: string;
  day: string;
  phases: PhenoPhase[];
  availability: string;
  validation: "unreviewed";
}
