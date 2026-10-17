# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Feature erp-session concluída, revisada e publicada. Branch codex/erp-session, separada porque o PR2 já foi integrado à main (548984e; mesmo código de0a597f1). Código publicado e99d545, migration0002 confirmada em dpl_HujoWDdRYvZWHTsewqed5qQv4axo; publicação final normal dpl_H7Hv65zYKfjKRjTZmWE48EVkKRdb READY no alias grand-cru-iota.vercel.app. Sem migration/reset de senha no build normal. Check independente337 unitários+lint+tipos+build,18 integrações locais,12/12ACs,7/7mutantes, validate_state PASS. Sem ERP real na implementação/testes/publicação. Nenhuma escrita de negócio. Os campos ERP_USERNAME,ERP_PASSWORD,ERP_TOKEN_ENCRYPTION_KEY,ERP_STORE_ID ainda faltam em Production (listagem apenas de nomes); integração permanece desabilitada, próximo passo usuário configurar segredos e nova publicação para ativar. Não pedir valores secretos no chat. Token/refresh serão cifrados em erp_sessions com data, versão e lock. PRD global do comprador continua com pendências de fontes; não declarar MVP completo. .codex/ preexistente não versionada.
