# PRD — Comprador Virtual da Grand Cru

| Campo | Definição |
| --- | --- |
| Versão | 1.0 |
| Data | 16/10/2026 |
| Status | Documento inicial para validação de negócio e planejamento |
| Produto | Camada de gestão com foco em reposição e preparação de pedidos de compra |
| Primeira entrega | MVP de compras sugeridas com revisão e geração de pedidos |
| Público principal | Gestor/comprador da Grand Cru |

Este documento reúne todos os requisitos apresentados e distingue o escopo do MVP das evoluções do produto. Sistemas, APIs, formatos de arquivos e prazos de implantação ainda precisam ser validados. Os exemplos são ilustrativos e não representam dados reais da empresa.

## 1. Contexto e problema

As informações da empresa estão distribuídas entre ERP, PDV, CRM, bancos e sistema de compras. Grande parte das análises depende da extração de relatórios e do cruzamento manual de dados.

A principal dificuldade está em comprar corretamente: identificar o que comprar, quanto comprar e quando comprar. Vendas da loja, demandas B2B, cestas, eventos e ações corporativas têm comportamentos diferentes. Analisar apenas o total vendido pode transformar uma demanda excepcional em uma previsão recorrente e levar a compras inadequadas.

A segunda dor é a operação de emitir pedidos. Mesmo depois de decidir a compra, o gestor precisa reunir informações e lançar os itens no sistema de compras. Essa atividade consome tempo e repete trabalho já realizado na análise.

O valor central do produto está em transformar os dados disponíveis em uma decisão de reposição explicável e em um pedido pronto para execução.

## 2. Objetivos e resultados esperados

- Responder, por SKU, o que comprar, quanto comprar e quando comprar.
- Separar o consumo da loja das demandas B2B e identificar eventos e sazonalidades.
- Antecipar rupturas e sinalizar excesso de estoque.
- Reduzir extração de relatórios, montagem de planilhas e redigitação de pedidos.
- Permitir que o gestor revise uma lista de compras e gere pedidos por fornecedor.
- Na evolução do produto, consolidar o caixa e transformar o pipeline do Agendor em previsão de receita.

**Proposta de valor do MVP:** o comprador abre uma tela, entende os produtos que precisam de reposição, ajusta quantidades e gera pedidos utilizáveis no sistema atual.

**Critério central de valor:** sair dos dados de estoque e vendas para um pedido utilizável, sem montar uma planilha de análise nem redigitar seus itens.

## 3. Usuários

| Perfil | Necessidade | Ações esperadas |
| --- | --- | --- |
| Gestor/comprador | Decidir reposição e preparar compras | Consultar sugestões, ajustar quantidades, selecionar itens e confirmar pedidos |
| Operação/estoque | Identificar indisponibilidade e inconsistências | Consultar saldos, reservas, rupturas e divergências |
| Financeiro | Antecipar compromissos e disponibilidade de caixa | Consultar contas, conciliar saldos e analisar cenários financeiros na evolução |
| Comercial B2B | Antecipar demandas de empresas | Acompanhar oportunidades, eventos e previsões de fechamento na evolução |

No piloto, os papéis podem ser acumulados pela mesma pessoa. A confirmação das compras deve ser atribuída a um usuário autorizado.

## 4. Estratégia de entrega

### 4.1. MVP — fluxo completo de reposição

O MVP deve entregar um fluxo utilizável, desde a carga dos dados até a geração do pedido:

1. Importar estoque, vendas por SKU e canal, reservas e compras em aberto.
2. Identificar produtos e fornecedores de forma consistente.
3. Separar o consumo da loja do histórico e dos compromissos B2B.
4. Calcular indicadores de estoque e sugestões de reposição com regras transparentes.
5. Permitir revisão e ajuste de quantidades em uma lista central.
6. Agrupar os itens por fornecedor e gerar arquivos aceitos pelo sistema de compras.
7. Registrar a decisão e acompanhar a confirmação da importação dos pedidos.

Exportações dos sistemas existentes podem ser utilizadas para acelerar o piloto. A importação inicial será uma concessão explícita do MVP: a consolidação automática das fontes permanece como requisito da evolução.

