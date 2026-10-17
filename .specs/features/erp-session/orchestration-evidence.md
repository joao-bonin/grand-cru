# ES-03 e ES-04 — evidências locais

Os testes usam credenciais e transportes sintéticos. O estado persistido e os resultados são verificados, além das chamadas aos contratos. Todos os cenários abaixo derivam da história de sessão privada renovável; não foram alteradas nem removidas as assertivas anteriores do cliente GET.

| Critério | Evidência e resultado |
| --- | --- |
| Primeiro login persistido | `tests/unit/erp-session-provider.test.ts:32` — `expect(f.stored()).toEqual({ ...tokens('login'), renewedAt: now, version: 1 })` |
| Token opaco sem TTL inventado | `tests/unit/erp-session-provider.test.ts:37` — `expect(await f.provider.getSession()).toEqual(initial())`; `:39` não chama refresh |
| Renovação na margem30s | `tests/unit/erp-session-provider.test.ts:45` — `expect((await f.provider.getSession()).accessToken).toBe('access-rotated')`, parametrizado em30s,0s e expirado |
| Par rotacionado e próxima renovação | `tests/unit/erp-session-provider.test.ts:67` — `expect((await f.provider.getSession(2)).refreshToken).toBe('refresh-next')` |
| Versão rejeitada compartilhada | `tests/unit/erp-session-provider.test.ts:59` — `expect(sessions).toEqual([f.stored(), f.stored()])`; `:60` versão2 |
| Fallback limitado | `tests/unit/erp-session-provider.test.ts:73` — access-login após ERP_AUTH_REJECTED; `:88` ERP_AUTHENTICATION_PENDING se login falhar |
| Falhas preservam o par | `tests/unit/erp-session-provider.test.ts:81` — `expect(f.stored()).toEqual(initial())`, parametrizado em500,429, transporte e resposta inválida |
| Repetição da mesma consulta GET | `tests/unit/erp-session-read.test.ts:11` — items id1; `:13` URLs idênticas; `:14` tokens access-1/access-2; `:15` GET, body ausente, redirect error |
| Segundo401 encerra | `tests/unit/erp-session-read.test.ts:20` — ERP_AUTHENTICATION_PENDING; `:21` duas consultas |
| Rota e query proibidas antes de sessão | `tests/unit/erp-session-read.test.ts:27` — ERP_READ_PATH_FORBIDDEN; `:28` provider não chamado; `:33` query inválida |
| Sem configuração | `tests/unit/erp-configuration.test.ts:10` — null para cada campo ausente; `:16` null para chave inválida; `:20` sem fallback para token fixo |
| Sync com cliente privado | `tests/unit/erp-session-routes.test.ts:26` — `expect(await sync(event)).toEqual({ status: result })`; callback em`:23` exige os dados carregados |
| Status sem segredos | `tests/unit/erp-session-routes.test.ts:39` — somente status,configured,snapshot id/data; `:40` sem conteúdo synthetic-private |
| Integração transporte + provider + banco | `tests/integration/erp-session-flow.spec.ts:40` — quatro chamadas exatas POST auth,GET negócio,GET refresh,GET negócio; `:46` par rotacionado, versão2, renewedAt definido, expiresAt nulo; `:48` ciphertext sem tokens |

O contrato real de refresh/rotação permanece uma validação operacional separada. A trava global em playwright.config.ts rejeita configuração ERP presente antes de carregar testes. Prova com ERP_USERNAME sintético: processo terminou1 com a mensagem de configuração vazia; nenhuma consulta executada. Log `/tmp/grand-cru-session-guard.log`.
