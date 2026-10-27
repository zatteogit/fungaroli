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
} as const;
export type ModuleId = keyof typeof definitions;
export type Edition = 'free' | 'plus' | 'academy' | 'territory' | 'partners';
export const MODULES: Readonly<Record<ModuleId, readonly ModuleId[]>> = Object.freeze(
  Object.fromEntries(Object.entries(definitions).map(([id, dependencies]) => [id, Object.freeze([...dependencies])])),
) as Readonly<Record<ModuleId, readonly ModuleId[]>>;
const base: readonly ModuleId[] = ['safety', 'catalog', 'learning', 'notebook', 'outings'];
/** Target composition, deliberately disconnected from the live application. */
export const EDITIONS: Readonly<Record<Edition, readonly ModuleId[]>> = Object.freeze({
  free: Object.freeze([...base]),
  plus: Object.freeze([...base, 'advanced-learning', 'sync'] as ModuleId[]),
  academy: Object.freeze([...base, 'academy'] as ModuleId[]),
  territory: Object.freeze([...base, 'territory'] as ModuleId[]),
  partners: Object.freeze([...base, 'partners'] as ModuleId[]),
});
/** A stable dependency order; safety can never be removed by a product profile. */
export function resolveModules(requested: readonly ModuleId[]): readonly ModuleId[] {
  const resolved = new Set<ModuleId>();
  function visit(id: ModuleId): void {
    if (!Object.hasOwn(MODULES, id)) throw new Error(`Modulo sconosciuto: ${String(id)}`);
    if (resolved.has(id)) return;
    for (const dependency of MODULES[id]) visit(dependency);
    resolved.add(id);
  }
  visit('safety');
  for (const id of requested) visit(id);
  return Object.freeze([...resolved]);
}
