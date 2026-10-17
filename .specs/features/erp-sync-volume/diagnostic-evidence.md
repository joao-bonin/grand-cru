# Evidência do diagnóstico — tarefa 2

17/10/2026. Testes somente com mocks ERP e PostgreSQL local descartável.

- 364 testes unitários aprovados (baseline337; +6 orçamento, +12 redação, +9 contexto).
- Testes verificam falha em cada uma das6 fontes, interrupção sem fontes posteriores, erro no mapeamento do estoque, compatibilidade da autenticação pendente e descarte de mensagem/cause privados.
- Integração direcionada: `npm run test:integration -- tests/integration/erp-sync-errors.spec.ts`, 1/1PASS com PostgreSQL17 local. Todos os segredos ERP vazios.
- A integração publica um snapshot sintético, provoca prazo esgotado no estoque e erro privado em cupons; compara snapshotId, conteúdo completo e contagem de snapshots. A mensagem persistida é exata e sanitizada.
- ESLint sem avisos e typecheck aprovados na reexecução do check. Build completo e integração completa serão registrados na validação final.
- Nenhuma alteração nos contratos de transporte, autenticação, paginação ou mapeadores; nenhuma escrita no ERP.
