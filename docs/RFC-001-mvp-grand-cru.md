# RFC-001 — Requisitos e arquitetura do MVP Grand Cru

- **Status:** proposta para revisão; não representa implementação.
- **Escopo:** consolidar os requisitos e as decisões discutidas para o primeiro MVP.

## Objetivo

Criar uma camada única de gestão que consolide ERP, PDV, CRM, bancos e sistema de compras. O foco principal é apoiar o comprador: decidir o que, quanto e quando comprar, separar demanda da loja/B2B e facilitar a geração de pedidos após revisão e confirmação. Dashboards, projeção de caixa e CRM apoiam essa gestão. Os requisitos dos stakeholders e a análise prévia estão na RFC-008.

Os dados deverão ser atualizados por sincronização agendada e manual. A integração com uma LLM para perguntas permanece prevista, com escopo em aberto. O público inicial será de três usuários, com prioridade para uso no celular e para a usabilidade.

## Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | Autenticar usuários e restringir dashboards e APIs a usuários autenticados. |
| RF-02 | Integrar pela API do ERP, fonte central dos dados do sistema, para obter os dados necessários aos dashboards. Documentação informada: https://mercado.varejofacil.com/api/v1/docs. |
| RF-03 | Atualizar os dados por execução agendada, sem depender de webhooks do ERP. |
| RF-04 | Permitir solicitar atualização dos dados por um botão na interface. |
| RF-05 | Exibir dashboards e gráficos com os dados sincronizados do ERP. |
| RF-06 | Disponibilizar uma interface para perguntas por meio de integração com uma LLM. O escopo das perguntas e os dados acessíveis à LLM ainda serão definidos. |

RF-07 a RF-16, incluindo estoque por SKU, recomendação de compra, preparação de pedidos, caixa 30/60/90 dias e CRM Agendor, estão detalhados na RFC-008. Indicadores solicitados já foram identificados; fórmulas, contratos, filtros e regras ainda precisam de definição.

## Requisitos não funcionais

### Usabilidade e experiência mobile

- O celular será o dispositivo prioritário no MVP, com interface responsiva também para tablets e computadores.
- Usabilidade e apresentação agradável serão prioridades de produto.
- A navegação deve ser simples, com filtros e controles adequados ao toque.
- Os gráficos devem ser legíveis em telas pequenas; informações essenciais não devem depender exclusivamente de hover.
- Tabelas e dashboards devem ter apresentação adaptada ao celular, evitando apenas reduzir o layout de desktop.
- A interface deve oferecer feedback claro de carregamento, atualização, sucesso e erro.

### Testes e qualidade

- DDD e premissas básicas de Clean Code são diretrizes obrigatórias para todo o código, conforme a RFC-005.
- Testes unitários são obrigatórios em todo o projeto: cada funcionalidade nova ou correção deve vir acompanhada dos testes correspondentes.
- A cobertura deve incluir regras de negócio, cálculos dos dashboards, autenticação, lógica de sincronização, integração com ERP e LLM usando mocks, e comportamento dos componentes.
- A meta percentual de cobertura ainda será definida. A base utiliza Vitest e Vue Test Utils; a obrigação de testar não depende de uma meta percentual.
- Testes unitários não comprovam por si só o funcionamento de serviços externos; verificações de integração e do fluxo completo são recomendações complementares, com escopo a definir.

### Segurança

- A autenticação utilizará JWT.
- Dashboards e APIs que tratem dados do projeto devem exigir autenticação válida.
- Recomenda-se expiração dos tokens e armazenamento em cookies HttpOnly e Secure. Renovação, logout, proteção contra CSRF e política de sessão serão detalhados antes da implementação.
- Credenciais do ERP, da LLM e do banco de dados devem permanecer no servidor, fora do código versionado e do frontend.

### Atualização e operação

- A sincronização terá modalidades agendada e manual.
- Frequência, volume de dados, duração esperada e tratamento de falhas ainda precisam ser definidos.
- O desenho da sincronização deve considerar os limites de execução e agendamento do plano da Vercel escolhido.
- Metas numéricas de desempenho, disponibilidade e recuperação ainda não foram estabelecidas.

## Arquitetura e restrições técnicas

| Aspecto | Decisão ou proposta |
| --- | --- |
| Arquitetura | Monolito: frontend e rotas de servidor no mesmo projeto Nuxt. Não pressupõe processo servidor continuamente ativo na hospedagem. |
| Frontend e aplicação | Vue.js e Nuxt, escolhidos pelo usuário. Next.js não será a base desta proposta. |
| Banco de dados | PostgreSQL, confirmado pelo usuário para usar o recurso Aiven disponível; substitui a escolha inicial MySQL. Veja RFC-010. |
| Autenticação | JWT. |
| Hospedagem | Vercel inicialmente. |
| Base do design system | Nuxt UI, adotado na implementação das telas de login e usuários. |
| Biblioteca de gráficos | Apache ECharts, recomendado na conversa; confirmação final pendente. |
| Automação | GitHub Actions para as verificações e integração GitHub–Vercel para publicação. |

