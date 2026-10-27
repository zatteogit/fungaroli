// Asset Tabler (MIT) e penna d’oca della navigazione Fronda approvata.
// Fixed names only: callers cannot inject paths or markup.
const icon = name => `<span class="ui-icon ui-icon-${name}" aria-hidden="true"></span>`;
export const chevronRightGlyph = icon('chevron-right');
export const alertTriangleGlyph = icon('alert-triangle');
export const mapGlyph = icon('map');
export const leafGlyph = icon('leaf');
export const infoGlyph = '<svg class="info-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6m0-9h.01"/></svg>';
export const notebookGlyph = `<svg class="notebook-glyph" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.5 3.5C17 1 12 3 9 6.5C6 10 5 14 5.5 18.5L10 18C13.5 16.5 16.5 13 18.5 9.5C20 7 20.5 5 20.5 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 22 16.5 7.5M7.5 16.5H12M10.5 13H15M10.5 9V13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Auto frontale: parabrezza, carrozzeria e fari leggibili anche a 18 px.
export const carGlyph = '<svg class="car-glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10 7.2 5.8a2 2 0 0 1 1.9-1.4h5.8a2 2 0 0 1 1.9 1.4L18 10"/><rect x="4" y="10" width="16" height="8" rx="2"/><path d="M7 14h2m6 0h2M6 18v2m12-2v2M4 11l-2-1m18 1 2-1"/></svg>';
