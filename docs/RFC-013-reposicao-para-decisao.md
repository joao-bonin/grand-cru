# RFC-013 — Reposição concisa para decisão de compra

## Direção confirmada em 18/10/2026

O usuário avaliou a produção como carregada de informações e pediu levantamento
e implementação de uma experiência enxuta, funcional e breve para tomar decisões.
Aceitou priorizar o que exige compra e recolher pendências e justificativas.

## Levantamento

A produção já reúne login, usuários, integração de leitura com o ERP, reposição
e revisão/histórico de rodadas locais. A tela de reposição combina sincronização,
avisos globais, filtros e cartões de produtos. A paginação de 20 itens reduz a
carga por página, mas não distingue o que pode ser comprado de dados bloqueados
ou produtos sem necessidade de compra. A revisão encontrou detalhes de versão,
parâmetros e avisos competindo com a ação principal. Este levantamento verifica
o código publicado; não mede o banco nem comprova duplicidade nos dados reais.

## Requisitos mínimos implementados

1. Abrir em **Para comprar**: somente sugestão positiva, disponível e sem
   pendências. Aplicar esse filtro ao conjunto completo antes da paginação.
2. Oferecer **Pendências** e **Todos**, com indicação da visão ativa. Uma lista
   vazia de compras orienta a consultar essas visões; não implica ausência de
   problemas nos dados.
3. Mostrar produto, loja, fornecedor, quantidade sugerida e risco de ruptura
   quando conhecido. Manter SKU, parâmetros e memória de cálculo em detalhe
   fechado inicialmente. A seleção e a revisão continuam como ação principal.
4. Manter busca visível; recolher fornecedor e risco em **Mais filtros**,
   sinalizando filtros ativos. Preservar paginação e limpar a seleção ao mudar
   visão, página ou filtros.
5. Mostrar data da atualização e ação de atualizar em formato compacto. Recolher
   detalhes de versão. Falhas, ausência de configuração e atualização em curso
   permanecem visíveis fora dos detalhes.
6. Recolher o resumo de pendências globais abaixo da ação de revisão. Produtos
   bloqueados continuam sem seleção e podem ser consultados na visão Pendências.

## Limites preservados

Esta mudança organiza a apresentação. Não muda fórmulas, não transforma dados
desconhecidos em zero, não completa parâmetros por suposição e não envia pedidos.
Não altera autenticação, persistência ou contratos do ERP. A consulta sem filtros
continua completa para preparação de rodadas. B2B, financeiro, Agendor e validação
dos contratos reais continuam com as pendências já registradas. O pedido de
simplificar a tela não cancela esses requisitos nem encerra o PRD.

## Validação

- `npm run check` consolidado aprovado: lint, tipos, 429 testes unitários e build.
- Testes cobrem o filtro positivo/disponível antes da paginação, manutenção da
  consulta completa, rejeição de filtro inválido, troca de visão com limpeza de
  seleção, produtos bloqueados, detalhes fechados e falhas visíveis.
- Se a consulta de uma visão falha, os resultados anteriores são identificados
  como preservados e a seleção/revisão fica bloqueada até a consulta funcionar.
- `git diff --check` aprovado. CSS preserva áreas de toque de 44px e permite
  quebra de linha nos controles e nas três visões.
- Navegação e apresentação em Chromium foram conferidas com dados sintéticos
  junto à RFC-016. A consulta a dados de produção não foi executada. Não houve alteração de
  autenticação/persistência, migration nem acesso ao ERP.

A publicação segue a autorização de entrega da RFC-017; o resultado externo deve
ser conferido no PR e na hospedagem, sem equivaler a validação das fontes reais.

## Correção da seleção antes da hidratação — 18/10/2026

A revisão do CI encontrou falha ao marcar um produto imediatamente após abrir a
página pelo servidor: o navegador exibia a caixa marcada, mas a revisão não
recebia a seleção. O componente anterior renderizava o checkbox habilitado no
HTML SSR, antes de Vue conectar `v-model` e o evento de seleção. Um novo teste
com `renderToString` reproduziu essa janela no código anterior.

A seleção agora permanece desabilitada até `onMounted`. Após a hidratação,
as regras de disponibilidade e carregamento continuam valendo; nenhuma
pendência foi removida ou contornada. A regressão também hidrata o HTML real
do componente e comprova que o primeiro clique entrega a identidade completa.
Os testes de limpeza por página e filtros passaram a comprovar a seleção antes
de verificar seu descarte.

O cenário de integração de usabilidade foi adaptado à decisão de abrir em
**Para comprar**: a fixture contém 43 produtos, dos quais um está bloqueado,
portanto a primeira visão totaliza 42. O teste seleciona nessa visão, muda para
**Todos**, verifica os 43 produtos e a seleção limpa, seleciona novamente e
mantém as asserções de paginação, busca e bloqueio do SKU com pendência.

Validação: 19 testes direcionados de lista, paginação, ajuda e SSR/hidratação
passaram; lint direcionado e `git diff --check` passaram. Um ensaio Chromium
independente, com o componente real, dados sintéticos e JavaScript retido até
liberação explícita, confirmou que não há seleção antes da hidratação, que o
primeiro clique posterior habilita a revisão e que trocar de visão limpa a
seleção enquanto o produto bloqueado permanece desabilitado. Nenhum erro ou
aviso no navegador e nenhuma chamada externa foram observados. O harness não
inicializou Nuxt, banco ou ERP e não constitui execução da suíte PostgreSQL de
integração; essa suíte segue como verificação obrigatória no CI.