O formato de saída deve ser validado antes de considerar concluído o fluxo. Um arquivo genérico que exija redigitação dos itens não atende ao objetivo. Se o sistema de destino não aceitar importação, será necessário avaliar uma integração mínima por API para viabilizar a entrega.

### 4.2. Evolução — automação e visão de gestão

| Frente | Entregas previstas |
| --- | --- |
| Integrações | Atualização automática de ERP, PDV e sistema de compras; envio e retorno de pedidos por API quando suportados |
| Demanda | Previsão de B2B recorrente e tratamento mais avançado de sazonalidades |
| Financeiro | Contas a pagar e a receber, saldos bancários, OFX e projeções em 30, 60 e 90 dias |
| CRM | Integração com Agendor, oportunidades, contatos e previsão de receita |
| Gestão integrada | Simulação do efeito das compras sobre o caixa e cenários de demanda |

Essa organização preserva todos os requisitos originais, mantendo o esforço inicial concentrado na decisão e na operação de compra.

### 4.3. Limites do MVP

- A compra depende de confirmação humana.
- A previsão inicial será baseada em regras e médias observáveis.
- A consulta histórica contemplará 30, 60, 90 e 365 dias quando os dados estiverem disponíveis; histórico parcial será identificado.
- O B2B será analisado separadamente. Sua demanda futura entrará inicialmente por compromissos confirmados com produto, quantidade e data.
- Eventos serão identificáveis no MVP; previsão automática de recorrência e sazonalidade será uma evolução.
- O piloto usará um escopo de estoque definido. Transferências entre locais e otimização de uma rede de estoques ficam fora dessa primeira entrega.
- Negociação com fornecedores, otimização de preços e execução de pagamentos não fazem parte do escopo solicitado.

## 5. Jornada principal do MVP

1. O comprador importa os arquivos das fontes definidas para o piloto.
2. O sistema valida as colunas, identifica duplicidades e apresenta inconsistências.
3. Após a carga válida, o sistema calcula os indicadores e as recomendações por SKU.
4. O comprador abre a lista de compras sugeridas, priorizada pelo risco de ruptura.
5. Consulta a justificativa, filtra fornecedores, ajusta quantidades e seleciona itens.
6. Revisa os totais e confirma a geração dos pedidos.
7. O sistema gera os arquivos por fornecedor e informa pendências individuais.
8. O comprador importa os arquivos no sistema de compras e registra a confirmação e o identificador externo, quando disponíveis.

Na evolução com API, os passos de importação e confirmação externa poderão ser automatizados. Uma única confirmação poderá gerar vários pedidos, conforme o número de fornecedores selecionados.

## 6. Requisitos funcionais do MVP

### RF01 — Importação e atualização dos dados

- Permitir a carga de estoque, vendas, reservas, compromissos B2B e compras em aberto pelos formatos acordados com as fontes.
- Identificar sistema de origem, data de referência, data de importação e resultado da carga.
- Validar estrutura, tipos, datas, quantidades e identificadores antes de disponibilizar os dados para cálculo.
- Exibir linhas rejeitadas e motivos, preservando o último conjunto válido quando uma carga falhar.
- Evitar duplicação de vendas, reservas e pedidos em reimportações.
- Manter visível a data de atualização de cada conjunto utilizado na recomendação.

Uma fonte não carregada ou incompleta deve ser apresentada como pendente. Ausência de dados sobre compras em aberto, por exemplo, não equivale a afirmar que não existem compras.

### RF02 — Cadastro e correspondência de produtos

- Usar um SKU de referência e mapear os códigos dos sistemas de origem e do fornecedor.
- Manter distintas as apresentações relevantes, como volume e embalagem.
- Definir a unidade de venda e a conversão para a unidade de compra.
- Permitir configurar fornecedor principal, custo, prazo de reposição, estoque de segurança, intervalo entre compras e regras de embalagem.
- Sinalizar códigos sem correspondência, sem agrupá-los automaticamente por semelhança de nome.

Produtos sem fornecedor ou identificação obrigatória podem ser analisados, mas seu pedido deve ficar pendente até a correção.

### RF03 — Separação entre Loja e B2B

