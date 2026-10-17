# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Correção erp-sync-volume em validação. Branch codex/erp-session, PR3 aberto; commits e737e04 (prazo180s/maxDuration300s) e2875643 (diagnóstico seguro por fonte). Carga original falhava em50s durante estoque; consulta operacional corrigida completa em90.146ms com232GETs,3077produtos/55fornecedores/18612saldos/2533itens de venda/0compras, somente login autorizado+GET, sem persistência. Check completo PASS (lint, tipos,364 unitários e build),19 integrações locais PASS; revisão independente sem achados e sensor7/7mutantes detectados. Preset Vercel compilado, api/erp/sync.func/.vc-config.json confirma maxDuration300. Publicação pendente. Log final de check /tmp/grand-cru-sync-check-final.log. Lock órfão Nuxt removido após confirmar ausência de processo. Fonte diagnóstica é enumeração fixa, códigos sanitizados, sem causa/corpo/segredos; falhas preservam snapshot.

Produção anterior dpl_6vCHsXBCcet2Xyg2TAkikWBUgq7d READY no alias grand-cru-iota.vercel.app, código738de99 com quatro variáveis ERP configuradas pelo usuário. Migration0002 erp_sessions já aplicada anteriormente; nenhuma migration nova. Tokens cifrados com data/versão/lock. Não recuperar valores de segredos nem forjar sessão do aplicativo para validar produção. Sem sessão admin disponível para clicar Atualizar agora; usuário precisará validar o fluxo publicado. Publicação direta já autorizada pelo usuário; PR3 não deve ser merged automaticamente. PRD global do comprador continua com pendências de fontes. .codex/ preexistente não versionada.
