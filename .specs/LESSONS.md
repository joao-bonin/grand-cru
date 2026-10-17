# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Não converter quantidades recebidas ou canceladas de compras sem comprovar a unidade da origem; bloquear a recomendação dependente.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `erp` · harmful: 0
- features: comprador-virtual
- evidence: server/infrastructure/erp/purchase-mapper.ts:13 (erp)
- last seen: 2026-10-17T02:57:17Z

### L-002 - Distinguir contrato documentado de dados operacionais conciliados antes de declarar uma integração validada.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `erp` · harmful: 0
- features: comprador-virtual
- evidence: CV-01 (erp)
- last seen: 2026-10-17T02:57:17Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