- Classificar cada venda como Loja, B2B ou Não identificado.
- Exibir totais e indicadores separados por canal.
- Permitir detalhar o B2B por empresa e contexto: cestas, eventos e ações corporativas.
- Tratar evento e sazonalidade como atributos da demanda, sem criar uma segunda contabilização da venda.
- Manter registros não classificados em uma fila visível para tratamento.

Um pedido corporativo excepcional deve permanecer identificável e não pode elevar automaticamente a previsão recorrente da loja.

### RF04 — Demandas B2B e eventos confirmados

- Permitir importar ou cadastrar compromissos futuros com SKU, quantidade, data e cliente/contexto.
- Identificar a quantidade já reservada e a quantidade ainda sem cobertura.
- Considerar os compromissos no cálculo de necessidade na data correspondente.
- Remover ou ajustar o compromisso quando cancelado ou atendido.
- Evitar duplicidade quando o mesmo compromisso aparecer em mais de uma fonte.

No MVP, uma oportunidade comercial sem produtos, quantidades e datas não se transforma em demanda de compra.

### RF05 — Indicadores por SKU

| Indicador | Comportamento esperado |
| --- | --- |
| Estoque atual | Quantidade física informada pela fonte para o escopo selecionado |
| Estoque indisponível | Quantidades bloqueadas ou sem condição de venda |
| Estoque reservado | Quantidades comprometidas com demandas identificadas |
| Estoque disponível | Estoque físico menos indisponibilidades e reservas, sem descontar a mesma unidade duas vezes |
| Estoque mínimo | Limite configurado ou calculado com consumo, prazo de reposição e segurança; origem do valor deve ser visível |
| Vendas em 30, 60, 90 e 365 dias | Quantidades líquidas de cancelamentos e devoluções, discriminadas por canal |
| Consumo médio mensal | Média em unidades/mês, com janela e canal utilizados explicitados |
| Giro de estoque | Saídas no período divididas pelo estoque médio, quando houver histórico de saldos suficiente |
| Cobertura base | Estoque disponível dividido pelo consumo diário recorrente considerado, com indicação do canal |
| Ruptura prevista | Primeira data de insuficiência no saldo projetado, considerando compromissos e recebimentos nas respectivas datas |
| Excesso atual | Quantidade disponível acima do estoque alvo; compromissos e horizonte devem ser considerados na definição do alvo |
| Compras em aberto | Quantidades pendentes e datas previstas de recebimento |

O consumo mensal em unidades e o giro de estoque são medidas distintas. Quando não houver histórico de estoque médio, o giro deve aparecer como indisponível.

Histórico incompleto deve ser sinalizado. Ausência de registros não pode ser apresentada como venda zero para um período que não foi carregado. Na ausência de consumo, a cobertura deve indicar que não há base suficiente ou consumo previsto, em vez de apresentar um número arbitrário.

### RF06 — Sugestão explicável de reposição

- Calcular a quantidade sugerida por SKU usando as regras da seção 7.
- Mostrar as contribuições de Loja, B2B, eventos confirmados, estoque, compras em aberto, segurança e prazo de entrega.
- Indicar quando o produto deve ser comprado e se a entrega normal já seria posterior à ruptura prevista.
- Permitir consultar os dados e parâmetros que originaram a recomendação.
- Sinalizar baixa confiança por falta de histórico, dados desatualizados, períodos de ruptura ou parâmetros ausentes.

Exemplo de apresentação: **“Comprar 12 unidades de Ventus Malbec”**, acompanhado da justificativa e dos valores utilizados.

### RF07 — Tela de compras sugeridas

A tela deve reunir os produtos com necessidade de reposição e permitir consultar os demais SKUs para análise.

| Campo | Uso |
| --- | --- |
| Seleção | Incluir ou retirar o item da rodada |
| SKU e produto | Identificação |
| Fornecedor | Agrupamento do pedido |
| Estoque disponível e mínimo | Situação atual |
| Consumo Loja e B2B | Composição do histórico e da demanda |
| Cobertura e ruptura prevista | Priorização |
| Compras em aberto | Abastecimento já contratado |
| Quantidade sugerida | Recomendação original |
| Quantidade ajustada | Decisão do comprador |
| Custo unitário e total estimado | Valor da compra |
| Justificativa e alertas | Apoio à decisão |

