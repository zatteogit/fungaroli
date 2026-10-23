-- Base di partenza arrotondata a 2 decimali, circa 1 km (decisione di Matteo del 22/10/2026).
-- Le basi salvate prima con 6 decimali (anche la posizione GPS del dispositivo) vengono riscritte.
-- Idempotente: tocca solo le righe non ancora arrotondate. Applicata a runtime da worker/community.js.
UPDATE account_preferences SET base=json_set(base,'$.lat',round(json_extract(base,'$.lat'),2),'$.lon',round(json_extract(base,'$.lon'),2)) WHERE json_valid(base) AND json_type(base,'$.lat') IN ('real','integer') AND json_type(base,'$.lon') IN ('real','integer') AND (json_extract(base,'$.lat')<>round(json_extract(base,'$.lat'),2) OR json_extract(base,'$.lon')<>round(json_extract(base,'$.lon'),2));
