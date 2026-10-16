# Requisitos funcionais — relato dos stakeholders

Fonte: texto fornecido pelo usuário nesta conversa. A formatação foi organizada para leitura; este documento preserva o relato e não acrescenta regras de cálculo ou decisões técnicas.

## Objetivo do projeto

Hoje as informações da empresa ficam espalhadas entre ERP, PDV, CRM, bancos e sistema de compras. A maior parte das análises depende de extração manual de relatórios.

Quero criar uma camada única de gestão que consolide essas informações automaticamente e me ajude principalmente a:

- tomar decisões de compra;
- controlar estoque;
- prever fluxo de caixa;
- acompanhar o desempenho do B2B;
- reduzir tarefas operacionais manuais.

## Principal dor

Hoje a maior dificuldade não é vender.

É comprar corretamente.

Preciso entender:

- o que comprar;
- quanto comprar;
- quando comprar.

Separando claramente:

- consumo da loja;
- consumo do B2B;
- eventos;
- sazonalidades.

Hoje essa análise exige vários relatórios e muito trabalho manual.

## O que espero do dashboard

### Estoque e Compras

Visão por SKU.

Mostrar:

- estoque atual;
- estoque mínimo;
- quantidade vendida nos últimos 30, 60, 90 e 365 dias;
- giro mensal;
- cobertura de estoque em dias;
- ruptura prevista;
- excesso de estoque.

Sugestão automática:

> Comprar 12 unidades de Ventus Malbec

com base em:

- vendas da loja;
- vendas B2B;
- sazonalidade;
- estoque atual;
- prazo de reposição.

### Separação Loja x B2B

Isso é extremamente importante.

Não quero olhar apenas venda total.

Quero enxergar:

**Loja**

giro natural de consumo.

**B2B**

- comportamento de empresas;
- cestas;
- eventos;
- ações corporativas.

Muitas vezes o B2B distorce completamente a demanda.

### Fluxo de Caixa

Consolidar:

- contas a pagar;
- contas a receber;
- saldo bancário;
- extratos OFX.

Mostrar:

- projeção para 30 dias;
- projeção para 60 dias;
- projeção para 90 dias.

### CRM

Trazer do Agendor:

- oportunidades abertas;
- valor em negociação;
- previsão de fechamento;
- clientes sem contato recente.

Objetivo:

Transformar pipeline em previsão de receita.

## Segunda maior dor

Explique exatamente isso para ele:

Hoje subir pedidos de compra é extremamente operacional e cansativo.

Meu objetivo é que o sistema sugira a compra e facilite a geração do pedido.

Idealmente:

1. Sistema analisa estoque e giro.
2. Sugere compra.
3. Eu ajusto quantidades.
4. Clique em confirmar.
5. Pedido já sai pronto para o sistema de compras.

Essa automação me gera muito mais valor do que dashboards bonitos.

## O que eu perguntaria para ele

No final da conversa:

É possível chegar a uma tela onde eu veja todos os produtos que precisam ser comprados, as quantidades sugeridas e consiga gerar o pedido praticamente com um clique?

Se ele responder que sim, vocês estão falando do problema correto.

Porque, sinceramente, Sir, olhando tudo o que já conversamos sobre Grand Cru, o maior ganho não está em gráficos.

Está em criar um comprador virtual que:

- monitora estoque;
- analisa giro;
- separa B2B e loja;
- sugere reposição;
- reduz o trabalho de emitir pedidos.
