# RFC-017 — Fluxo automático de PR e merge no MVP

## Decisão confirmada em 18/10/2026

O usuário autorizou registrar no `AGENTS.md` que implementações do MVP podem
seguir para push, abertura de PR e merge automaticamente, sem confirmação
adicional. A intenção é manter a entrega simples e rápida. Reforçou que os
testes unitários devem estar passando.

Na mesma sessão, solicitou explicitamente commit, envio das alterações e deploy
em produção desta entrega conjunta (reposição, ajuda contextual, dashboard e
base visual). A coordenação deve concluir esse fluxo após as verificações,
sem solicitar uma nova confirmação.

## Regra permanente

- Aplicar o fluxo às implementações dentro do escopo solicitado pelo usuário.
- Antes do merge, exigir testes unitários e todas as verificações obrigatórias
  do repositório aprovados, incluindo `npm run check` e testes de integração
  locais quando houver alteração de autenticação ou persistência.
- Respeitar checks e proteções de branch, sem ignorar falhas ou contorná-los.
- Permitir que o merge acione o deploy pelo fluxo já existente; a autorização
  não modifica CI/CD nem amplia permissões de infraestrutura ou dados.

Permanecem todas as restrições de ERP somente leitura, as exceções limitadas de
autenticação, a proteção de segredos e a exigência de autenticação para dados
protegidos. A autorização dispensa novas confirmações de push, PR e merge;
não dispensa verificações obrigatórias.

## Validação

Alteração documental em `AGENTS.md` e nesta RFC; `git diff --check` aprovado.
Este registro não executa push, abertura de PR, merge ou deploy. A entrega
consolidada das implementações deve cumprir as verificações acima.
