# Validation: ERP sync volume — PASS

**Date:** 2026-10-17  
**Spec:** `.specs/features/erp-sync-volume/spec.md`  
**Diff range:** `738de99..287564344c19381074b6a6ab790edeb52293dce9`  
**Verifier:** fresh independent sub-agent `/root/verify_sync_volume`; author != verifier.

7/7 acceptance criteria have concrete evidence. No implementation gaps, weakened assertions, skipped tests or surviving mutants were found. This report validates the committed correction locally; production publication and a successful authenticated synchronization through the deployed application require separate operational evidence.

## Task completion

| Task | Status | Evidence |
| --- | --- | --- |
| Budget and hosting configuration | Verified | Volume/boundary tests and compiled Vercel artifact |
| Safe source diagnostics | Verified | Source/redaction unit tests and PostgreSQL snapshot integration |
| Full gates and independent review | Verified locally | Check, 19 integrations, Vercel build and seven-mutant sensor |
| Production publication | Outside this local verdict | Coordinator performs the authorized deployment after validation |

## Spec-anchored acceptance criteria

| AC | Spec-defined outcome | Exact evidence and assertion | Result |
| --- | --- | --- | --- |
| 1 | A load with 3,077 products and 18,612 balances finishes between 50s and 180s, preserving every record | `tests/unit/erp-sync-volume.test.ts:36`: `expect(get).toHaveBeenCalledTimes(222)`; line37: `expect(elapsed).toBe(66_600)`; lines38–41 compare all product IDs, stock location IDs and physical balances, and 55 suppliers. Existing route/mapper/pagination contracts are unchanged in the diff. | PASS |
| 2 | At exactly 180,000ms before a query, reject with ERP_SYNC_DEADLINE and send no query | `tests/unit/erp-sync-volume.test.ts:48`: `rejects.toThrow('ERP_SYNC_DEADLINE')`; line49: `expect(get).not.toHaveBeenCalled()`, with injected clock 180,000ms. | PASS |
| 3 | A response reaching the deadline cannot publish or start another source, including the final response | `tests/unit/erp-sync-volume.test.ts:70`: deadline rejection at 180,000/180,001ms; line71 asserts exactly one first-source GET. Lines83–85 reject a late sixth/final response and assert exactly six queries. Line59 accepts 179,999ms. | PASS |
| 4 | Every query/mapper failure carries a fixed source and sanitized known code; authentication pending remains compatible | `tests/unit/erp-sync-source.test.ts:17`: instance assertion; lines18–20 assert each of six source names, exact ERP_HTTP_403 and no later queries. Lines28–30 verify stock mapper diagnosis; lines36–39 require ERP_SOURCE_INVALID, absent cause and no private text. Line45 asserts exact ERP_AUTHENTICATION_PENDING. `tests/unit/erp-sync-failure.test.ts:22` rejects an arbitrary source name. | PASS |
| 5 | Persist a public source/reason/preservation message while keeping the complete prior snapshot, without private error data | `tests/integration/erp-sync-errors.spec.ts:19`: failed state; lines20–23 assert unchanged snapshotId, exact public deadline message, complete previous data and unchanged snapshot count. Lines25–26 assert exact redacted coupon failure and unchanged snapshotId. `server/infrastructure/persistence/erp-repository.ts:54` rolls back before persisting only the sanitized diagnostic. | PASS |
| 6 | An unrecognized unstructured error uses the existing generic message; authentication pending preserves its code | `tests/unit/erp-sync-failure.test.ts:23` asserts the entire existing generic text; lines26–27 assert exact ERP_AUTHENTICATION_PENDING for both plain and structured errors. | PASS |
| 7 | Vercel compilation sets maxDuration300 without automatically migrating or resetting a password | `nuxt.config.ts:7` sets `nitro.vercel.functions.maxDuration: 300`; generated `.vercel/output/functions/__fallback.func/.vc-config.json:3` contains `"maxDuration": 300` after a successful Vercel-preset build. `vercel.json:4` runs only npm run build; `package.json:11` builds Nuxt and line13 prepares Nuxt. Migration/reset scripts remain explicit commands at lines21/24 and are not invoked by build/start hooks. | PASS |

No spec-precision gaps. Unit tests map to AC1–4/6; the new integration maps to AC5; source/config inspection and an actual Vercel-preset build cover AC7. No route changed; existing protected route and UI integration coverage remains passing.

## Gates and test integrity

