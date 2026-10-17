# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Branch local codex/comprador-virtual. Implementação da etapa local preservada em commits por entrega, de d7e41a0 a f19c546; relatório e configurações recebem commit de fechamento separado. Check Node24: lint, tipos,247 testes unitários e build aprovados. Integração local12/12 passou após correção de hidratação; sensor independente7/7 mutantes mortos, isolamento confirmado. Nenhuma escrita via API no ERP; nenhum push/deploy/banco produção. Servidor de teste parado; PostgreSQL descartável grand-cru-test-20261016 segue disponível em127.0.0.1:5433. Runtime Node24 temporário em /tmp/grand-cru-node24/node_modules/node-linux-x64/bin/node. Validation.md registra FAIL para encerramento global: fontes reais, devoluções, reservas, recebimentos parciais e histórias condicionais US10–16 pendentes. O software local P1 está testado; não declarar MVP completo. Próximo trabalho: conciliação de fontes somente leitura com contratos comprovados. .codex/ permanece preexistente não versionada.