As janelas de 30, 60, 90 e 365 dias podem ser consultadas no detalhe do SKU para preservar a legibilidade da lista.

O comprador deve poder filtrar por fornecedor, produto, canal de demanda, risco de ruptura e pendências. Deve poder selecionar itens em lote, editar quantidades e revisar subtotais por fornecedor e o total da rodada.

### RF08 — Ajuste e confirmação

- Preservar a quantidade sugerida original ao registrar a quantidade ajustada.
- Recalcular valores imediatamente após alterações.
- Aplicar ou validar múltiplos de embalagem e lotes mínimos.
- Permitir excluir um item da rodada sem removê-lo do cadastro.
- Solicitar confirmação antes da geração dos pedidos, exibindo o resumo.
- Registrar usuário, data, itens, parâmetros e decisões da rodada.

Mudanças nos dados de origem que afetem uma rodada aberta devem ser informadas antes da confirmação. A rodada precisa identificar a versão dos dados utilizados.

### RF09 — Geração de pedidos por fornecedor

- Agrupar os itens selecionados por fornecedor.
- Validar os campos exigidos pelo sistema de destino.
- Gerar arquivos no formato acordado e comprovadamente importável.
- Mostrar identificador local, fornecedor, itens, valores, data e situação de cada pedido.
- Permitir informar a confirmação de importação e o identificador externo.
- Exibir o resultado individual quando houver vários fornecedores na mesma rodada.

Os totais do MVP são estimativas baseadas nos custos disponíveis. Frete, impostos e condições comerciais não informados devem ser explicitados conforme a exigência do destino, sem presumir valores finais.

### RF10 — Estados, duplicidade e recuperação

Estados mínimos: rascunho, arquivo gerado/aguardando importação, confirmado no destino e cancelado. Falhas devem ser registradas com motivo. Recebimentos parciais e encerramento serão refletidos quando informados pela fonte.

- Repetir a confirmação da mesma rodada não pode criar novos pedidos.
- Baixar novamente um arquivo deve reutilizar o pedido existente.
- Um arquivo gerado não equivale a um pedido aceito pelo sistema de compras.
- Quantidades de pedidos locais aguardando importação devem aparecer como pendência antes de uma nova emissão para a mesma necessidade.
- Pedidos pendentes de importação não podem ser tratados como recebimentos garantidos na previsão de ruptura.
- Após confirmação no destino, associar o identificador externo para evitar somar o pedido local e o pedido importado da fonte.
- Em uma falha parcial, permitir retomar apenas os pedidos pendentes.

## 7. Regras de reposição do MVP

### 7.1. Consumo e horizonte

Como configuração inicial proposta, usar os últimos 60 dias disponíveis para estimar o consumo diário da loja. A janela deve ser configurável e validada no piloto. O histórico B2B permanece separado; os compromissos futuros confirmados entram nas respectivas datas.

Períodos de estoque zerado, produtos novos e vendas extraordinárias devem ser sinalizados. O MVP não promete reconstruir vendas perdidas por ruptura. Caso não haja uma base confiável, o comprador deve poder definir parâmetros manualmente, com a origem do ajuste registrada.

Definições:

- `L`: prazo de reposição, em dias.
- `R`: intervalo entre revisões/compras, em dias.
- `H = L + R`: horizonte de abastecimento.
- `D(H)`: demanda incremental prevista no horizonte, composta pelo consumo da loja e pelos compromissos ainda não cobertos por reservas.
- `S`: estoque de segurança, em unidades.
- `M`: estoque mínimo configurado pelo negócio; usar zero nessa comparação quando não houver configuração manual.
- `A`: estoque disponível, após indisponibilidades e reservas.
- `E(H)`: recebimentos confirmados aplicáveis ao horizonte e às datas de necessidade.

```text
Estoque alvo = máximo(M, D(H) + S)
Quantidade bruta = máximo(0, estoque alvo − A − E(H))
Quantidade sugerida = quantidade bruta ajustada ao lote e ao múltiplo de compra
```

As quantidades usadas no cálculo devem estar na mesma unidade. O arquivo de compra deve aplicar a conversão para a unidade exigida pelo fornecedor.

