# Comprador virtual — histórias e critérios de aceite

**Status:** In Progress. Implementação local autorizada posteriormente pelo usuário. Compras e escritas no ERP continuam proibidas.
**Fonte:** `origin/work:docs/PRD.md`, commit `ede01140de4203d83ef393557e8e388723a7a39a`, PRD v1.0 de 16/10/2026. Cópia fiel em [prd-source.md](prd-source.md).
**Precedência:** decisões explícitas posteriores do usuário prevalecem sobre o PRD. Leia [context.md](context.md) para os conflitos e bloqueios. TDD ainda não produzido; os caminhos em tasks.md são candidatos.

## Problem Statement

O comprador cruza estoque e vendas manualmente e repete trabalho para preparar compras. Este plano decompõe o PRD completo, mas limita a primeira etapa à leitura do ERP, indicadores, sugestões e preparação local. O piloto com compra real exigido pelo PRD continua pendente e não será declarado concluído com uma demonstração local.

## Goals

- [ ] Demonstrar dados rastreáveis, sugestão explicável, revisão e rascunho local.
- [ ] Manter zero escritas nos dados do ERP em todo o fluxo.
- [ ] Preservar cada RF e CA do PRD no mapa de cobertura, inclusive entregas adiadas.

## Out of Scope

| Entrega nesta etapa | Motivo |
| --- | --- |
| B2B, classificação de canal, eventos e sazonalidade | Adiamento explícito do usuário |
| Escrita, importação real ou emissão no ERP | Proibição explícita, inclusive homologação |
| Refresh/logout do ERP | Não autorizados pela exceção de login |
| Financeiro, OFX e Agendor na primeira etapa | Evoluções preservadas em US13–US16 |
| Login e CRUD de usuários refeitos do zero | Já existem; reutilizar e testar regressões |
| Deploy, push, banco de produção | Não solicitados neste trabalho de planejamento |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| B2B | Adiar e usar vendas totais líquidas | Decisão explícita desta conversa | Sim |
| Escrita ERP | Proibir; exceção somente login autorizado | AGENTS.md | Sim |
| Entrada API x arquivos | Priorizar API GET; adaptador de arquivos fica condicional | API escolhida como base e cupons já validados; PRD ainda prevê arquivos | Proposta de conciliação |
| Janela 60 x 90 dias | Planejar parâmetro obrigatório, sem default silencioso | PRD propõe 60, conversa sugeriu 90 | Pendente G2 |
| Fórmula | Propor seção 7 com demanda total, sem parcela B2B | Mantém L, R, S, M e evita misturar segurança em dias com unidades | Pendente G2 |
| Dados faltantes | Não converter ausência em zero; bloquear resultado dependente | Evita falsa precisão | Proposta |
| Reservas/locais | Validar semântica antes de calcular disponível | Endpoint de saldo não comprova reservas | Pendente G1 |
| Persistência | Gravar somente no PostgreSQL do Grand Cru em implementação futura | A proibição trata do ERP; rascunhos precisam sobreviver a reinício | Proposta |
| Permissões | Reusar admin/user; propor admin para sincronizar e confirmar rascunho, user para consultar | Evita inventar perfis antes do TDD | Pendente G3 |
| Frequência | Manual primeiro; agendamento pendente de limites e hospedagem | Uma hora foi sugestão, não decisão confirmada | Pendente G4 |
| Expiração do ERP | Parar e informar autenticação pendente, sem refresh | Exceção atual não inclui renovação | Confirmado limite; operação futura pendente |
| Exportação | Planejar como condicional a contrato; nenhuma importação real | Formato ainda desconhecido e ERP somente leitura | Pendente G5 |
| Datas | Propor dias civis em America/Sao_Paulo, intervalo início inclusivo/fim exclusivo | Evita sobreposição de janelas; validar datas da fonte | Pendente G2 |
| Retenção e desempenho | Definir no TDD após volume; preservar histórico de rodadas, sem purge automático | Metas não foram informadas | Pendente G4 |

**Open questions:** none unrecorded — todas as pendências estão registradas acima; isto NÃO significa que foram aprovadas. G1–G5 bloqueiam as tarefas dependentes.

## User Stories

As palavras WHEN/IF/THEN/SHALL indicam critérios EARS verificáveis. Prioridades P1 se referem à etapa local. Verified indica os critérios de software testados com fixtures; não valida contratos reais nem encerra o MVP original. Consulte validation.md para as pendências operacionais.

