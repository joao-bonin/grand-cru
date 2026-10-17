# ES-01 — Evidência do transporte

PASS local em 17/10/2026. Node 24.19.0, Vitest 5.0.4: 35 testes aprovados, nenhum ignorado. ESLint direcionado e `vue-tsc --noEmit` aprovados. Nenhuma chamada ao ERP real; todos os transportes usam fetch mockado e credenciais sintéticas.

Comando: `PATH=/tmp/grand-cru-node24/node_modules/node-linux-x64/bin:$PATH npx vitest run tests/unit/erp-auth-client.test.ts`.

| Critério ES-01 | Asserção |
| --- | --- |
| Somente login/refresh, origem fixa, POST de login, JSON e redirects bloqueados | `tests/unit/erp-auth-client.test.ts:15`, `tests/unit/erp-auth-client.test.ts:17` |
| GET refresh com token cru e sem body | `tests/unit/erp-auth-client.test.ts:25`, `tests/unit/erp-auth-client.test.ts:28` |
| Argumentos extras não alteram destino, operação ou método | `tests/unit/erp-auth-client.test.ts:35` |
| 401/403 rejeitados; 429/500/302 sanitizados, sem repetição | `tests/unit/erp-auth-client.test.ts:42`, `tests/unit/erp-auth-client.test.ts:43` |
| Erro de transporte sem segredo nem causa original | `tests/unit/erp-auth-client.test.ts:50`, `tests/unit/erp-auth-client.test.ts:51` |
| Par obrigatório, tipos, conteúdo vazio, limite de token 16 KiB e header injection | `tests/unit/erp-auth-client.test.ts:56`, `tests/unit/erp-auth-client.test.ts:61`, `tests/unit/erp-auth-client.test.ts:62` |
| Limite de 64 KiB declarado e efetivo; stream excedente cancelado | `tests/unit/erp-auth-client.test.ts:75`, `tests/unit/erp-auth-client.test.ts:77` |
| Corpo exatamente 64 KiB aceito | `tests/unit/erp-auth-client.test.ts:82` |
| Stream interrompido e UTF-8 inválido sanitizados | `tests/unit/erp-auth-client.test.ts:88`, `tests/unit/erp-auth-client.test.ts:89` |
| Timeout 15 segundos cobre fetch e corpo, aborta e não repete | `tests/unit/erp-auth-client.test.ts:98`, `tests/unit/erp-auth-client.test.ts:101`, `tests/unit/erp-auth-client.test.ts:102`, `tests/unit/erp-auth-client.test.ts:103` |
| Timer liberado após sucesso | `tests/unit/erp-auth-client.test.ts:109`, `tests/unit/erp-auth-client.test.ts:111` |
| exp numérico é pista de agendamento; inválido/opaco retorna null | `tests/unit/erp-auth-client.test.ts:116`, `tests/unit/erp-auth-client.test.ts:120` |

Limite: estes testes provam o contrato local fechado e a sanitização, não o formato operacional da resposta real de refresh. A leitura do payload JWT não verifica assinatura nem autentica a aplicação.