### 7.2. Reservas e datas

As reservas já descontadas do estoque disponível não podem ser novamente incluídas como demanda incremental. O vínculo entre compromisso e reserva deve permitir verificar essa correspondência.

Bloqueios e reservas não podem descontar duas vezes a mesma quantidade. Reservas sem cobertura física ou inconsistências entre fontes devem gerar alerta e revisão, sem produzir uma recomendação apresentada como confiável.

A fórmula resume a quantidade total, mas a avaliação de ruptura deve ocorrer por data. Um recebimento posterior à necessidade não elimina uma ruptura anterior. Quando a compra pelo prazo normal não resolver o risco, indicar urgência e necessidade de ação do comprador.

### 7.3. Estoque mínimo, alvo e excesso

- Um mínimo configurado pelo negócio deve permanecer identificável e não ser sobrescrito silenciosamente.
- Na ausência de mínimo configurado, pode-se propor um mínimo baseado no consumo durante `L` mais `S`, sinalizando sua origem calculada.
- O estoque alvo deve cobrir `H`, a segurança e os compromissos incrementais considerados, respeitando o piso mínimo configurado pelo negócio.
- O excesso atual é a parcela do estoque disponível acima desse alvo. Compras em aberto devem ser visíveis para avaliar eventual excesso futuro.
- Sem regra comercial de embalagem cadastrada, não presumir um múltiplo. Se a informação for obrigatória para emitir o pedido, sinalizar a pendência.

### 7.4. Exemplo de cálculo

| Parâmetro ilustrativo — Ventus Malbec | Valor |
| --- | --- |
| Consumo diário da loja | 1 unidade |
| Prazo de reposição | 10 dias |
| Intervalo entre compras | 7 dias |
| Horizonte | 17 dias |
| Compromissos B2B no horizonte | 9 unidades, das quais 4 já reservadas |
| Estoque físico | 20 unidades |
| Estoque indisponível | 0 |
| Estoque reservado | 4 unidades |
| Estoque disponível | 16 unidades |
| Estoque de segurança | 6 unidades |
| Estoque mínimo manual | Não configurado |
| Recebimentos confirmados | 0 |
| Múltiplo de compra | 6 unidades |

Demanda incremental: `17 × 1 + (9 − 4) = 22 unidades`.

Sugestão: `máximo(0, 22 + 6 − 16) = 12 unidades`.

A recomendação exibida será **“Comprar 12 unidades de Ventus Malbec”**. As 4 unidades reservadas já foram retiradas do estoque disponível e não foram somadas novamente à demanda incremental.

## 8. Requisitos da evolução

### RF11 — Consolidação automática das fontes

- Integrar ERP, PDV e compras conforme APIs e permissões disponíveis.
- Atualizar dados sem depender da extração manual de relatórios.
- Definir a frequência por fonte após validar limites, disponibilidade e necessidade operacional.
- Oferecer atualização sob demanda quando suportada.
- Mostrar falhas, tentativas e última atualização bem-sucedida.
- Reconciliar produtos, saldos e pedidos sem duplicação entre fontes.

### RF12 — Envio direto de pedidos

- Enviar os pedidos ao sistema de compras por API, quando disponível.
- Receber identificador externo e situação de aceitação ou rejeição.
- Preservar os controles de confirmação, rastreabilidade e prevenção de duplicidade do MVP.
- Respeitar aprovações obrigatórias do sistema de destino, apresentando-as claramente.

### RF13 — B2B recorrente e sazonalidade

- Identificar padrões por empresa, cestas, eventos e ações corporativas.
- Permitir marcar demandas como recorrentes ou excepcionais, com justificativa.
- Comparar períodos equivalentes quando houver histórico suficiente.
- Aplicar ajustes sazonais explicáveis e evitar contagem duplicada com eventos confirmados.
- Manter separados cenário confirmado e cenário estimado.
- Sinalizar quando o histórico não sustentar a previsão proposta.

### RF14 — Consolidação financeira e OFX