### US01 — Validar as fontes do piloto (P1)

**User Story:** Como gestor, quero conhecer os dados disponíveis no ERP para planejar com evidências.

**Fonte:** RF01, RF02; CA02; seção 14.
**Requirement:** CV-01.

**Acceptance Criteria:**
1. WHEN uma fonte é examinada THEN o sistema SHALL registrar status HTTP, campos presentes e limitações sem registrar credenciais ou dados pessoais.
2. IF reservas ou compras pendentes não forem comprovadas THEN o sistema SHALL marcar a fonte como pendente, sem substituí-la por zero.

**Independent Test:** Relatório com evidências por fonte e todas as lacunas explicitadas.

### US02 — Atualizar dados com segurança (P1)

**User Story:** Como comprador, quero atualizar os dados e ver sua referência temporal para decidir com dados rastreáveis.

**Fonte:** RF01, RF11; CA01, CA02, CA19.
**Requirement:** CV-02.

**Acceptance Criteria:**
1. WHEN a mesma venda é sincronizada duas vezes THEN o sistema SHALL manter uma única ocorrência identificada pela origem e identidade do item.
2. IF uma página de uma carga falhar THEN o sistema SHALL preservar a versão publicada anterior desse conjunto.
3. WHILE uma execução estiver ativa para a mesma origem o sistema SHALL impedir uma segunda execução concorrente dessa origem.
4. IF o ERP retornar 401 THEN o sistema SHALL interromper a execução com autenticação pendente, sem refresh automático.

**Independent Test:** Simular duas páginas, repetição e falha na segunda página; conferir versão publicada e estado da execução.

### US03 — Identificar produtos e parâmetros de compra (P1)

**User Story:** Como comprador, quero consultar SKU, fornecedor e conversões para evitar comprar a apresentação errada.

**Fonte:** RF02; CA03, CA10, CA11.
**Requirement:** CV-03.

**Acceptance Criteria:**
1. WHEN dois SKUs tiverem descrições semelhantes THEN o sistema SHALL mantê-los distintos por identidade da fonte.
2. WHEN uma caixa contiver 6 unidades e a necessidade for 7 unidades THEN o sistema SHALL converter a compra para 2 caixas e 12 unidades.
3. IF fornecedor ou conversão estiver ausente THEN o sistema SHALL apresentar uma pendência que impeça finalizar o rascunho desse item.

**Independent Test:** Fixtures com produtos homônimos, caixa de seis e parâmetro ausente.

### US04 — Consultar vendas líquidas totais (P1)

**User Story:** Como comprador, quero ver o consumo em 30, 60, 90 e 365 dias para entender a demanda sem separar B2B nesta etapa.

**Fonte:** RF05; CA05; decisão de adiamento B2B.
**Requirement:** CV-04.

**Acceptance Criteria:**
1. WHEN houver 10 unidades vendidas válidas e devolução vinculada de 2 unidades THEN o sistema SHALL apresentar 8 unidades líquidas.
2. WHEN um cupom e uma nota representarem a mesma venda identificada THEN o sistema SHALL contabilizar a venda uma única vez.
3. IF somente 60 dias de histórico estiverem comprovados THEN o sistema SHALL marcar a janela de 365 dias como parcial.
4. The sistema SHALL identificar os indicadores desta versão como vendas totais, sem classificá-los como consumo exclusivo da loja.

**Independent Test:** Consultar fixture com datas nas bordas das quatro janelas, cancelamentos e devolução vinculada.

### US05 — Consultar disponibilidade e abastecimento (P1)

**User Story:** Como comprador, quero ver estoque e compras em andamento para evitar recompra desnecessária.

**Fonte:** RF05; CA06 parcial, CA07, CA08, CA16, CA17.
**Requirement:** CV-05.

**Acceptance Criteria:**
1. WHEN houver saldo físico de 20, reserva de 4 e bloqueio disjunto de 2 THEN o sistema SHALL calcular disponibilidade de 14 unidades.
2. IF a relação entre reservas e bloqueios não for conhecida THEN o sistema SHALL apresentar disponibilidade indeterminada.
3. WHEN um pedido tiver 12 unidades, 6 recebidas e 0 canceladas THEN o sistema SHALL considerar 6 unidades pendentes.
4. WHEN uma chegada ocorrer depois da primeira insuficiência projetada THEN o sistema SHALL manter o alerta da insuficiência anterior.

