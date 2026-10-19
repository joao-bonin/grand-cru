# Estado do projeto

## Decisions

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em16/10/2026. Em19/10 autorizou também commit, merge e verificação em produção; a restrição anterior de publicação foi superada para esta entrega.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B retomado em19/10 com primeira fatia de domínio; fonte real e integração à reposição permanecem pendentes. Envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.
- AD-005: Validação real do ERP adiada pelo usuário em19/10. Nomes dos segredos ERP existem na Vercel, mas não são injetados neste executor; valores não foram lidos. Autorização pontual anterior para obter token não foi utilizada; cliente da aplicação continua somente GET.

## Handoff

Entrega de19/10: retomada persistida por conjunto completo (T11/T14), recuperação de execução abandonada e progresso na UI. Primeira fatia B2B pura (classificação explícita e compromisso/reservas) sem ativação nas recomendações reais. Check Node24.19: lint, tipos,317 testes unitários e build aprovados; integração16/16 com PostgreSQL17 descartável e ERP vazio. Revisão independente e sensor isolado de retomada aprovados; servidor do revisor encerrado. RFC-012/RFC-013 registram contratos, decisões e limites. Commit/merge/publicação autorizados; resultados externos devem ser conferidos no GitHub/Vercel. Validation.md continua FAIL para encerramento global porque fontes reais, devoluções, reservas, recebimentos parciais e histórias condicionais permanecem pendentes. Nenhuma escrita comercial ou autenticação no ERP nesta entrega. Não declarar MVP completo.
