# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Feature replenishment-usability concluída e revisada, publicação concluída dpl_CEBC97oT88rDCQL1E1Df1ZDZs6aL READY no alias grand-cru-iota.vercel.app (fontes87ced8f, Node24.x). Branch codex/erp-session, baseline d6552d2; a9f6925 paginação20/filtros globais/seleção por página;4f7ad70 tradução e agrupamento; b1c3f8d contraste/tema claro/formulário;8750cca teste discriminante produto/loja. Revisão independente PASS13/13, sensor sem sobreviventes pendentes após F1, validate_state PASS.389unitários+lint+tipos+build e20integrações locais PASS. Fontes runtime não mudaram após20integrações; F1 só teste/doc. Capturas sintéticas desktop/mobile aprovadas visualmente e por geometria/contraste. Nenhum teste anterior alterado/enfraquecido. L-003 candidate registra lacuna de desempate já corrigida, sem promoção automática a confirmed.

Evidências commitadas em87ced8f e enviadas ao PR3, título/descrição atualizados. Alias confirmado na nova versão; login200, recomendações sem sessão401 e CSS público confirmou cor primária vinho e texto escuro. Publicação normal sem migration/reset. Próximo: usuário atualizar página e avaliar as telas; UAT humano e navegação autenticada de produção não foram executados pelo agente. Manifesto de110 arquivos runtime preparado em /tmp/grand-cru-ux-manifest.json (fonte b1c3f8d, idêntica ao runtime8750cca), sem env/docs/testes. Servidor de testes parado; PostgreSQL local preservado. Logs /tmp/grand-cru-ux-check-verified.log e /tmp/grand-cru-ux-integration-final.log. Nenhuma chamada autenticada/negócio/escrita no ERP nesta feature; somente documentação pública GET confirmando start/count. Produção anterior dpl_4kCfaxAVTLUKjCEQJ9k6A2XspCqJ READY no alias grand-cru-iota.vercel.app. Migração0002 já aplicada e nenhuma nova migration. Não ler segredos nem forjar sessão admin de produção; não merge automático do PR3. .codex/ preexistente não versionada.
