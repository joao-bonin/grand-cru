# Sessão da integração ERP

## Problem Statement

Um access token configurado manualmente não mantém a integração funcionando após expiração. O usuário autorizou exclusivamente autenticação e renovação de sessão, preservando a proibição de escrita de negócio e logout.

## Out of Scope

Logout, escrita de negócio, configuração pública de segredos, cron, alteração das fórmulas de reposição e testes com ERP real. Publicação e migration de produção desta mudança exigem ação explicitamente autorizada, distinta dos testes locais.

## Assumptions & Open Questions

| Area | Chosen default | Rationale |
| --- | --- | --- |
| Expiração | Usar exp numérico do access token JWT somente como pista de agendamento; tokens opacos têm expiresAt nulo e renovam após 401 | Contrato não informa TTL; nenhuma validade fixa inventada |
| Refresh inválido | Apenas rejeição 401/403 permite um novo login; timeout, 429, 5xx e JSON inválido falham sem fallback | Evitar tempestades de login e preservar diagnóstico |
| Persistência | AES-256-GCM com chave exclusiva de 32 bytes em base64; par cifrado e datas em PostgreSQL local do aplicativo | Tokens são credenciais; banco não deve conter texto puro |
| Concorrência | Lock transacional por identidade da integração; versão monotônica | Vercel usa múltiplas instâncias e refresh pode rotacionar |
| Perguntas abertas | Nenhuma decisão de produto bloqueante; formato real de refresh e rotação continuam sem teste operacional | Implementação valida estritamente o par accessToken/refreshToken e falha de forma segura |

Open questions: none. A aceitação operacional da resposta real de refresh será validada separadamente, sem presumir que testes com mocks a comprovem.

## User Stories

### US01 — Sessão privada e renovável

Acceptance Criteria:

- WHEN a sessão não existe, the server SHALL obter um par não vazio accessToken/refreshToken usando somente POST na origem fixa `/api/auth` com username/password privados.
- WHEN a sessão precisa de renovação, the server SHALL usar somente GET `/api/auth/refresh`, com refreshToken sem Bearer no Authorization, sem seguir redirects, com timeout de 15 segundos e corpo limitado a 64 KiB.
- WHEN há erro de transporte, status ou resposta inválida, the server SHALL retornar somente código sanitizado, sem corpo, token ou credenciais.
- WHEN a sessão é salva, the repository SHALL persistir o par cifrado com nonce aleatório, versão, expiresAt anulável e renewedAt, sem texto puro no banco.
- WHEN o conteúdo cifrado, a identidade ou a chave são inválidos, the repository SHALL falhar sem realizar autenticação nem substituir a sessão anterior.
- WHEN duas instâncias precisam renovar a mesma versão, the provider SHALL renovar uma vez sob lock e reutilizar a versão mais recente, preservando pares rotacionados.
- WHEN a expiração conhecida está a até 30 segundos, the provider SHALL renovar antes da consulta; WHEN a validade é desconhecida, the provider SHALL reutilizar a sessão até receber 401.
- WHEN refresh retorna 401/403, the provider SHALL fazer no máximo um login substituto; WHEN há outra falha, the provider SHALL preservar a sessão anterior e não executar login substituto.
- WHEN uma consulta permitida recebe 401, the read wrapper SHALL renovar a versão rejeitada e repetir somente a mesma consulta uma vez; uma segunda resposta 401 termina com ERP_AUTHENTICATION_PENDING.
- WHEN a rota ou query não é permitida, the read wrapper SHALL recusar antes de login, refresh ou consulta; todas as consultas de negócio permanecem GET sem body, sem logout e sem origem configurável.
- WHEN a configuração está incompleta, the sync route SHALL retornar 503 antes de qualquer transporte; usuário não administrador recebe 403, sem sessão recebe 401 e origem inválida recebe 403.
- WHEN o status da integração é consultado, the server SHALL expor somente configured e os metadados já públicos da sincronização, nunca tokens, credenciais ou ciphertext.

## Requirement Traceability

| ID | Requirement | Status |
| --- | --- | --- |
| ES-01 | Transporte fechado e respostas sanitizadas | verified |
| ES-02 | Cofre cifrado com datas e lock distribuído | verified |
| ES-03 | Renovação e repetição limitada | verified |
| ES-04 | Integração privada nas rotas e operação | verified |

## Execution Plan

1. Registrar autorização e contratos em AGENTS.md, RFC-011, STATE.md e `server/application/erp/session-contracts.ts`. Verificação: spec estrita e diff; commit docs(erp).
2. Implementar `server/infrastructure/erp/auth-client.ts` e testes unitários de transporte. Verificação: unitários direcionados; commit feat(erp).
3. Implementar cofre, schema/migration e repositório de sessão com testes unitários e integração local de concorrência. Verificação: testes direcionados; commit feat(erp).
4. Implementar provider, wrapper, configuração e wiring das rotas; testes de fluxo e regressão da fronteira GET. Verificação: unitários e integração local; commit feat(erp).
5. Atualizar operação/env, rodar check e integração completos e revisão independente com sensor isolado. Verificação: gates e relatório PASS local; commit test(erp).

## Design

Contratos injetáveis separam transporte, armazenamento e provider. O banco guarda uma linha por hash da identidade do login, sem armazenar senha. O lock da sessão é distinto do lock da sincronização e obtido apenas ao verificar/renovar tokens; consultas de negócio ocorrem fora dele. Chave inválida interrompe o fluxo. A rota não oferece endpoint de autenticação ERP ao navegador. Não reaproveitar o segredo JWT do aplicativo para cifrar tokens.

O lock aguarda até35 segundos: até15s para refresh,15s para um login substituto e5s de margem. Não limitar a espera abaixo da duração válida da operação protegida.

## Context

Autorização expressa do usuário em 17/10/2026 para login e refresh, inclusive persistência de tokens e data de renovação. Segurança, limites e defaults acima são escolhas técnicas dentro desse escopo. Contrato público preservado em `/tmp/grand-cru-swagger.yaml` e RFC-011: resposta do refresh sem schema; aceitar somente um par válido, sem presumir token rotacionado ausente. Validação operacional permanece separada da prova com mocks.

## Execution Status

- Passo1 concluído: autorização e contratos, commit8772499; spec estrita e diff aprovados.
- Passo2 concluído:35 testes unitários, lint e tipos direcionados aprovados; evidências em transport-evidence.md. Sem chamadas ao ERP real.
- Passo3 concluído:12 testes unitários de cifra e4 testes PostgreSQL locais aprovados; evidências em storage-evidence.md. Migration0002 aplicada somente no banco descartável.
- Correção da revisão de transporte: respostas rejeitadas agora abortam fetch e cancelam o corpo pendente;38 testes direcionados aprovados, sem alterar testes existentes.
- Correção da revisão de concorrência: lock35s e teste de renovação6s; cinco testes PostgreSQL de persistência aprovados.
- Passo4 concluído: provider, wrapper, configuração e rotas conectados;337 unitários e18 integrações locais aprovados. Evidências em orchestration-evidence.md; check com lint,tipos,build aprovado.
- Passo5 concluído: documentação/env e proteção global dos testes atualizados; check independente337 unitários, lint,tipos,build aprovados;18 integrações locais;12/12 critérios e7/7 mutações comprovados pelo verificador. validation.md e validate_state.py confirmam PASS no escopo local, sem atribuir validação ao ERP real.
