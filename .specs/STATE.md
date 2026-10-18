# Estado do projeto

## Decisions

- AD-007 (18/10/2026): usuário autorizou permanentemente push, abertura de PR e merge automático do MVP, com unitários e verificações obrigatórias aprovados. Pediu também commit e deploy de produção desta entrega conjunta. Não amplia escrita no ERP, acesso a segredos ou operações em dados. RFC-017.
- AD-008 (18/10/2026): escopo deve seguir PRD → histórias → tarefas autorizadas; sugestões não viram requisitos automaticamente. Novos pedidos explícitos são documentados/rastreados. A lista manual foi sugestão rejeitada e não foi implementada. RFC-018.
- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

### 18/10/2026 — entrega conjunta e rastreabilidade

RFC-013 a016 registram os pedidos explícitos de simplificar reposição, explicar
bloqueios no botão ?, criar dashboard operacional com equipe e melhorar a base
visual preservando vinho/neutros. Continua Nuxt UI, com princípios Material;
não houve migração para Vuetify nem nova dependência. Ajuda distingue ERP,
parâmetros locais e validação da integração. Dashboard usa agregados globais,
risco desconhecido explícito, prioridades e rodadas sem autor técnico exposto.

Check consolidado PASS: lint, tipos,429 unitários e build. A importação do resumo
de usuários usa alias #shared, resolvendo erro de empacotamento encontrado no
primeiro build. Regressão SSR da seleção foi demonstrada e corrigida: checkbox
desabilitado até hidratação, primeiro clique entregue à revisão, limpeza de
seleção e bloqueios preservados. A integração de usabilidade passou a conferir
Para comprar e Todos separadamente. Chromium com fixtures validou celular e
desktop, vazio/bloqueado, contraste e popover por toque/teclado. Sem acesso ao
ERP ou banco real, sem nova migration. PostgreSQL integrado será validado no CI.

Publicação desta entrega autorizada via commit, PR/merge e Vercel; consulte o PR
e o deployment para resultado externo mais recente. O PRD global permanece
incompleto: T1,T5,T7,T11 parciais e US10–16 condicionais/adiadas. Conferir a
conciliação nos documentos de histórias/tarefas antes de iniciar nova história.

### Histórico da primeira etapa desta sessão

### 18/10/2026 — reposição para decisão de compra

Usuário pediu levantamento e implementação de uma tela mais enxuta para decidir
compras. RFC-013 registra levantamento, requisitos mínimos e limites. Branch
local codex/replenishment-decisions, baseada na melhoria publicada da branch
codex/erp-session. Abre em Para comprar (sugestão positiva e sem pendências),
com filtro global antes da paginação; Pendências e Todos preservam consulta dos
demais produtos. Detalhes de atualização, filtros extras, parâmetros e avisos
globais ficam recolhidos; erros permanecem visíveis. Troca de visão/página/filtros
limpa seleção. Falha de consulta identifica resultados anteriores e bloqueia
revisão. npm run check PASS: lint, tipos,395 unitários e build. Diff check PASS.
Sem publicação/push/migration/acesso ao ERP ou ao banco de produção nesta etapa.
Navegação de navegador e avaliação visual mobile pendentes. Não encerra PRD nem
cancela requisitos de negócio já registrados. Próximo: avaliar visualmente e
publicar quando solicitado.

### Publicação anterior

Feature replenishment-usability concluída e revisada, publicação concluída dpl_CEBC97oT88rDCQL1E1Df1ZDZs6aL READY no alias grand-cru-iota.vercel.app (fontes87ced8f, Node24.x). Branch codex/erp-session, baseline d6552d2; a9f6925 paginação20/filtros globais/seleção por página;4f7ad70 tradução e agrupamento; b1c3f8d contraste/tema claro/formulário;8750cca teste discriminante produto/loja. Revisão independente PASS13/13, sensor sem sobreviventes pendentes após F1, validate_state PASS.389unitários+lint+tipos+build e20integrações locais PASS. Fontes runtime não mudaram após20integrações; F1 só teste/doc. Capturas sintéticas desktop/mobile aprovadas visualmente e por geometria/contraste. Nenhum teste anterior alterado/enfraquecido. L-003 candidate registra lacuna de desempate já corrigida, sem promoção automática a confirmed.

Evidências commitadas em87ced8f e enviadas ao PR3, título/descrição atualizados. Alias confirmado na nova versão; login200, recomendações sem sessão401 e CSS público confirmou cor primária vinho e texto escuro. Publicação normal sem migration/reset. Próximo: usuário atualizar página e avaliar as telas; UAT humano e navegação autenticada de produção não foram executados pelo agente. Manifesto de110 arquivos runtime preparado em /tmp/grand-cru-ux-manifest.json (fonte b1c3f8d, idêntica ao runtime8750cca), sem env/docs/testes. Servidor de testes parado; PostgreSQL local preservado. Logs /tmp/grand-cru-ux-check-verified.log e /tmp/grand-cru-ux-integration-final.log. Nenhuma chamada autenticada/negócio/escrita no ERP nesta feature; somente documentação pública GET confirmando start/count. Produção anterior dpl_4kCfaxAVTLUKjCEQJ9k6A2XspCqJ READY no alias grand-cru-iota.vercel.app. Migração0002 já aplicada e nenhuma nova migration. Não ler segredos nem forjar sessão admin de produção; não merge automático do PR3. .codex/ preexistente não versionada.
