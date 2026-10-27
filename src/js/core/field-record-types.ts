export type Presence = "unknown" | "observed" | "searched_absent";
export type Habitat =
  "unknown" | "broadleaf" | "conifer" | "mixed" | "grassland" | "other";
export type EffortClass = "lt30" | "30-60" | "60-120" | "gt120";
export type StopReason = "planned_time" | "found_target" | "weather" | "other";
export interface FieldRecord {
  protocolVersion: "fronda-field-note-v1" | "fronda-field-note-v2";
  presence: Presence;
  amount: number | null;
  minutes: number | null;
  effortClass: EffortClass | null;
  completed: boolean | null;
  stopReason: StopReason | null;
  people: number | null;
  elevation: number | null;
  habitat: Habitat;
  identification: "unreviewed";
}
