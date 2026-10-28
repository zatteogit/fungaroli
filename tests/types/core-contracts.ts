import { normalizeFieldRecord } from '../../src/js/core/index.js';
import type { FieldRecord } from '../../src/js/core/index.js';
declare const record: FieldRecord;
const normalized: FieldRecord = normalizeFieldRecord(record);
void normalized;
// @ts-expect-error Review status cannot be fabricated by the observation normalizer.
const reviewed: FieldRecord = { ...record, identification: 'expert' };
void reviewed;