**Independent Test:** Fixtures temporais e estoque com dados ausentes; nenhum recebimento presumido.

### US06 — Receber uma recomendação explicável (P1)

**User Story:** Como comprador, quero ver quantidade sugerida e memória de cálculo para revisar a reposição.

**Fonte:** RF05, RF06; CA07, CA08, CA09 adaptado, CA10.
**Requirement:** CV-06.

**Acceptance Criteria:**
1. WHEN consumo diário=1, L=10, R=7, S=6, M=0, A=16 e E=0 THEN o sistema SHALL calcular quantidade bruta de 7 unidades.
2. WHEN a quantidade bruta for 7 e o múltiplo for 6 THEN o sistema SHALL sugerir 12 unidades.
3. IF consumo confiável ou disponibilidade não puderem ser determinados THEN o sistema SHALL apresentar recomendação indisponível com motivo.
4. WHEN uma recomendação for apresentada THEN o sistema SHALL fornecer a versão dos dados e os valores de cada parcela do cálculo.
5. IF não houver histórico suficiente de saldos THEN o sistema SHALL apresentar giro de estoque indisponível.

**Independent Test:** Cenário numérico sem B2B, demanda zero, embalagem ausente e recebimento atrasado. Fórmula proposta, execução bloqueada até G2.

### US07 — Revisar a lista no celular (P1)

**User Story:** Como comprador, quero filtrar produtos e abrir suas justificativas para priorizar a revisão.

**Fonte:** RF07; CA05, CA10, CA11.
**Requirement:** CV-07.

**Acceptance Criteria:**
1. WHEN o usuário filtrar fornecedor e produto THEN o sistema SHALL mostrar somente itens que atendam aos dois filtros.
2. WHEN a tela estiver em largura de 390 pixels THEN o sistema SHALL permitir acessar quantidade e justificativa sem depender de hover.
3. IF a consulta falhar THEN o sistema SHALL exibir erro e ação de tentar novamente, sem representar falha como lista vazia.

**Independent Test:** Demo com fixtures, filtros combinados, vazio, erro e viewport mobile.

### US08 — Salvar uma rodada local de revisão (P1)

**User Story:** Como comprador, quero ajustar quantidades e guardar um rascunho por fornecedor para preparar a compra com rastreabilidade.

**Fonte:** RF08, RF09 parcial, RF10 parcial; CA11, CA12 adaptado, CA14, CA18.
**Requirement:** CV-08.

**Acceptance Criteria:**
1. WHEN a quantidade sugerida de 12 for ajustada para 18 THEN o sistema SHALL preservar 12 como sugestão original e 18 como decisão.
2. WHEN a mesma confirmação local for repetida com a mesma chave THEN o sistema SHALL devolver a mesma rodada salva.
3. IF a versão dos dados usados na rodada tiver mudado THEN o sistema SHALL bloquear a confirmação com conflito de versão.
4. WHEN a rodada for salva THEN o sistema SHALL criar somente rascunhos locais agrupados por fornecedor, sem chamar operações de escrita do ERP.

**Independent Test:** Recarregar rascunho, repetir confirmação e provocar conflito concorrente no banco de teste local.

### US09 — Auditar decisões e pendências (P1)

**User Story:** Como gestor, quero consultar rodadas e sua origem para explicar decisões anteriores.

**Fonte:** RF08, RF10; CA15 parcial, CA16, CA18.
**Requirement:** CV-09.

**Acceptance Criteria:**
1. WHEN uma rodada anterior for consultada THEN o sistema SHALL mostrar autor, data, versão dos dados, sugestão e ajuste.
2. WHEN houver um rascunho local para a mesma necessidade THEN o sistema SHALL mostrar a pendência sem contá-la como recebimento confirmado.
3. IF uma consulta protegida não tiver sessão válida THEN o sistema SHALL responder 401 sem expor dados comerciais.

**Independent Test:** Histórico após reinício, permissões e rascunho que não reduz reposição como chegada garantida.

## Evoluções e histórias condicionais

Estas histórias preservam o PRD. As subtarefas abaixo são de refinamento; não são tarefas de implementação prontas para Execute. Seus contratos e gates serão detalhados ao priorizá-las.

### US10 — Exportar pedidos no formato aceito (Condicional)

