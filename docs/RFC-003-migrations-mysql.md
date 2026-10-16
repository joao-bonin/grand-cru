# RFC-003 — Versionamento do esquema MySQL

- **Status:** adotado na implementação da autenticação; migration inicial validada em MySQL local.
- **Relacionadas:** [RFC-001](RFC-001-mvp-grand-cru.md) e [RFC-002](RFC-002-base-desenvolvimento.md).

## Contexto

O usuário solicitou uma recomendação de biblioteca para versionamento do banco de dados. MySQL é a escolha inicial do projeto; o serviço de banco e o modelo de dados ainda não foram definidos.

## Recomendação

Utilizar Drizzle ORM com Drizzle Kit para definir o esquema em TypeScript e gerar migrations SQL. As migrations e os metadados necessários à ferramenta devem acompanhar o código no Git.

Essa escolha favorece integração com TypeScript e revisão explícita das alterações SQL. Após autorização para implementar usuários e instalar as dependências necessárias, Drizzle ORM, Drizzle Kit e o driver `mysql2` foram instalados. O esquema e a migration inicial criam `users` e `login_attempts`; a aplicação da migration foi verificada duas vezes no MySQL local, sem recriar tabelas.

## Diretrizes propostas

- Gerar e revisar migrations antes de aplicá-las.
- Não modificar migrations já aplicadas em ambientes compartilhados; evoluir por uma nova migration.
- Testar a lógica da aplicação com testes unitários e validar migrations com testes de integração em MySQL.
- Não executar migrations automaticamente em cada inicialização ou instância da aplicação na Vercel.
- Tratar mudanças destrutivas, recuperação e compatibilidade entre versões da aplicação como parte do plano de publicação.

## Pendências

- Definir o serviço MySQL e a estratégia de conexões compatível com a hospedagem.
- Modelar os dados de negócio após a análise dos requisitos funcionais e do contrato da API do ERP; usuários já possuem modelo inicial.
- Definir o fluxo de aplicação de migrations, permissões, backups e testes de integração antes do uso em produção.
