# RFC-015 — Dashboard de estoque e compras

## Pedido confirmado

O usuário informou que não encontrou o dashboard de negócio na versão publicada. A visão geral de usuários existente não atende a esse objetivo. Foi solicitada a implementação com acesso visível e a publicação após as verificações automáticas. A validação real do ERP permanece adiada por determinação do usuário.

## Implementação

- Página autenticada Dashboard, acessível pelo menu de administradores e consultores. Por pedido confirmado do usuário em 20/10/2026, é também a página inicial: o login abre `/dashboard`, e o acesso autenticado a `/` redireciona para ela, substituindo a entrada no histórico. “Visão geral” foi omitida do menu e da página inicial. A marca Grand Cru e o retorno “Início” também abrem o dashboard. A administração continua no menu Usuários para administradores.
- Indicadores de produtos acompanhados por loja, produtos com reposição sugerida, risco de ruptura dentro do horizonte da política e cálculos pendentes. Cada indicador informa quantos produtos puderam ser avaliados.
- Gráfico com legenda textual: reposição, sem reposição sugerida e cálculo pendente. Não depende de hover ou apenas de cor.
- Prioridades por produto/loja: estoque disponível e mínimo, cobertura, ruptura projetada, sugestão, excesso e vendas observadas em 30/60/90/365 dias. Busca, filtro por loja e paginação local.
- Data de referência explícita: os cálculos usam o instante da versão de estoque salva, e não a data em que alguém abriu o dashboard. Isso evita recalcular silenciosamente com uma base envelhecida.
- Caso de uso com fontes injetadas e agregação no domínio puro. A API exige a sessão antes de consultar o repositório local. Nenhuma chamada ao ERP ocorre ao abrir o dashboard.

## Limites e honestidade dos dados

Sem versão salva, o estado é “Aguardando a primeira atualização”, sem métricas zeradas. Uma versão vazia é um estado distinto, com contagens conhecidas iguais a zero. Indicadores sem base calculável são “Indisponível”; resultados parciais exibem denominador e pendências. Identidades duplicadas na mesma loja bloqueiam o cálculo. Produtos/lojas e unidades diferentes nunca têm suas quantidades somadas. Histórico parcial fica identificado; cobertura sem consumo médio positivo não é inventada.

Giro, financeiro, CRM e demanda B2B integrada não são exibidos como dados prontos. O domínio B2B inicial não fornece ainda uma fonte integrada para este dashboard. A validação real de estoque/reservas, documentos/devoluções, compras parcialmente recebidas e parâmetros de produto/custo segue pendente.

## Validação

Testes unitários cobrem ausência versus versão vazia, data determinística, denominadores parciais, falta de política, estoque desconhecido, identidade por loja, duplicidades, histórico parcial, fonte injetada, navegação e tratamento de falha. Evidências de navegador e verificações finais são registradas junto à entrega. Testes usam dados sintéticos e não validam os contratos reais do ERP.