- Reunir contas a pagar, contas a receber, saldos bancários e movimentações.
- Importar OFX com identificação da conta e prevenção de duplicidade de arquivos e transações.
- Conciliar saldos e lançamentos, apresentando pendências.
- Evitar dupla contagem entre títulos financeiros, liquidações e movimentações bancárias.
- Tratar transferências entre contas próprias sem distorcer o caixa consolidado.

### RF15 — Projeção de caixa em 30, 60 e 90 dias

- Apresentar projeções com detalhamento diário e destaque para datas com insuficiência de caixa.
- Permitir consultar quais pagamentos e recebimentos explicam o saldo de cada período.
- Usar um saldo inicial identificado e conciliado.
- Evidenciar títulos vencidos e premissas de recebimento, sem tratá-los como caixa disponível.

```text
Saldo projetado = saldo inicial + recebimentos previstos − pagamentos previstos
```

Separar três cenários:

| Cenário | Conteúdo |
| --- | --- |
| Contratado | Contas a pagar e a receber já registradas |
| Provável | Cenário contratado acrescido de estimativas do pipeline, com premissas explícitas |
| Simulação de compras | Efeito dos pedidos em análise conforme condições de pagamento conhecidas |

Uma compra que já se tornou conta a pagar deve deixar de ser somada como simulação. A mesma receita não pode aparecer como oportunidade e recebível na mesma projeção.

### RF16 — Integração com Agendor

Apresentar oportunidades abertas, empresas/clientes, valor em negociação por oportunidade e no total, etapa, responsável, previsão de fechamento e data do último contato. Identificar clientes sem contato recente conforme intervalo configurável.

As regras de acesso e os campos disponíveis devem ser confirmados na integração.

### RF17 — Pipeline como previsão de receita

- Calcular cenários de receita por valor, probabilidade e data estimada de fechamento.
- Explicitar a origem da probabilidade, por oportunidade ou etapa configurada.
- Para caixa, considerar também o prazo esperado entre fechamento e recebimento.
- Identificar oportunidades sem previsão ou condições suficientes.
- Vincular oportunidades convertidas aos pedidos e recebíveis para prevenir duplicidade.
- Exigir produto, quantidade e data para que uma oportunidade influencie demanda por SKU, conforme regra aprovada pelo negócio.

## 9. Dados necessários

| Conjunto | Campos mínimos esperados | Tratamento quando incompleto |
| --- | --- | --- |
| Produtos | SKU, descrição, unidade e códigos nas fontes | Pendência de correspondência |
| Estoque | SKU, saldo, referência temporal e escopo/local | Sinalizar desatualização ou divergência |
| Reservas e bloqueios | SKU, quantidade, tipo e vínculo quando aplicável | Impedir dupla contagem e exigir revisão de inconsistências |
| Vendas | Identificador da linha, data, SKU, quantidade, canal e situação | Registros sem canal ficam como Não identificado |
| Contexto B2B | Empresa, contexto e identificador de venda/compromisso | Preservar o canal e indicar detalhe ausente |
| Compromissos futuros | Identificador, SKU, quantidade, data, situação e reserva vinculada | Não projetar por SKU sem quantidade e data |
| Fornecedores | Identificador, códigos, prazo e regras de compra | Parametrização manual no piloto |
| Custos | SKU, fornecedor, valor, unidade e referência | Mostrar valor ausente/desatualizado; validar exigência do destino |
| Compras em aberto | Pedido, item, fornecedor, SKU, quantidade pendente, data e situação | Sinalizar recomendação incompleta se a fonte não estiver disponível |
| Financeiro — evolução | Título, conta, valor, vencimento, liquidação e vínculos | Destacar pendências de conciliação |
| CRM — evolução | Oportunidade, empresa, etapa, valor, probabilidade, fechamento e contato | Exibir previsão incompleta |

As fontes oficiais de cada campo e as regras para divergências devem ser documentadas durante a descoberta. Não se presume que ERP, PDV e sistema de compras compartilhem os mesmos códigos ou saldos.

## 10. Critérios de aceite

