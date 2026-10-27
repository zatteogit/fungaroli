/** Only public catalogue data belongs in an offline pack. Never a private note. */
export interface PrivatePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
}
/** GeoJSON is longitude first; these catalogue lines are latitude first. */
export type TrailPoint = [latitude: number, longitude: number];
export type TrailLines = TrailPoint[][];
export interface FieldSpecies {
  kind: "plant" | "fungus";
  name: string;
  latin?: string;
  description?: string;
  features: string[];
  caution?: string;
  photo?: string;
  credit?: string;
  creditUrl?: string;
  licenseUrl?: string;
  lookalikes: { name?: string; latin?: string; diff?: string; risk?: string }[];
  sources: { url: string; title?: string; name?: string }[];
}
export interface FieldPack {
  version: 1;
  id: string;
  preparedAt: string;
  date: string;
  zone: {
    id: string;
    title: string;
    description?: string;
    access?: string;
    protection?: string;
    parking: { name: string }[];
  };
  cover?: string;
  coverCredit?: string;
  coverCreditUrl?: string;
  coverLicenseUrl?: string;
  trail: {
    id: string | number;
    name: string;
    difficulty?: string;
    length?: number;
    lines: TrailLines;
  } | null;
  weather: {
    text: string;
    level?: "ok" | "attenzione" | "sconsigliata";
    fetchedAt?: string;
  } | null;
  rules: string;
  species: FieldSpecies[];
}
export interface StoredFieldPack extends FieldPack {
  cache: string;
  bytes: number;
  savedAt: string;
}
export interface OutingKey {
  zoneId: string;
  date: string;
}
export interface AlertConfig {
  enabled: boolean;
  publicKey: string;
}
export interface AlertCredentials {
  token: string;
  outings: string[];
}
export interface FieldJob {
  busy: boolean;
  message: string;
  url?: string;
}
export interface NoteLocationOptions {
  get: () => PrivatePosition | null | undefined;
  set: (position: PrivatePosition | null) => void;
  capture: () => void;
  active: () => boolean;
  render: () => void;
}
