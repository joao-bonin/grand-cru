# RFC-008 — Comprador virtual e análise prévia dos requisitos funcionais

- **Status:** análise prévia concluída; regras de negócio e recorte de entrega ainda precisam de detalhamento.
- **Fonte:** [relato dos stakeholders](requisitos-funcionais-stakeholders.md).
- **Relacionadas:** RFC-001 (produto e arquitetura), RFC-005 (DDD), RFC-006 (Vercel em pausa) e RFC-007 (CI).

## Objetivo e mudança de foco

O Grand Cru deve consolidar dados de ERP, PDV, CRM, bancos e sistema de compras para apoiar decisões e reduzir tarefas manuais. O maior valor solicitado está no fluxo de reposição: decidir o que comprar, quanto comprar e quando comprar, revisar as sugestões e gerar o pedido.

Dashboards continuam no escopo como apoio à decisão. A integração com LLM discutida anteriormente permanece no backlog, com escopo ainda em aberto. Ela não é um pré-requisito estabelecido para calcular reposição ou gerar pedidos.

Esta RFC registra os novos requisitos e a análise. Não representa implementação dessas funcionalidades nem a PRD final; a skill específica para produção da PRD ainda não foi disponibilizada.

## Requisitos recebidos

Os IDs abaixo complementam RF-01 a RF-06 da RFC-001.

| ID | Requisito |
| --- | --- |
| RF-07 | Exibir estoque atual e mínimo, vendas em 30/60/90/365 dias, giro mensal, cobertura em dias, ruptura prevista e excesso de estoque por SKU. |
| RF-08 | Separar consumo da loja e do B2B, permitindo analisar empresas, cestas, eventos, ações corporativas e sazonalidades sem distorcer a demanda recorrente. |
| RF-09 | Sugerir produto, quantidade e momento de compra considerando demanda da loja e B2B, sazonalidade, estoque atual e prazo de reposição. |
| RF-10 | Reunir produtos que precisam de compra em uma tela, com quantidades sugeridas editáveis e confirmação do usuário. |
| RF-11 | Gerar, após a confirmação, um pedido pronto para o sistema de compras; formato e forma de entrega dependem do contrato desse sistema. |
| RF-12 | Consolidar contas a pagar, contas a receber, saldos bancários e extratos OFX. |
| RF-13 | Apresentar projeções de caixa para 30, 60 e 90 dias. |
| RF-14 | Integrar com Agendor para oportunidades abertas, valores em negociação e previsão de fechamento. |
| RF-15 | Identificar clientes sem contato recente; o período e o evento considerado contato ainda serão definidos. |
| RF-16 | Usar o pipeline comercial na previsão de receita, com premissas explícitas e sem duplicar contas a receber já registradas. |

## Fluxo principal proposto para detalhamento

1. Sincronizar e consolidar os dados necessários, identificando a origem e a última atualização.
2. Classificar a demanda e calcular os indicadores por SKU.
3. Listar itens com necessidade de compra, quantidade sugerida, momento de reposição e justificativa.
4. Permitir revisar, selecionar e ajustar quantidades.
5. Confirmar a geração do pedido.
6. Gerar o formato ou enviar pela API do sistema de compras, conforme a integração disponível.
7. Mostrar o resultado e registrar a referência do pedido externo, quando houver.

É viável construir essa tela com o stack adotado. A integração de ponta a ponta depende dos dados e do sistema de compras; uma exportação no formato aceito pode ser uma alternativa se não houver API de criação. API, exportação e formato ainda não foram confirmados.

## Pontos críticos encontrados

### Demanda por canal e por ocasião

Loja e B2B não podem ser tratados apenas como uma venda total. É necessário identificar a classificação nos dados de origem ou definir um mapeamento revisável. CNPJ, vendedor ou local de venda não devem ser assumidos como regra de classificação sem validação.

Eventos podem ocorrer no B2B ou na loja. A proposta é distinguir canal de venda de ocasião/evento, preservando uma única contagem de cada item vendido. Somar um evento novamente ao total do canal inflaria a demanda. Sazonalidade é uma dimensão temporal, cuja influência precisa de regra e evidência histórica.

O pico de um evento não deve virar automaticamente demanda recorrente. É necessário decidir como tratar eventos passados e eventos futuros conhecidos.

### Indicadores e recomendação de compra

Ainda não há fórmulas aprovadas. Antes de implementar, definir:

- Se as vendas são líquidas de cancelamentos e devoluções, qual data delimita cada janela e como tratar vendas sem classificação.
- Se “giro mensal” significa consumo em unidades/mês ou uma razão entre vendas e estoque médio.
- Se o estoque considerado é físico ou disponível, e como tratar reservas, múltiplos locais e pedidos de compra em trânsito.
- Origem do estoque mínimo e do prazo de reposição, inclusive diferenças por fornecedor/SKU.
- Critérios de cobertura, ruptura e excesso; tratamento de demanda zero, dados ausentes, histórico curto e períodos sem estoque.
- Horizonte de planejamento, estoque de segurança, quantidades mínimas e múltiplos de embalagem.
- Como incorporar demanda B2B irregular, eventos e sazonalidade sem projetar vendas excepcionais como recorrentes.

“Comprar 12 unidades de Ventus Malbec” é um exemplo de saída desejada, não uma quantidade fixa nem uma fórmula definida. Cada sugestão deve permitir conferir os dados e premissas que a produziram. Dados insuficientes devem resultar em sinalização de limitação, e não em recomendação apresentada como certa.