### 10.1. MVP

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CA01 | Importar novamente um arquivo de vendas | Nenhuma venda duplicada; resultado da carga visível |
| CA02 | Carga inválida ou incompleta | Erros identificados e último conjunto válido preservado |
| CA03 | SKU sem correspondência ou venda sem canal | Pendência visível, sem classificação silenciosa como Loja |
| CA04 | Venda B2B excepcional no histórico | Volume aparece separado e não aumenta automaticamente a previsão da loja |
| CA05 | Consultar vendas históricas | Totais de 30, 60, 90 e 365 dias por canal, com indicação de períodos parciais |
| CA06 | Compromisso B2B já reservado | Quantidade contabilizada uma única vez |
| CA07 | Pedido em aberto suficiente com chegada no prazo | Sugestão considera o abastecimento e evita recompra desnecessária |
| CA08 | Entrega prevista depois da ruptura | Risco anterior continua visível e recebe alerta de urgência |
| CA09 | Aplicar os dados do exemplo da seção 7.4 | Sugestão de 12 unidades, com memória de cálculo acessível |
| CA10 | Produto novo ou sem consumo confiável | Limitação sinalizada e parâmetros manuais identificados |
| CA11 | Alterar quantidade e embalagem | Total recalculado; sugestão original preservada; regra comercial validada |
| CA12 | Selecionar produtos de vários fornecedores | Pedidos separados gerados em uma confirmação |
| CA13 | Importar o pedido no destino | Arquivo aceito sem redigitação de itens e quantidades |
| CA14 | Repetir confirmação ou download | Mesmo pedido reutilizado, sem duplicidade |
| CA15 | Falha em parte dos pedidos | Resultado individual e retomada apenas dos pendentes |
| CA16 | Pedido gerado ainda não importado | Situação pendente visível, sem tratá-lo como recebimento garantido |
| CA17 | Pedido confirmado reaparece na fonte de compras | Vínculo externo evita dupla contagem |
| CA18 | Consultar uma decisão anterior | Usuário, dados de referência, sugestão e ajuste disponíveis |

### 10.2. Evolução

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CA19 | Falha de atualização automática | Alerta de integração e última atualização válida visíveis |
| CA20 | Reimportar OFX ou identificar transferência própria | Sem duplicidade e sem distorção do saldo consolidado |
| CA21 | Consultar projeções | Horizontes de 30, 60 e 90 dias com memória dos fluxos e alertas |
| CA22 | Oportunidade convertida em recebível | Receita contabilizada uma única vez |
| CA23 | Oportunidade sem produtos ou datas | Permanece no cenário comercial sem gerar demanda automática por SKU |
| CA24 | Cliente sem contato no intervalo configurado | Cliente sinalizado com data do último contato |
| CA25 | Compra simulada convertida em obrigação | Valor deixa a simulação e entra no cenário contratado sem duplicação |

## 11. Requisitos de operação e segurança

- Restringir acesso por perfil e registrar quem confirmou cada compra.
- Proteger credenciais das integrações e dados comerciais e pessoais.
- Manter trilha de alterações, cargas e geração de pedidos.
- Permitir rastrear recomendações até os dados e parâmetros utilizados.
- Mostrar origem e atualização dos dados na interface.
- Permitir recuperar cargas e emissões com falha sem duplicar registros.
- Preservar rascunhos durante erros de operação.
- Validar desempenho com o volume real do piloto; metas técnicas quantitativas serão definidas após conhecer os dados.

## 12. Indicadores de sucesso e piloto

O piloto deve usar um comprador, poucos fornecedores e um conjunto representativo de SKUs, incluindo itens com giro da loja, vendas B2B excepcionais, compromissos futuros e compras em aberto. O número de itens será definido conforme os dados disponíveis.

Antes do piloto, medir o tempo gasto no processo atual, desde a análise dos relatórios até o pedido pronto no sistema de compras.

| Indicador | Como medir | Referência inicial |
| --- | --- | --- |
| Tempo de preparação | Comparar rodadas equivalentes antes e durante o piloto | Meta proposta de redução de pelo menos 50% |
| Redigitação | Contar itens relançados após gerar o pedido | Zero itens redigitados no fluxo validado |
| Ajustes nas sugestões | Registrar quantidade ajustada e motivo quando informado | Diagnosticar regras; sem meta de aceitação definida antecipadamente |
| Qualidade dos dados | Percentual de SKUs aptos e vendas com canal identificado | Acompanhar e resolver pendências |
| Duplicidade de emissão | Verificar pedidos após repetições e retomadas | Zero duplicidades causadas pelo produto |
| Estoque | Acompanhar ruptura e excesso nos SKUs do piloto | Comparar com a linha de base ao longo dos ciclos de reposição |
| Caixa — evolução | Comparar previsto e realizado em cada horizonte | Definir meta após estabelecer a base financeira |