**User Story:** Como gestor, quero exportar pedidos no formato aceito para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF09, RF10; CA12–CA17.
**Requirement:** CV-10.
**Bloqueio:** Formato do destino não confirmado; teste de importação real proibido.

**Acceptance Criteria:**
1. WHEN a mesma exportação for solicitada novamente THEN o sistema SHALL reutilizar o mesmo pedido e conteúdo aprovado.

**Subtarefas de refinamento:**
- [ ] US10.1: Obter layout e exemplo oficial de importação sem enviar dados ao ERP.
- [ ] US10.2: Especificar um serializador com campos, unidades, custos e pendências por fornecedor.
- [ ] US10.3: Planejar geração idempotente e repetição de download do mesmo arquivo.
- [ ] US10.4: Definir conciliação por identificador externo e recuperação de falhas por fornecedor.

**Independent Test:** Arquivo genérico não satisfaz CA13; aceitação real permanece bloqueada.

### US11 — Enviar pedidos por API (Bloqueada)

**User Story:** Como gestor, quero enviar pedidos por api para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF12; CA13–CA17.
**Requirement:** CV-11.
**Bloqueio:** Qualquer escrita no ERP exige nova autorização explícita.

**Acceptance Criteria:**
1. IF o resultado de um envio for desconhecido THEN o sistema SHALL impedir reenvio automático até conciliar a referência externa.

**Subtarefas de refinamento:**
- [ ] US11.1: Confirmar destino, permissões e efeito comercial de criar o pedido.
- [ ] US11.2: Definir contrato do pedido e correlação externa, sem presumir idempotência de idExterno.
- [ ] US11.3: Planejar estado de resultado desconhecido após timeout e consulta de conciliação.
- [ ] US11.4: Somente após liberação, detalhar testes de envio em homologação.

**Independent Test:** Nenhum POST de compra faz parte das tarefas executáveis deste plano.

### US12 — Separar canais e compromissos B2B (P2 adiada)

**User Story:** Como gestor, quero separar canais e compromissos b2b para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF03, RF04, RF13; CA03 parcial, CA04, CA06, CA23.
**Requirement:** CV-12.
**Bloqueio:** Adiado explicitamente pelo usuário.

**Acceptance Criteria:**
1. WHEN um compromisso de 9 unidades tiver 4 reservadas THEN o sistema SHALL adicionar apenas 5 unidades como demanda incremental.

**Subtarefas de refinamento:**
- [ ] US12.1: Validar classificação de canal com amostras de origem.
- [ ] US12.2: Definir fila de não classificados e correção auditável.
- [ ] US12.3: Especificar compromissos futuros, reservas vinculadas e atendimento/cancelamento.
- [ ] US12.4: Definir eventos excepcionais e sazonalidade com memória de cálculo.

**Independent Test:** Retomar o exemplo original de 12 unidades do PRD com os parâmetros originais completos.

### US13 — Consolidar financeiro e OFX (P2)

**User Story:** Como gestor, quero consolidar financeiro e ofx para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF14; CA20.
**Requirement:** CV-13.
**Bloqueio:** Fontes, vínculos e saldo-base ainda não validados.

**Acceptance Criteria:**
1. WHEN o mesmo OFX for importado duas vezes THEN o sistema SHALL manter uma única ocorrência de cada transação identificada.

**Subtarefas de refinamento:**
- [ ] US13.1: Mapear contratos de leitura de contas, títulos e movimentos.
- [ ] US13.2: Definir importação OFX local e chave de deduplicação por conta/transação.
- [ ] US13.3: Especificar conciliação e transferências entre contas próprias.
- [ ] US13.4: Planejar tela de divergências e origem de saldo.

**Independent Test:** Nenhuma liquidação ou alteração de título no ERP.

### US14 — Projetar caixa e simular compras (P2)

**User Story:** Como gestor, quero projetar caixa e simular compras para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF15; CA21, CA25.
**Requirement:** CV-14.
**Bloqueio:** Depende de US13 e regras financeiras aprovadas.

**Acceptance Criteria:**
1. WHEN uma compra simulada gerar uma obrigação vinculada THEN o sistema SHALL substituir a simulação pela obrigação sem somar ambas.

**Subtarefas de refinamento:**
- [ ] US14.1: Definir saldo inicial conciliado e tratamento de vencidos e parciais.
- [ ] US14.2: Especificar projeção diária para 30, 60 e 90 dias.
- [ ] US14.3: Separar contratado, provável e simulação de compras.
- [ ] US14.4: Definir vínculo que retira simulação quando surge obrigação real.

