# RFC-005 — Diretrizes de DDD e Clean Code

- **Status:** diretrizes solicitadas pelo usuário para todo o código do projeto.
- **Relacionadas:** [RFC-001](RFC-001-mvp-grand-cru.md) e [RFC-004](RFC-004-autenticacao-autorizacao.md).

## Objetivo

Aplicar Domain-Driven Design (DDD) e premissas básicas de Clean Code no monolito Nuxt, mantendo a implementação compreensível e proporcional ao MVP de três usuários.

## Diretrizes obrigatórias

- Usar a linguagem do negócio para nomear conceitos, regras, operações e testes.
- Separar regras de domínio, casos de uso, infraestrutura e apresentação. Regras de negócio não devem depender de Vue, Nuxt, objetos HTTP, JWT ou detalhes do MySQL.
- Centralizar invariantes relevantes, como permissões e a preservação do último administrador ativo, evitando duplicar regras no frontend e no backend.
- Representar o estado de negócio com tipos explícitos. Empregar entidades e objetos de valor quando houver identidade, comportamento ou invariantes que justifiquem sua existência.
- Casos de uso coordenam autenticação, criação e alteração de usuários e sincronização; adaptadores cuidam de HTTP, persistência e serviços externos.
- Depender de contratos para persistência, criptografia, relógio, ERP e LLM, permitindo testes sem serviços externos.
- Tratar DTOs de entrada/saída e modelos de persistência como fronteiras; não expor hashes, segredos ou controles internos ao cliente.
- Escrever funções e componentes com responsabilidades claras, nomes descritivos e fluxos simples. Preferir retornos antecipados a níveis desnecessários de condicionais.
- Evitar duplicação de regras, números sem significado explícito, código morto e abstrações sem uma necessidade concreta.
- Não capturar erros silenciosamente; diferenciar falhas de validação, regras de negócio e indisponibilidade técnica.
- Testar comportamentos e invariantes, incluindo cenários negativos; usar testes de integração para verificar adaptadores reais. Testes unitários continuam obrigatórios.

## Limites iniciais de domínio

Os seguintes limites orientam a organização; os requisitos funcionais dos stakeholders poderão refiná-los:

| Contexto | Responsabilidade |
| --- | --- |
| Identidade e acesso | Usuários, status, autenticação, sessões e permissões. |
| Estoque e demanda | Disponibilidade por SKU, movimentos, consumo por canal e efeitos de eventos/sazonalidade. |
| Compras | Políticas de reposição, recomendações, ajustes e confirmação/geração de pedidos. |
| Integração com ERP | Obtenção, tradução e sincronização dos dados externos. |
| Indicadores e dashboards | Definição dos indicadores, cálculos e consultas. |
| Financeiro | Contas, saldos, conciliação OFX e projeções de caixa. |
| Relacionamento comercial | Oportunidades do Agendor, contatos e premissas de previsão de receita. |
| Perguntas com LLM | Orquestração das perguntas, dados permitidos e respostas. |

O contrato do ERP deve ser traduzido na fronteira de integração; mudanças externas não devem determinar diretamente o modelo de negócio do Grand Cru.

Estoque, compras, financeiro e relacionamento foram incluídos como limites candidatos após o recebimento dos requisitos da RFC-008. Essa delimitação ainda deve ser refinada; não exige serviços independentes nem implica implementação dessas funcionalidades.

## Organização e aplicação gradual

A estrutura de domínio e casos de uso será organizada por contexto conforme os comportamentos forem detalhados, sem criar pastas vazias ou hierarquias de classes apenas para cumprir um padrão. DDD não exige microsserviços: o monolito permanece a decisão de arquitetura.

A implementação inicial já separa as rotas HTTP, o serviço de autenticação com contratos injetáveis, o acesso ao banco, os serviços criptográficos e os componentes Vue. Ainda é uma base inicial: regras e fronteiras deverão ser refinadas durante a evolução, e esta RFC não declara que houve uma refatoração completa para uma arquitetura DDD.

## Critérios de revisão

- A regra está no contexto correto e possui uma única fonte de verdade?
- É possível testar a regra sem HTTP, navegador ou banco?
- O caso de uso depende de contratos, e os detalhes de infraestrutura ficam nos adaptadores?
- Nomes, tipos e erros expressam a intenção sem comentários compensando código confuso?
- A alteração inclui os testes pertinentes, mantém as verificações aprovadas e atualiza a RFC afetada?

As convenções devem melhorar clareza e manutenção; mudanças de arquitetura e novas abstrações precisam de justificativa concreta registrada em RFC.