A redução de tempo é uma hipótese de valor a validar, não um resultado já comprovado. Redução de ruptura e excesso exige acompanhamento por vários ciclos e não será presumida após uma única rodada.

**Condição para concluir o piloto:** executar uma compra real com dados válidos, sugestão explicável, revisão do comprador e pedido aceito pelo destino sem redigitação, atendendo aos critérios críticos de integridade e duplicidade.

## 13. Sequência de implementação

| Etapa | Entrega | Condição de conclusão |
| --- | --- | --- |
| 1. Validar fontes e destino | Amostras de dados, códigos, canais e contrato de importação do pedido | Viabilidade do fluxo confirmada com o sistema atual |
| 2. Consolidar os dados | Cargas, correspondência de SKUs e separação dos canais | Dados do piloto conciliados e pendências visíveis |
| 3. Calcular reposição | Indicadores, projeção por data e sugestões explicáveis | Cenários de negócio conferidos com o comprador |
| 4. Preparar pedidos | Lista editável, agrupamento, arquivos e rastreabilidade | Pedido importado no destino sem redigitação |
| 5. Executar piloto | Compras reais e medição de esforço | Valor operacional avaliado e ajustes priorizados |
| 6. Evoluir o produto | Integrações, sazonalidade, financeiro e Agendor | Priorização baseada no piloto e nas dependências disponíveis |

Não são atribuídos prazos antes de validar fontes, volume, capacidade de integração e formato do pedido.

## 14. Dependências, riscos e decisões pendentes

| Tema | O que validar | Efeito no produto |
| --- | --- | --- |
| Sistemas atuais | Identificar ERP, PDV, sistema de compras e responsáveis | Define formatos e esforço de integração |
| Saída do pedido | Verificar importação, campos, unidades e aprovações no destino | Determina se o MVP pode usar arquivo ou precisa de API mínima |
| Identificação Loja/B2B | Conferir se o canal está disponível na origem | Pode exigir classificação inicial no piloto |
| Histórico | Confirmar períodos e qualidade dos dados | Limita previsões e indicadores de 365 dias |
| Reservas | Validar vínculos, cobertura física e relação com bloqueios | Evita descontar estoque e demanda duas vezes |
| Compras em aberto | Confirmar quantidades pendentes, datas e atualização | Evita duplicar reposição e ocultar riscos |
| Parâmetros | Validar janela de consumo, segurança, revisão e prazos | Define comportamento inicial das sugestões |
| Custos e unidades | Conferir embalagens, conversões e preços | Evita pedidos e estimativas inconsistentes |
| Fontes oficiais | Definir precedência para dados divergentes | Evita recomendações com saldos conflitantes |
| B2B e eventos | Definir recorrência e comprovação de demanda futura | Evita extrapolação indevida de vendas extraordinárias |
| Financeiro | Confirmar títulos, contas, OFX e condições de pagamento | Determina a confiabilidade das projeções |
| Agendor | Validar acesso e disponibilidade de campos | Determina previsões e alertas comerciais possíveis |

As decisões pendentes não impedem a documentação do produto. Elas devem ser resolvidas antes das entregas que dependem delas, sem apresentar como disponível uma integração ainda não verificada.

## 15. Pergunta de validação do produto

> É possível chegar a uma tela onde eu veja todos os produtos que precisam ser comprados, as quantidades sugeridas e consiga gerar o pedido praticamente com um clique?

O MVP deve demonstrar esse fluxo no escopo do piloto. A confirmação pode gerar vários pedidos por fornecedor. A importação no destino permanece explícita enquanto não houver envio automático validado.

A entrega será avaliada pela capacidade de monitorar estoque, separar Loja e B2B, sugerir reposição e reduzir o trabalho de emitir pedidos.
