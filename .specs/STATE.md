# Estado do projeto

## Decisions

- AD-005 (17/10/2026): usuário autorizou exceção permanente exclusivamente para POST /api/auth e GET /api/auth/refresh no servidor, com persistência cifrada de tokens e data de renovação no banco do aplicativo. Logout e escritas nos dados de negócio permanecem proibidos. Esta decisão substitui apenas a proibição de login/refresh da AD-001; testes continuam usando mocks.
- AD-006 (17/10/2026): usuário autorizou publicação direta da etapa local do comprador virtual em produção; deployment final dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q READY, base 0a597f1. Essa publicação não encerra o PRD nem valida contratos reais.

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Feature atual: erp-session, implementação local concluída de login/refresh expressamente autorizada. Branch codex/comprador-virtual. Contratos/autorização8772499, transportef750d5e, cofre820fb72, correções de revisãob72641d/c1ae370, provider/wiring04b5540. npm run check Node24 repetido independentemente:337 unitários +lint+tipos+build aprovados;18 integrações PostgreSQL locais aprovadas. Verificador final PASS:12/12 critérios,7/7 mutações detectadas, isolamento e descarte confirmados; validate_state.py sem erros. Migration0002 aplicada no banco local descartável. Próximo passo publicar a sessão e migration em produção conforme autorização de publicação direta; produção atual ainda dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q (0a597f1), anterior à sessão renovável. Operação exige ERP_USERNAME/ERP_PASSWORD/ERP_TOKEN_ENCRYPTION_KEY/ERP_STORE_ID via segredos; solicitado ao usuário sem receber valores. Sem ERP real nesta implementação; nenhuma escrita de negócio. Credenciais e chave nunca lidas/exibidas. Handoff anterior do comprador preservado em seu relatório; PRD global continua com pendências de fontes e histórias condicionais. .codex/ é preexistente e não versionada.