**Independent Test:** Validar 100 + 50 − 30 = 120 em fixture sem probabilidades implícitas.

### US15 — Consultar oportunidades e contatos do Agendor (P2)

**User Story:** Como gestor, quero consultar oportunidades e contatos do agendor para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF16; CA24.
**Requirement:** CV-15.
**Bloqueio:** Acesso e contrato Agendor ainda não consultados.

**Acceptance Criteria:**
1. WHEN o intervalo configurado for 30 dias e o último contato tiver 31 dias THEN o sistema SHALL sinalizar o cliente.

**Subtarefas de refinamento:**
- [ ] US15.1: Validar campos, paginação e permissões de leitura do Agendor.
- [ ] US15.2: Definir correspondência de clientes sem fusão por nome.
- [ ] US15.3: Planejar atualização de oportunidades e atividades de contato.
- [ ] US15.4: Especificar lista de clientes sem contato no intervalo configurado.

**Independent Test:** Datas de contato ausentes devem ser identificadas como desconhecidas.

### US16 — Transformar pipeline em cenário de receita (P2)

**User Story:** Como gestor, quero transformar pipeline em cenário de receita para ampliar a gestão a partir dos dados consolidados.
**Fonte:** RF17; CA22, CA23.
**Requirement:** CV-16.
**Bloqueio:** Depende de US14 e US15 e regras de probabilidade/prazo.

**Acceptance Criteria:**
1. WHEN uma oportunidade estiver vinculada a um recebível THEN o sistema SHALL contar essa receita uma única vez na projeção.

**Subtarefas de refinamento:**
- [ ] US16.1: Definir origem da probabilidade e prazo entre fechamento e recebimento.
- [ ] US16.2: Especificar cenário provável separado do contratado.
- [ ] US16.3: Definir vínculo oportunidade–recebível para evitar duplicação.
- [ ] US16.4: Impedir demanda por SKU a partir de oportunidade sem produto, quantidade e data.

**Independent Test:** Manter ausência de probabilidade como pendência, não assumir 100%.

## Edge Cases

- IF o ERP retornar timeout/429/5xx THEN o sistema SHALL preservar dados publicados e registrar falha sem expor o token.
- IF duas revisões tentarem salvar versões concorrentes THEN o sistema SHALL rejeitar a revisão obsoleta com 409.
- IF uma quantidade for negativa, não finita ou incompatível com a embalagem THEN o sistema SHALL rejeitar a alteração local.
- IF um identificador externo exceder a precisão inteira JavaScript THEN o sistema SHALL preservar sua identidade sem arredondamento.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CV-01 | US01 | Implementação local em tasks.md | Implementing |
| CV-02 | US02 | Implementação local em tasks.md | Implementing |
| CV-03 | US03 | Implementação local em tasks.md | Verified |
| CV-04 | US04 | Implementação local em tasks.md | Implementing |
| CV-05 | US05 | Implementação local em tasks.md | Implementing |
| CV-06 | US06 | Implementação local em tasks.md | Verified |
| CV-07 | US07 | Implementação local em tasks.md | Verified |
| CV-08 | US08 | Implementação local em tasks.md | Verified |
| CV-09 | US09 | Implementação local em tasks.md | Verified |
| CV-10 | US10 | Refinamento futuro/condicional | Pending |
| CV-11 | US11 | Refinamento futuro/condicional | Pending |
| CV-12 | US12 | Refinamento futuro/condicional | Pending |
| CV-13 | US13 | Refinamento futuro/condicional | Pending |
| CV-14 | US14 | Refinamento futuro/condicional | Pending |
| CV-15 | US15 | Refinamento futuro/condicional | Pending |
| CV-16 | US16 | Refinamento futuro/condicional | Pending |

Cobertura: 16 histórias, 9 detalhadas em tarefas candidatas e 7 preservadas com subtarefas de refinamento. Critérios do PRD adaptados não são declarados cumpridos.

## Success Criteria

- [ ] Fluxo local demonstrável com versão dos dados, cálculos e ajustes rastreáveis.
- [ ] Zero operações de escrita de negócio ao ERP, comprovadas com transporte mockado.
- [ ] Validação independente após implementação, conforme a skill.
- [ ] Piloto real do PRD continua bloqueado até autorização e contrato do destino.
