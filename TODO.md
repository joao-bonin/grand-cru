# Pendências

- [x] Iniciar a base Nuxt/Vue com TypeScript e instalar as dependências de desenvolvimento.
- [x] Criar a página `/hello-world` com testes unitários.
- [x] Preparar o workflow de CI com lint, análise de tipos, testes unitários, build e job de integração MySQL/Chromium; acompanhar RFC-007.
- [ ] Validar a execução do workflow no GitHub e configurar as verificações obrigatórias na branch `main`.
- [x] Implementar autenticação JWT, autorização e telas de login e usuários com testes unitários e integração MySQL local; acompanhar `docs/RFC-004-autenticacao-autorizacao.md`.
- [x] Entregar dashboard administrativo e gestão de usuários internos com busca, filtros, cadastro, edição, ativação/inativação e exclusão confirmada; acompanhar RFC-009.
- [x] Adotar Drizzle ORM com Drizzle Kit e validar a migration inicial no MySQL local.
- [ ] Provisionar as contas reais usando `npm run user:create-admin` para o primeiro administrador e a tela de usuários para as demais contas.
- [ ] Conectar o PostgreSQL Aiven de produção, configurar as variáveis seguras e o fluxo de migrations na hospedagem.
- [ ] Adicionar ao projeto a skill para elaborar a PRD inicial: confirmar o nome e a origem da skill mencionada como TLC, verificar a licença e instalá-la em `.agents/skills/<nome-da-skill>/SKILL.md`.
- [x] Receber e registrar os requisitos funcionais dos stakeholders em `docs/requisitos-funcionais-stakeholders.md`.
- [x] Concluir a análise prévia e registrar prioridades, dependências e perguntas na RFC-008.
- [ ] Identificar o sistema de compras, o contrato para gerar pedidos e as regras de classificação Loja/B2B/eventos.
- [ ] Definir parâmetros e fórmulas de estoque/reposição, com amostras representativas para validação.
- [ ] Detalhar fontes e regras de caixa 30/60/90 dias e integração com Agendor.
- [ ] Elaborar a PRD inicial a partir dos requisitos recebidos, usando a skill selecionada.
- [x] Receber o link da documentação da API do ERP: https://mercado.varejofacil.com/api/v1/docs.
- [ ] Liberar `mercado.varejofacil.com` na configuração de rede do ambiente, consultar a documentação e complementar os requisitos da integração. A tentativa inicial foi recusada pelo proxy com HTTP 403 no túnel CONNECT; o conteúdo não foi acessado.
- [ ] Criar a conta na Vercel.
- [ ] Configurar o projeto na Vercel: conectar o repositório GitHub e definir os ambientes de preview e produção.
- [ ] Retomar o provisionamento na Vercel, pausado pelo usuário após a preparação local; acompanhar RFC-006.

Consulte `docs/RFC-001-mvp-grand-cru.md` para as decisões e demais pontos em aberto do MVP.

- [ ] Configurar URI PostgreSQL e CA TLS no projeto Vercel, gerar JWT de produção, aplicar migrations PostgreSQL e criar administrador; acompanhar RFC-010.
