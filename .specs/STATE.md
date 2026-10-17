# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Feature replenishment-usability implementada, aguardando Verifier independente/sensor. Branch codex/erp-session, baseline d6552d2; tarefa1 a9f6925 paginação local20 com filtros globais, fornecedores globais e seleção por página; tarefa2 4f7ad70 tradução e agrupamento de pendências sem alterar domínio; tarefa3 contraste/tema claro e formulário agrupado, ações no celular, imagens sintéticas. Spec/evidências em .specs/features/replenishment-usability e RFC-012. Check PASS388unitários+lint+tipos+build;20integrações locais PASS39,7s. Fonte#shared corrigida no build e controles48px satisfazem gate44px. Nenhum teste anterior alterado/enfraquecido. Nenhuma autenticação/consulta de negócio/escrita no ERP nesta feature; apenas documentação pública GET confirmando start/count.

Próximo: commit da tarefa3, Verifier novo com sensor scratch e validate_state. Servidor node-server local ativo para testes (sessão8519), PostgreSQL local descartável grand_cru_release_test:5433; parar servidor ao terminar. Logs /tmp/grand-cru-ux-check-final.log e /tmp/grand-cru-ux-integration-final.log. Capturas em docs/screenshots/user-form-{mobile,desktop}.png e replenishment-pagination-mobile.png. Depois registrar revisão, push/PR3 e publicar conforme autorização persistente. Produção anterior dpl_4kCfaxAVTLUKjCEQJ9k6A2XspCqJ READY no alias grand-cru-iota.vercel.app. Migration0002 já aplicada, nenhuma nova migration. Não ler segredos nem forjar sessão admin de produção; PR3 não deve ser merged automaticamente. .codex/ preexistente não versionada.
