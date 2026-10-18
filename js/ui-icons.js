// Asset Tabler (MIT) e penna d’oca della navigazione Fronda approvata.
// Fixed names only: callers cannot inject paths or markup.
const icon = name => `<span class="ui-icon ui-icon-${name}" aria-hidden="true"></span>`;
export const chevronRightGlyph = icon('chevron-right');
export const alertTriangleGlyph = icon('alert-triangle');
export const mapGlyph = icon('map');
export const leafGlyph = icon('leaf');
export const notebookGlyph = `<svg class="notebook-glyph" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.5 3.5C17 1 12 3 9 6.5C6 10 5 14 5.5 18.5L10 18C13.5 16.5 16.5 13 18.5 9.5C20 7 20.5 5 20.5 3.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 22 16.5 7.5M7.5 16.5H12M10.5 13H15M10.5 9V13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
