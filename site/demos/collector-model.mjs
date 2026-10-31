export const seed = [
  { id: 'explorer', name: 'Orange-suited explorer', franchise: 'Space adventure', condition: 'Played with', value: 25, packaging: false },
  { id: 'droid', name: 'Vintage space droid', franchise: 'Space adventure', condition: 'Good', value: 35, packaging: true },
  { id: 'commando', name: 'Masked commando', franchise: 'Action heroes', condition: 'Good', value: 30, packaging: false },
];
export function selectFigures(figures, query = '', franchise = '') {
  const q = query.trim().toLocaleLowerCase();
  return figures.filter(f => (!franchise || f.franchise === franchise) && `${f.name} ${f.franchise} ${f.condition}`.toLocaleLowerCase().includes(q));
}
export function addFigure(figures, input, id) {
  const name = String(input.name || '').trim();
  const value = Number(input.value);
  if (!name || !Number.isFinite(value) || value < 0) throw new Error('Enter a name and a nonnegative estimated value.');
  return [...figures, { id, name, franchise: String(input.franchise || 'Other').trim() || 'Other', condition: String(input.condition || 'Unknown'), value, packaging: Boolean(input.packaging), photo: typeof input.photo === 'string' ? input.photo : '' }];
}
export function totalValue(figures) { return figures.reduce((sum, f) => sum + f.value, 0); }