### Pedido de compra

O sistema destinatário ainda precisa ser identificado. Deve-se verificar os campos exigidos: fornecedor, códigos dos produtos, unidades, preços e condições, entre outros definidos pelo contrato real.

Uma seleção com fornecedores distintos pode exigir vários pedidos. A regra de agrupamento precisa ser confirmada. Também é necessário definir quem pode confirmar, como registrar alterações e como evitar pedidos duplicados quando uma confirmação é repetida ou uma requisição falha.

Esses são requisitos derivados propostos para validação: rastreabilidade da recomendação e ajustes, confirmação explícita, idempotência, tratamento de envio parcial e conciliação da referência externa. Não houve emissão de pedido real nesta etapa.

### Caixa e pipeline

O caixa exige uma data-base para o saldo inicial, datas esperadas de entradas/saídas e conciliação dos extratos OFX. A importação repetida de um arquivo não pode criar movimentos duplicados; a identificação disponível no OFX precisa ser verificada.

Pipeline comercial não equivale a recebimento confirmado. Propõe-se separar caixa comprometido de cenários derivados de oportunidades, indicando probabilidade e premissas quando utilizadas. Data de fechamento também não necessariamente é data de recebimento: prazos e parcelas precisam ser definidos.

Uma oportunidade que já gerou uma conta a receber não deve ser contada duas vezes na projeção. O vínculo entre clientes, oportunidades e títulos depende das fontes.

## Dependências de dados e integrações

| Fonte | Informação necessária | Estado atual |
| --- | --- | --- |
| ERP/PDV | Cadastro e identidade dos SKUs, estoque, vendas e informações de canal/cliente. | Contrato público analisado na RFC-011; produtos, estoque, vendas e financeiro documentados. Dados reais e relação operacional ERP/PDV ainda precisam de validação. |
| Sistema de compras | Fornecedores, parâmetros de reposição, pedidos existentes e contrato para gerar/enviar pedidos. | API Varejo Fácil documenta consulta e criação de pedidos de compra (RFC-011). Confirmar se é o destino desejado e validar contrato operacional em homologação. |
| Agendor | Oportunidades, valores, datas e atividades de contato. | Integração solicitada; contrato, campos disponíveis e acesso não validados. |
| Bancos/financeiro | Saldos, contas a pagar/receber e arquivos OFX. | Bancos, fontes dos títulos e forma de ingestão ainda não informados. |

A identidade de produto e cliente entre sistemas precisa de mapeamento. Sincronizações agendadas e manuais permanecem previstas; frequência, volumes, histórico disponível e tolerância a atraso ainda não foram definidos.

## Sequência de entrega sugerida, sem excluir requisitos

1. Validar fontes, classificação da demanda e parâmetros de compra com amostras reais.
2. Entregar o fluxo estoque → sugestão explicável → ajuste → pedido, validando primeiro um conjunto representativo de SKUs e o formato do pedido.
3. Expandir projeção de caixa e integração Agendor a partir das regras financeiras e comerciais aprovadas.

Esta sequência é uma proposta de priorização pelo valor relatado, não uma autorização para retirar caixa, CRM, dashboards ou LLM do escopo. O recorte final deve ser definido na PRD.

## Critérios de aceitação candidatos

- O mesmo SKU permite conferir vendas da loja e do B2B separadamente nas janelas solicitadas, sem contar eventos em duplicidade.
- Um evento B2B excepcional não altera silenciosamente a demanda recorrente da loja.
- O comprador vê os itens que precisam de reposição, suas quantidades sugeridas e justificativas, ajusta quantidades e confirma o pedido.
- Se já houver reposição pendente ou reserva relevante, a regra aprovada a considera e explica seu efeito.
- O pedido gerado é aceito pelo sistema destinatário no contrato validado; repetir a confirmação não cria uma compra duplicada.
- Falha ou envio parcial apresenta estado rastreável e permite recuperação conforme as capacidades da integração.
- A projeção mostra 30/60/90 dias e distingue os valores confirmados das premissas comerciais, sem duplicar recebíveis.
- O fluxo funciona no celular e exige as permissões definidas para consulta financeira e confirmação de compras.

Os cálculos e invariantes devem ter testes unitários; adaptadores, importação OFX e emissão/exportação de pedidos exigem testes de integração com contratos validados. As funcionalidades acima ainda não foram implementadas.

## Medidas de valor a definir com os stakeholders

Sugestões: tempo gasto para preparar um pedido, proporção de itens sugeridos aproveitados ou ajustados, número de intervenções manuais, rupturas e excesso de estoque. Metas e valores de referência ainda não foram fornecidos.

## Perguntas prioritárias

1. Qual sistema recebe os pedidos e qual interface ele oferece?
2. Como loja, B2B e eventos são identificados hoje nos dados?
3. Onde ficam estoque mínimo, prazo de reposição, fornecedor e múltiplos de compra?
4. Quais SKUs e fornecedores são representativos para validar o primeiro fluxo?
5. Quem pode confirmar compras e consultar dados financeiros?
6. Quais bancos/fontes financeiras serão usados e quais regras convertem oportunidades em previsão de recebimento?

## Próximo documento

A PRD deverá incorporar o relato, as decisões técnicas existentes e as respostas às perguntas acima. A identificação/instalação da skill solicitada continua pendente; esta análise não foi produzida com uma skill de PRD indisponível.
