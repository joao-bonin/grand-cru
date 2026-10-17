# Estado do projeto

## Decisions

- AD-001: ERP estritamente somente leitura. A aplicação não inclui login, refresh, logout ou escrita externa; usa token de servidor preexistente e GET allowlisted. O teste manual de login previamente autorizado não amplia permissões da aplicação.
- AD-002: Usuário autorizou implementação local, subagentes paralelos, testes e revisão/correção sem aprovação humana intermediária em 16/10/2026. Sem push/deploy/banco produção.
- AD-003: Parâmetros de reposição são obrigatórios e explícitos; nenhum default silencioso de 60/90 dias. Fontes e períodos desconhecidos bloqueiam resultados dependentes.
- AD-004: B2B permanece adiado; envio de pedidos permanece proibido. Futuras integrações dependem de contratos reais e não são substituídas por dados falsos.

## Handoff

Branch local codex/comprador-virtual; nada enviado ao remoto. Implementação local P1 escrita; validação final pendente, nenhuma escrita no ERP. Domínio: 62 testes direcionados aprovados; ERP: 61 mocks aprovados; UI: 35 testes unitários aprovados. Banco Docker descartável grand-cru-test-20261016 em 127.0.0.1:5433. Servidor de teste iniciado com ERP_ACCESS_TOKEN e ERP_STORE_ID vazios. Node24 temporário em /tmp/grand-cru-node24/node_modules/node-linux-x64/bin/node. Verificações consolidadas: /tmp/grand-cru-check-node24.log. Integração UI exclusiva em andamento; depois rodar purchasing.spec e suite completa. Verifier independente executando sensor em cópia isolada. Task status ainda precisa reconciliação e commits locais atômicos. US10–16 permanecem condicionais/bloqueadas; não declarar MVP completo, contratos reais de reservas/devoluções/recebimentos parciais pendentes.
