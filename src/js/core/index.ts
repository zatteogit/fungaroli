/** Public portable API. Platform adapters depend on this entry point. */
export type { FieldRecord, Presence, Habitat, EffortClass, StopReason } from './field-record-types.js';
export { normalizeFieldRecord, effortClassFor, FIELD_NOTE_V2, PRESENCE, HABITATS, EFFORT_CLASSES, STOP_REASONS } from './field-record.js';
export { MODULES, EDITIONS, resolveModules } from './modules.js';
export type { ModuleId, Edition } from './modules.js';
