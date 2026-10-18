# RFC-018 — Escopo autorizado e rastreabilidade das entregas

## Decisão confirmada em 18/10/2026

O usuário determinou que nenhuma funcionalidade seja inventada ou implementada
fora do que foi solicitado pelo produto. O desenvolvimento deve seguir o PRD,
as histórias e as tarefas documentadas, com `tlc-spec-driven` quando aplicável.
A decisão foi motivada por uma sugestão de lista de compras manual: ela não
estava nos requisitos autorizados e não foi implementada.

## Regra permanente

- Implementar apenas requisitos autorizados e rastreados no fluxo
  **PRD → histórias → tarefas**. Para o comprador virtual, consultar o PRD em
  `.specs/features/comprador-virtual/prd-source.md`, as histórias em `spec.md`
  e o plano de execução em `tasks.md`, no mesmo diretório.
- Novas solicitações explícitas do usuário continuam válidas e autorizam a
  mudança. Registrar a solicitação e vinculá-la às histórias/tarefas pertinentes
  antes de implementar, preservando a distinção entre decisão e proposta.
- Não converter sugestões ou hipóteses do agente em escopo aprovado. Liberdade
  de design permite escolhas de apresentação, sem autorizar novas funções ou
  regras de negócio.
- Declarar uma entrega concluída somente com os critérios de aceite atendidos
  e evidências correspondentes. Quando faltarem validações ou dependências,
  registrar o estado pendente ou parcial, mesmo que já exista código.

Os pedidos explícitos atuais de ajuda junto ao checkbox, dashboard operacional
e repaginação visual permanecem autorizados; devem manter a rastreabilidade
documental e o escopo simples definido pelo usuário. Esta decisão não redesenha
o PRD, não altera o status das histórias existentes e não cria uma nova
funcionalidade.

Permanecem a autorização de push, PR e merge automáticos após as verificações
obrigatórias, as restrições de ERP somente leitura, as exceções limitadas de
autenticação e as regras de testes, autenticação e proteção de segredos.

## Validação

Alteração documental em `AGENTS.md` e nesta RFC; `git diff --check` aprovado.
Não houve alteração de código, tarefas ou status de histórias nesta etapa.
