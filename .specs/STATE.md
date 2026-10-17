# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Feature replenishment-usability em implementação conforme pedido de paginação, pendências em português, contraste e formulário. Branch codex/erp-session, baseline d6552d2; tarefa1 commit a9f6925: paginação local20, filtros antes do recorte, fornecedores globais, seleção por página,32 testes direcionados PASS e ESLint limpo. Contrato completo sem count mantido para rodadas. ERP já pagina por start/count100; Swagger público confirma. Nenhuma chamada autenticada nem escrita no ERP nesta feature.

Tarefa2 concluída e testada: tradutor/resumo em shared/application/replenishment-issues.ts, novo ReplenishmentDataIssues.vue, detalhe/página usando tradução; testes /tmp/grand-cru-ux-issues.log. 21 testes direcionados PASS e ESLint limpo. Próximo: tarefa3 tipografia, tema claro, layout UserEditor e screenshots/integração. Spec .specs/features/replenishment-usability/spec.md, RFC-012. Depois npm run check, servidor/PostgreSQL locais (ERPvars vazias), integração completa, Verifier novo/sensor/validate_state. Nenhum teste anterior deve ser alterado/enfraquecido. Código já publicado antes desta feature: dpl_4kCfaxAVTLUKjCEQJ9k6A2XspCqJ READY no alias grand-cru-iota.vercel.app; migração0002 já aplicada, sem nova migration. Autorização de publicar direto persiste; PR3 aberto, não merge automático. .codex/ preexistente não versionada.
