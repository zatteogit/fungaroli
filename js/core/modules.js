// Generated from src/js/core/modules.ts. Run npm run build:typescript; do not edit.
/** Composition only: these modules describe a roadmap, not billing or authorization. */
const definitions = {
    safety: [],
    catalog: ['safety'],
    learning: ['catalog'],
    notebook: ['safety'],
    outings: ['catalog', 'notebook'],
    'advanced-learning': ['learning'],
    sync: ['notebook'],
    academy: ['learning'],
    territory: ['catalog', 'outings'],
    partners: ['learning'],
};
export const MODULES = Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id, dependencies]) => [id, Object.freeze([...dependencies])])));
const base = ['safety', 'catalog', 'learning', 'notebook', 'outings'];
/** Target composition, deliberately disconnected from the live application. */
export const EDITIONS = Object.freeze({
    free: Object.freeze([...base]),
    plus: Object.freeze([...base, 'advanced-learning', 'sync']),
    academy: Object.freeze([...base, 'academy']),
    territory: Object.freeze([...base, 'territory']),
    partners: Object.freeze([...base, 'partners']),
});
/** A stable dependency order; safety can never be removed by a product profile. */
export function resolveModules(requested) {
    const resolved = new Set();
    function visit(id) {
        if (!Object.hasOwn(MODULES, id))
            throw new Error(`Modulo sconosciuto: ${String(id)}`);
        if (resolved.has(id))
            return;
        for (const dependency of MODULES[id])
            visit(dependency);
        resolved.add(id);
    }
    visit('safety');
    for (const id of requested)
        visit(id);
    return Object.freeze([...resolved]);
}