A base de desenvolvimento foi iniciada com Nuxt 4, Vue 3 e TypeScript, usando Node.js 24.19.0. Os testes unitários utilizam Vitest, Vue Test Utils e Happy DOM, com cobertura via V8. As versões exatas estão em `package.json` e `package-lock.json`. Drizzle ORM e Drizzle Kit foram adotados para persistência e migrations MySQL.

As páginas `/`, `/hello-world`, `/login` e `/users` estão implementadas. Autenticação e autorização estão detalhadas na RFC-004. Integrações e dashboards ainda serão implementados.

O esquema MySQL utiliza Drizzle ORM com Drizzle Kit, mantendo migrations no Git. A migration inicial foi aplicada e reaplicada em MySQL local; migrations não são executadas automaticamente ao iniciar a aplicação.

## Esteira de integração e deploy

Proposta para concretizar a exigência de uma esteira pelo GitHub:

1. Cada pull request executa testes unitários, análise de tipos, lint e build no GitHub Actions.
2. A integração com a Vercel disponibiliza um deploy de preview para revisão.
3. O merge na `main` deve exigir as verificações obrigatórias aprovadas.
4. A integração com a Vercel publica a versão de produção após o merge.

O workflow de verificações foi criado em `.github/workflows/ci.yml`; seus comandos foram validados localmente. A execução no GitHub, a proteção de branch e a integração com a Vercel ainda não foram verificadas nem configuradas nesta etapa. Nenhum deploy foi realizado.

## Infraestrutura adiada

Por orientação do usuário, o detalhamento da infraestrutura não é necessário neste momento. A Vercel será a plataforma inicial; isso não define um serviço MySQL disponível ou provisionado nela.

Ficam para uma etapa posterior a escolha do serviço compatível com MySQL, estratégia de conexões e migrações, backups, monitoramento e configuração dos segredos. Esses itens deverão ser resolvidos antes do uso em produção.

## Pontos em aberto

- Consultar a documentação informada da API do ERP e identificar contratos, autenticação e limites. A leitura ainda está pendente: a conexão foi recusada pelo proxy deste ambiente com HTTP 403 no túnel CONNECT, antes de acessar o conteúdo.
- Definir fórmulas e dados dos indicadores solicitados, o recorte do MVP e o contrato para geração de pedidos, conforme a RFC-008.
- Qual será a frequência de sincronização e como tratar atualizações simultâneas, falhas e dados desatualizados?
- Qual provedor e modelo de LLM serão utilizados? Que perguntas serão permitidas e quais dados poderão ser enviados?
- Provisionar as contas reais; a implementação inicial utiliza perfis `admin` e `user`, conforme a RFC-004. Ajustar as permissões se os requisitos dos stakeholders exigirem outros perfis.
- Confirmar Apache ECharts para os gráficos; Nuxt UI já foi adotado para os componentes.
- Definir eventual meta de cobertura; versões e ferramentas estão registradas em `package.json` e `package-lock.json`.
- Detalhar a infraestrutura e os limites do plano da Vercel quando essa etapa for iniciada.

## Critérios de aceitação propostos para o MVP

- Usuário autenticado consegue consultar os dashboards no celular com gráficos legíveis e controles utilizáveis por toque.
- O comprador consegue revisar produtos e quantidades sugeridas e gerar o pedido conforme o contrato do sistema de compras; critérios candidatos estão na RFC-008.
- Requisições sem autenticação válida não acessam dados protegidos.
- A sincronização agendada e a atualização manual obtêm os dados previstos do ERP, com feedback na interface para a operação manual.
- A funcionalidade de perguntas utiliza a LLM dentro do escopo e das permissões que forem definidos.
- As funcionalidades e correções possuem testes unitários pertinentes, executados pela esteira.
- Pull requests passam pelas verificações obrigatórias e a publicação segue o fluxo GitHub–Vercel definido.

Esses critérios deverão ser refinados com cenários concretos quando os requisitos funcionais restantes forem detalhados.

## Atualização de persistência — 15/10/2026

O usuário confirmou a substituição de MySQL por PostgreSQL para utilizar o serviço disponível no Aiven. As referências a MySQL nas etapas anteriores documentam o histórico. Estado atual e validações na RFC-010. A Vercel permanece como hospedagem da aplicação.
