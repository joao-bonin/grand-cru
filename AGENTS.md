# Orientações para agentes

- Consulte `docs/RFC-001-mvp-grand-cru.md` para requisitos, decisões e pontos pendentes do MVP.
- Priorize o valor do comprador virtual: estoque e demanda separados por loja/B2B, sugestões explicáveis, revisão de quantidades e preparação do pedido. Leia o relato dos stakeholders e a análise na RFC-008; fórmulas e contratos ainda não estão aprovados. Caixa e Agendor também fazem parte dos requisitos recebidos.
- Registre em RFCs em `docs/` os requisitos, decisões, recomendações e mudanças de direção discutidos com o usuário. Atualize a RFC pertinente ou crie uma numerada; diferencie decisões confirmadas, propostas e pendências, incluindo evidências de validação quando houver implementação.
- Desenvolva um monolito com Vue e Nuxt; PostgreSQL é a escolha confirmada (substituiu MySQL) e Vercel a hospedagem prevista.
- Aplique DDD e Clean Code em todo o código, conforme a RFC-005: linguagem do negócio, domínio separado de HTTP/UI/banco, casos de uso com contratos injetáveis, invariantes centralizadas, nomes claros e responsabilidades pequenas. Evite duplicação e abstrações sem necessidade concreta.
- Priorize usabilidade no celular, layouts responsivos e gráficos legíveis por toque.
- Integre os dados pela API do ERP, fonte central dos dados, com sincronização agendada e atualização manual. Documentação informada: https://mercado.varejofacil.com/api/v1/docs. Consulte os contratos antes de implementar; não invente endpoints. A leitura da documentação ainda está pendente de liberação de rede neste ambiente.
- Exija autenticação JWT para dados protegidos e mantenha credenciais e integrações externas no servidor.
- Testes unitários são um critério obrigatório de aceite para toda funcionalidade nova ou correção. Use mocks para ERP e LLM. Execute `npm run check` antes de concluir e informe o que falhou ou não foi validado.
- Para alterações de autenticação ou persistência, execute também `npm run test:integration` com PostgreSQL local e servidor iniciado; nunca use produção. Consulte a RFC-004 para JWT, perfis e provisionamento, e mantenha migrations no Git sem executá-las automaticamente na inicialização da aplicação.
- Preserve alterações existentes. Não trate propostas ou pontos pendentes da RFC como decisões confirmadas.