- Author-run `npm run check` inspected independently in `/tmp/grand-cru-sync-check-final.log`: exit0 reported by coordinator, lint/typecheck clean, 39 files / **364 unit tests passed**, production build complete in36.5s.
- Author-run `npm run test:integration` inspected independently in `/tmp/grand-cru-sync-integration-final.log`: **19 passed, 0 failed, 0 skipped** in57.7s, including the new snapshot/redaction case. PostgreSQL and the application server were local; ERP credential variables were blank and all ERP responses were synthetic mocks.
- Vercel-preset build inspected in `/tmp/grand-cru-sync-vercel-build.log`: successful compilation in36.0s, followed by independent inspection of generated maxDuration300.
- Before: **337 unit /18 integration tests**, documented in `.specs/features/erp-session/validation.md:37` and line39. After: **364 unit /19 integration tests**, delta **+27 unit /+1 integration**. No tests were deleted, skipped or weakened.
- The single pre-existing fixture change at `tests/unit/erp-synchronization.test.ts:21` changes elapsed50,001 to180,001ms to match the explicitly specified new budget. Its deadline rejection and zero-query assertions remain identical. New tests additionally assert the exact boundary and final late response.

The independent verifier did not rerun the complete build/integration commands concurrently with the coordinator; it inspected their completed logs and executed the focused test suite independently in isolated scratch.

## Discrimination sensor

P0/data-integrity depth: seven behavior-level faults, one at a time, in a disposable `/tmp` archive of the exact final commit. No real ERP requests, credentials, database access or remote mutations were used. The unmodified focused baseline passed **30/30 tests across4 files** before fault injection.

| Mutation | Implementation location | Observable failure | Killed |
| --- | --- | --- | --- |
| Restore the insufficient50s budget | `server/application/erp/synchronize.ts:10` | 2 failed /28 passed; full-volume and near-limit acceptance fail | Yes |
| Change deadline `>=` to `>` | `server/application/erp/synchronize.ts:23` | 3 failed /27 passed; exact-boundary rejection fails | Yes |
| Remove post-response deadline check | `server/application/erp/synchronize.ts:29` | 1 failed /29 passed; final late response is wrongly accepted | Yes |
| Replace all wrapped source names with unknown | `server/application/erp/synchronize.ts:16` | 7 failed /23 passed; six source assertions and mapper source fail | Yes |
| Propagate arbitrary private error text | `server/application/erp/sync-failure.ts:13` | 4 failed /26 passed; exact sanitized code/message assertions fail | Yes |
| Retain the original error as cause | `server/application/erp/sync-failure.ts:20` | 2 failed /28 passed; absence-of-cause assertions fail | Yes |
| Remove authentication-pending compatibility | `server/application/erp/sync-failure.ts:27` | 2 failed /28 passed; exact compatibility code assertions fail | Yes |

**Result:** 7/7 killed, 0 survived. Every mutant reached behavior assertions, rather than failing collection/transformation. Initial scratch setup required copying generated Nuxt tsconfig files; no mutants were attempted before its baseline passed. Real-tree `git status --porcelain` matched exactly before/after the sensor; scratch was then deleted. Summary retained temporarily in `/tmp/grand-cru-sync-sensor-result.json`. No stash or mutation of real implementation/tests was used.

## Code quality and security

Changes are limited to the budget, source-aware safe diagnostics, hosting duration and their tests/evidence. The helper is reused by every source and mapper; the error boundary discards original causes and accepts only fixed source labels/known code patterns. No arbitrary method, route, URL or response body was added. Existing read-only transport and separate authentication transport remain unchanged.

Existing boundary tests remain passing: `tests/unit/erp-read-client.test.ts:9` asserts fixed-origin GET with redirects disabled; lines11–20 reject unauthorized paths and method injection. `tests/unit/erp-auth-client.test.ts:15` restricts operations to login/refresh; lines17–18 assert the sole authorized login POST and lines25–28 assert fixed refresh GET without body. No logout or ERP business-write capability was introduced.

AGENTS.md, project test requirements and the skill's coding principles were followed. No scope creep, new schema, automatic migration, unrelated refactor or unknown-to-zero fallback was introduced. Interactive UAT is not needed for this backend correction; the existing mobile interaction integration passed. Authenticated end-to-end production synchronization is deliberately not inferred from local/mock tests or a separate operational ERP read.

## Ranked gaps and lessons

None. A clean PASS generates no lesson record. SV-01/SV-02 are verified; SV-03's local snapshot/configuration gates are verified by this report. Publishing remains the coordinator's separately authorized operational step.
