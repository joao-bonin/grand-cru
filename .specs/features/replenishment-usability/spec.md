# Reposição paginada e interface legível

## Problem Statement

A sincronização já pagina o ERP, mas a tela recebe todos os produtos e exibe milhares de códigos de pendências sem tradução. Textos pequenos e cinza de baixo contraste dificultam a leitura; o formulário de usuários precisa de campos, agrupamento e ações claros.

## Out of Scope

Escritas no ERP, alterações de fórmula, inferência de fornecedor/embalagem, mudanças de autenticação/senha/perfis, novas migrations, modo escuro e paginação da lista de usuários. Não mudar o contrato do ERP nem remover pendências que bloqueiam sugestões.

## Assumptions & Open Questions

| Decisão | Padrão escolhido | Motivo |
| --- | --- | --- |
| Paginação | Tela usa start/count com 20 itens por página na API local; ERP continua com 100 por consulta | Limitar renderização e tráfego da tela, preservar integração comprovada |
| Filtros | Aplicados no conjunto completo antes de recortar página; risco primeiro e identidade como desempate | Buscar produtos de qualquer página com ordenação estável |
| Seleção | Por página; mudar página ou filtros limpa seleção | Evitar revisão de seleção invisível ou de outro resultado |
| Contrato existente | Consulta local sem count continua completa para preparar rodadas selecionadas em qualquer página | Preservar fluxo de rodadas e consumidores atuais |
| Pendências | Resumo agrupado e tradução por produto; códigos internos preservados no domínio | Informação acionável sem alterar elegibilidade |
| Visual | Tema claro coerente com a marca vinho; texto principal escuro e secundário com contraste mínimo 4,5:1 | Pedido do usuário de eliminar cinza ilegível |
| Formulário | Agrupar identificação/segurança, perfil e status; manter payload e regras atuais | Melhorar usabilidade sem ampliar privilégios |
| Validação | Mocks ERP, PostgreSQL e navegador locais; revisão independente e captura desktop/mobile | Não tocar dados de negócio do ERP |

Open questions: none. Padrões de apresentação são escolhas reversíveis do agente dentro do pedido; autorização anterior dispensa aprovações humanas intermediárias. Demais dimensões N/A: não há novo ciclo de vida, armazenamento, autenticação ou operação externa.

## User Stories

### P1: Consultar produtos em páginas

Acceptance Criteria:

- WHEN a tela de reposição é aberta THEN the system SHALL solicitar start=0,count=20 à API local.
- WHEN o comprador avança ou volta THEN the system SHALL solicitar a página correspondente e exibir intervalo e total, com no máximo20 produtos; primeira/última página desabilitam o controle correspondente.
- WHEN filtros são alterados THEN the system SHALL voltar ao início e filtrar o conjunto completo antes da paginação, mantendo opções de fornecedor de todo o conjunto e prioridade de ruptura com desempate por produto/loja.
- WHEN página ou filtros mudam THEN the system SHALL limpar a seleção da rodada; resultados indisponíveis continuam sem seleção.
- IF a consulta falha THEN the system SHALL preservar a última resposta publicada e mostrar erro/repetição; durante carga, controles de paginação e seleção permanecem desabilitados.
- WHEN a API local recebe paginação inválida THEN the system SHALL retornar400; uma página válida sem registros retorna coleção vazia e total correto, sem consultar o ERP.
- WHEN uma rodada prepara itens selecionados fora da primeira página THEN the system SHALL continuar recuperando a consulta completa existente e validando snapshot e elegibilidade.

### P1: Entender pendências dos dados

Acceptance Criteria:

- WHEN existe PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429 THEN the presentation SHALL explicar em português que os parâmetros de compra desse SKU estão incompletos, indicando fornecedor, embalagem ou unidade como possibilidades sem afirmar qual está ausente.
- WHEN milhares de produtos têm essa pendência THEN the presentation SHALL exibir um resumo com contagem de SKUs únicos, em vez de milhares de linhas; o detalhe do produto mantém SKU e orientação de conferência sem exibir o código bruto.
- WHEN há códigos de histórico/devolução ou um código técnico desconhecido THEN the presentation SHALL mostrar explicação em português ou aviso genérico seguro, preservando pendências em linguagem natural e sem alterar os valores do domínio.

### P1: Ler e gerenciar acessos com conforto

Acceptance Criteria:

- WHEN a aplicação abre inclusive com preferência de sistema escura THEN the interface SHALL manter tema claro e textos principais/secundários com contraste mínimo 4,5:1 em seus fundos, com texto secundário de pelo menos 12px.
- WHEN o formulário de usuário é aberto em390px ou desktop THEN the interface SHALL apresentar campos em largura integral, controles de pelo menos44px, grupos de identificação/permissões, ajuda de senha/perfil e ações sem transbordamento horizontal.
- WHEN o usuário cadastra ou edita THEN the form SHALL preservar login/perfil/status e senha opcional na edição; WHILE pending the form SHALL bloquear edição, salvamento e cancelamento.

## Requirement Traceability

| ID | Entrega | Status |
| --- | --- | --- |
| UX-01 | Paginação, filtros e seleção | Verified (pagination-evidence.md) |
| UX-02 | Pendências compreensíveis | Verified (issues-evidence.md) |
| UX-03 | Contraste e formulário | Verified (visual-evidence.md) |

## Execution Plan

1. Paginação local: shared/application/replenishment-query.ts, shared/types/replenishment.ts, server/api/replenishment/index.get.ts, app/components/ReplenishmentList.vue, app/pages/replenishment.vue e testes unitários de consulta/rota/componentes/página. Gate: unitários direcionados e ESLint; commit feat(replenishment).
2. Pendências: shared/application/replenishment-issues.ts, app/components/ReplenishmentDataIssues.vue, ReplenishmentExplanation.vue e página de reposição; testes de tradução, agrupamento e renderização. Gate: unitários direcionados e ESLint; commit fix(replenishment).
3. Contraste/formulário: nuxt.config.ts, app/assets/css/main.css, dashboard.css, replenishment.css, app/components/UserEditor.vue, app/pages/users.vue, imports Nuxt #shared dos componentes de reposição e singular/plural do paginador, testes unitários de formulário e integração de paginação/contraste/mobile. Gate: npm run check e npm run test:integration com PostgreSQL/servidor local; commit fix(ui).

Correção de validação F1 concluída (check389PASS; revalidação independente PASS13/13): acrescentado teste de entrada fora de ordem com o mesmo produto em duas lojas; verificar sequência completa e recorte. Commit test(replenishment), gate npm run check. Nenhuma mudança de implementação ou de asserções anteriores.

Após o último commit: Verifier novo, sensor em scratch, validate_state e evidências. Nenhum teste anterior removido/enfraquecido. Baseline 364 unitários/19 integrações.

## Evidência da API

Swagger oficial servido pela página /api/v1/docs aponta /doc/swagger2/swagger.yaml. GET /v1/produto/produtos documenta start como posição inicial e count como quantidade; ResultListProduto expõe start,count,total,items. RFC-011 já registra o contrato e232GETs da carga real completa. Não há necessidade de login nem consulta de dados privados nesta investigação.
