// Una specie espone le fasi solo quando l'intera serie documentata è stata importata.
export function availableGrowthStages(taxon, icons) {
  const stages = taxon?.stages;
  if (!Array.isArray(stages) || stages.length < 2 || !Array.isArray(icons?.stages)) return [];
  const valid = stages.every(s => s && /^[a-z][a-z0-9-]*$/.test(s.id) && icons.stages.includes(s.id)
    && typeof s.label === 'string' && s.label.trim() && typeof s.desc === 'string' && s.desc.trim()
    && /^https:\/\//.test(s.source || '') && Array.isArray(s.tiles) && s.tiles.length
    && s.tiles.every(p => ['cappello','sotto','gambo','taglio'].includes(p)));
  return valid ? stages : [];
}
