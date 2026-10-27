import { resolveModules, normalizeFieldRecord } from '../../src/js/core/index.js';
import type { FieldRecord } from '../../src/js/core/index.js';
resolveModules(['academy', 'territory']);
// @ts-expect-error Only declared modules can compose a product.
resolveModules(['photographic-certification']);
declare const record: FieldRecord;
const normalized: FieldRecord = normalizeFieldRecord(record);
void normalized;
// @ts-expect-error Review status cannot be fabricated by the observation normalizer.
const reviewed: FieldRecord = { ...record, identification: 'expert' };
void reviewed;
