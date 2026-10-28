// Generated from src/js/core/guards.ts. Run npm run build:typescript; do not edit.
export function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
