# Comprador virtual — histórias e subtarefas

**Status:** In Progress — execução local autorizada pelo usuário; validação consolidada e contratos operacionais pendentes.
**Spec:** [spec.md](spec.md). **Fonte e decisões:** [context.md](context.md). **Design:** [design.md](design.md), desenho local registrado; G1 e contratos comerciais permanecem pendentes.

## Execution Protocol

Na implementação, ativar `tlc-spec-driven` e seguir o fluxo Execute: critérios primeiro, testes na mesma tarefa, gate aprovado e um commit local atômico por tarefa, com marcação de conclusão no mesmo commit. Após a última tarefa, Verifier independente e sensor de discriminação. Resultados de execução devem constar nos registros por tarefa; não presumir aprovação por existência de arquivos. Aprovar o planejamento não revoga a regra ERP somente leitura; envio, importação real, push e deploy exigem autorização específica.

## Histórias da primeira etapa

| História | Entrega demonstrável | Subtarefas |
| --- | --- | --- |
| US01 | Validar as fontes do piloto | T1 |
| US02 | Atualizar dados com segurança | T2, T3, T8, T9, T10, T11, T12, T13, T14 |
| US03 | Identificar produtos e parâmetros de compra | T4, T15, T16, T17, T18 |
| US04 | Consultar vendas líquidas totais | T5, T19 |
| US05 | Consultar disponibilidade e abastecimento | T6, T7, T20, T21 |
| US06 | Receber uma recomendação explicável | T22 |
| US07 | Revisar a lista no celular | T23, T24, T25, T26 |
| US08 | Salvar uma rodada local de revisão | T27, T28, T29, T30, T31, T32, T35 |
| US09 | Auditar decisões e pendências | T33, T34 |

US10–US16 e suas 28 subtarefas de refinamento estão em spec.md. Não foram eliminadas nem contabilizadas como tarefas prontas.

## Test Coverage Matrix

Gerada das diretrizes AGENTS.md, RFC-005, package.json, vitest.config.ts, playwright.config.ts e CI. Amostras: user-lifecycle, admin-password, user-directory, login-form e database-connection. Testes unitários obrigatórios para comportamento novo. Não há meta percentual configurada; todos os critérios e casos de borda da tarefa devem estar cobertos. Cada tarefa inclui seus próprios testes, mesmo quando o arquivo de teste fica em diretório separado.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| domínio / serviço | unit | Todos os ACs e ramos da tarefa; valores esperados derivados da spec, incluindo falhas e ausência de dados | tests/unit/*.test.ts | npm test |
| persistência | unit + integration | Unicidade, precisão, rollback, versão, concorrência e reinício; PostgreSQL descartável | tests/unit/*.test.ts e tests/integration/*.spec.ts | npm test e npm run test:integration |
| rota | unit + integration | Sucesso, entrada inválida, 401/403, falha de dependência e conflito quando aplicável | tests/unit/*.test.ts e tests/integration/*.spec.ts | npm test e npm run test:integration |
| UI | unit | Interações, estados, valores, eventos e acessibilidade por teclado pertinentes à tarefa | tests/unit/*.test.ts | npm test |
| UI integrada | unit + integration | Jornada com auth, persistência local e mock ERP; viewport 390px | tests/unit/*.test.ts e tests/integration/*.spec.ts | npm test e npm run test:integration |
| documento de contrato | manual | Evidência por fonte, ausência explícita, zero operações proibidas e nenhum segredo | docs/validacao-erp-leitura.md | git diff --check |

Fixtures devem ser sintéticas ou minimizadas e sem segredos. CI e testes automatizados não usam ERP real. Na integração, levantar servidor local e PostgreSQL descartável conforme CI; não carregar URL de produção por engano.

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefas unitárias | npm test |
| Full | Persistência, autorização, rotas e jornada integrada | npm run check && npm run test:integration |
| Build | Conclusão de fase ou configuração | npm run check |
| Evidence | Investigação documental T1 | git diff --check e revisão das evidências sanitizadas |

Quick não dispensa Build ao fechar a fase. Registrar quantidade inicial e final de testes; não fixar contagem fictícia antes de executá-los. Cada tarefa precisa ao menos de um teste por AC aplicável e por cenário de falha listado, sem apagar testes para obter aprovação.

## Execution Plan

Seis fases por dependência; o usuário autorizou explicitamente agentes paralelos em frentes independentes. Integrações e gates consolidados continuam sequenciais. Fases: contratos (T1–T7), sincronização local (T8–T14), parâmetros e indicadores (T15–T20), recomendação e tela (T21–T26), revisão local (T27–T32), histórico e jornada (T33–T35). G1–G5 também são dependências obrigatórias, conforme context.md.

```text
T1 -> T2
T2 -> T3
T1 -> T4
T2 -> T4
T1 -> T5
T2 -> T5
T1 -> T6
T2 -> T6
T1 -> T7
T2 -> T7
T4 -> T8
T5 -> T8
T6 -> T8
T7 -> T8
T8 -> T9
T9 -> T10
T3 -> T11
T4 -> T11
T5 -> T11
T6 -> T11
T7 -> T11
T10 -> T11
T11 -> T12
T10 -> T13
T12 -> T14
T13 -> T14
T4 -> T15
T10 -> T16
T15 -> T16
T16 -> T17
T17 -> T18
T5 -> T19
T15 -> T19
T6 -> T20
T15 -> T20
T7 -> T21
T19 -> T21
T20 -> T21
T15 -> T22
T19 -> T22
T20 -> T22
T21 -> T22
T10 -> T23
T16 -> T23
T22 -> T23
T23 -> T24
T23 -> T25
T24 -> T25
T14 -> T26
T18 -> T26
T25 -> T26
T8 -> T27
T22 -> T27
T27 -> T28
T28 -> T29
T15 -> T30
T22 -> T30
T29 -> T30
T30 -> T31
T31 -> T32
T29 -> T33
T33 -> T34
T26 -> T35
T32 -> T35
T34 -> T35
```

## Task Breakdown

### Phase 1: Contratos

#### T1: Validar contratos de leitura e semântica dos dados

**Status de execução**: Parcial. Evidência operacional de fontes ainda pendente; relatório local entregue.

**Story**: US01
**Requirement**: CV-01
**What**: Documentar produtos, estoque, fornecedores, compras abertas, vendas e devoluções com campos/semântica confirmados ou pendentes; nenhum segredo ou corpo pessoal persistido.
**Where**: `docs/validacao-erp-leitura.md`
**Depends on**: None
**Reuses**: RFC-011 e documentação Swagger, somente leitura
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Documentar produtos, estoque, fornecedores, compras abertas, vendas e devoluções com campos/semântica confirmados ou pendentes; nenhum segredo ou corpo pessoal persistido.
- [ ] Critérios de US01 pertinentes à entrega e casos de falha possuem evidência documental sanitizada.
- [ ] Gate Evidence passa; registrar comando, resultado e limitações da fonte.

**Tests**: manual
**Gate**: Evidence
**Commit**: `docs(comprador): validar contratos de leitura e semântica dos dados`

#### T2: Restringir o transporte do ERP a consultas permitidas

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US02
**Requirement**: CV-02
**What**: Usar Authorization sem Bearer, origem fixa, allowlist de consultas e rejeitar escrita e redirecionamento externo antes do envio; 401 encerra a consulta sem refresh.
**Where**: `server/infrastructure/erp/read-client.ts`
**Depends on**: T1
**Reuses**: Contratos injetáveis de server/services/auth.ts e RFC-005
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Usar Authorization sem Bearer, origem fixa, allowlist de consultas e rejeitar escrita e redirecionamento externo antes do envio; 401 encerra a consulta sem refresh.
- [x] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): restringir o transporte do erp a consultas permitidas`

#### T3: Percorrer páginas sem publicar carga incompleta

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US02
**Requirement**: CV-02
**What**: Coletar start/count/items até término validado; detectar página repetida/inconsistente e propagar falha sem promover resultado parcial.
**Where**: `server/infrastructure/erp/paginate.ts`
**Depends on**: T2
**Reuses**: Contratos injetáveis de server/services/auth.ts e RFC-005
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Coletar start/count/items até término validado; detectar página repetida/inconsistente e propagar falha sem promover resultado parcial.
- [x] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): percorrer páginas sem publicar carga incompleta`

#### T4: Traduzir produtos e fornecedores

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US03
**Requirement**: CV-03
**What**: Preservar IDs, apresentação, fornecedor e conversão; SKU não identificado gera pendência em vez de fusão por nome.
**Where**: `server/infrastructure/erp/catalog-mapper.ts`
**Depends on**: T1, T2
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Preservar IDs, apresentação, fornecedor e conversão; SKU não identificado gera pendência em vez de fusão por nome.
- [x] Critérios de US03 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): traduzir produtos e fornecedores`

#### T5: Traduzir vendas e devoluções

**Status de execução**: Parcial. Devoluções e cobertura histórica ainda não reconciliadas; implementação sinaliza a limitação.

**Story**: US04
**Requirement**: CV-04
**What**: Preservar identidade do documento/item, datas, quantidade e vínculos de cancelamento/devolução, sem expor dados pessoais desnecessários.
**Where**: `server/infrastructure/erp/sales-mapper.ts`
**Depends on**: T1, T2
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Preservar identidade do documento/item, datas, quantidade e vínculos de cancelamento/devolução, sem expor dados pessoais desnecessários.
- [ ] Critérios de US04 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): traduzir vendas e devoluções`

#### T6: Traduzir saldos e disponibilidade conhecida

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US05
**Requirement**: CV-05
**What**: Distinguir saldo por local, reserva e bloqueio; ausência ou semântica desconhecida permanece indeterminada.
**Where**: `server/infrastructure/erp/stock-mapper.ts`
**Depends on**: T1, T2
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Distinguir saldo por local, reserva e bloqueio; ausência ou semântica desconhecida permanece indeterminada.
- [x] Critérios de US05 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): traduzir saldos e disponibilidade conhecida`

#### T7: Traduzir compras pendentes

**Status de execução**: Parcial. Atendimento parcial bloqueado até comprovar unidades na origem.

**Story**: US05
**Requirement**: CV-05
**What**: Preservar pedido/item, status, unidade, quantidade atendida/cancelada e data prevista; não transformar consulta indisponível em lista vazia válida.
**Where**: `server/infrastructure/erp/purchase-mapper.ts`
**Depends on**: T1, T2
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Preservar pedido/item, status, unidade, quantidade atendida/cancelada e data prevista; não transformar consulta indisponível em lista vazia válida.
- [ ] Critérios de US05 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): traduzir compras pendentes`

### Phase 2: Sincronização local

#### T8: Definir esquema local de versões sincronizadas

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US02
**Requirement**: CV-02
**What**: Representar snapshots, itens, origem, estados, políticas locais versionadas e execução ativa com identidade única e versão publicada; valores decimais e IDs preservados.
**Where**: `server/db/erp-schema.ts`
**Depends on**: T4, T5, T6, T7
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Representar snapshots, itens, origem, estados, políticas locais versionadas e execução ativa com identidade única e versão publicada; valores decimais e IDs preservados.
- [x] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): definir esquema local de versões sincronizadas`

#### T9: Gerar migration local dos dados sincronizados

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US02
**Requirement**: CV-02
**What**: Integrar o novo esquema à entrada Drizzle existente e gerar migration e metadados coerentes; aplicar e reaplicar somente no PostgreSQL descartável, sem alterar usuários existentes.
**Where**: `server/db/migrations-postgresql/0001_erp_snapshots.sql`
**Depends on**: T8
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Integrar o novo esquema à entrada Drizzle existente e gerar migration e metadados coerentes; aplicar e reaplicar somente no PostgreSQL descartável, sem alterar usuários existentes.
- [x] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): gerar migration local dos dados sincronizados`

#### T10: Persistir e publicar snapshots atomicamente

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US02
**Requirement**: CV-02
**What**: Upsert sem duplicação e publicação transacional por conjunto; falha mantém versão anterior; lock persistido evita duas execuções da mesma origem.
**Where**: `server/infrastructure/persistence/erp-repository.ts`
**Depends on**: T9
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Upsert sem duplicação e publicação transacional por conjunto; falha mantém versão anterior; lock persistido evita duas execuções da mesma origem.
- [x] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): persistir e publicar snapshots atomicamente`

#### T11: Coordenar sincronização manual

**Status de execução**: Parcial. Carga completa transacional; checkpoints por conjunto não implementados.

**Story**: US02
**Requirement**: CV-02
**What**: Executar leituras por contratos injetáveis, registrar progresso e pendências por conjunto e só publicar conjuntos completos; preservar checkpoints recuperáveis.
**Where**: `server/application/erp/synchronize.ts`
**Depends on**: T3, T4, T5, T6, T7, T10
**Reuses**: Contratos injetáveis de server/services/auth.ts e RFC-005
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Executar leituras por contratos injetáveis, registrar progresso e pendências por conjunto e só publicar conjuntos completos; preservar checkpoints recuperáveis.
- [ ] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): coordenar sincronização manual`

#### T12: Expor solicitação local de sincronização

**Story**: US02
**Requirement**: CV-02
**What**: Exigir sessão/permissão, iniciar uma execução ou devolver a existente; endpoint local não encaminha POST ao ERP.
**Where**: `server/api/erp/sync.post.ts`
**Depends on**: T11
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Exigir sessão/permissão, iniciar uma execução ou devolver a existente; endpoint local não encaminha POST ao ERP.
- [ ] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor solicitação local de sincronização`

#### T13: Expor estado local da sincronização

**Story**: US02
**Requirement**: CV-02
**What**: Retornar estado e última versão válida por conjunto a usuário autenticado, sem token e sem declarar sucesso global diante de falha parcial.
**Where**: `server/api/erp/status.get.ts`
**Depends on**: T10
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Retornar estado e última versão válida por conjunto a usuário autenticado, sem token e sem declarar sucesso global diante de falha parcial.
- [ ] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor estado local da sincronização`

#### T14: Mostrar atualização e falhas

**Story**: US02
**Requirement**: CV-02
**What**: Exibir referência, execução ativa e erro; desabilitar disparo duplicado e preservar último sucesso visível.
**Where**: `app/components/ErpSyncStatus.vue`
**Depends on**: T12, T13
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Exibir referência, execução ativa e erro; desabilitar disparo duplicado e preservar último sucesso visível.
- [ ] Critérios de US02 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): mostrar atualização e falhas`

### Phase 3: Parâmetros e indicadores

#### T15: Validar parâmetros e conversões

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US03
**Requirement**: CV-03
**What**: Validar L, R, S, M, janela e embalagem; exigir configuração explícita pendente de G2 e manter origem de valores manuais/ERP.
**Where**: `server/domain/replenishment/policy.ts`
**Depends on**: T4
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Validar L, R, S, M, janela e embalagem; exigir configuração explícita pendente de G2 e manter origem de valores manuais/ERP.
- [x] Critérios de US03 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): validar parâmetros e conversões`

#### T16: Persistir políticas locais por SKU

**Status de execução**: Absorvida. Entrega coesa compartilhada com T10

**Story**: US03
**Requirement**: CV-03
**What**: Guardar políticas e versões locais usando estrutura prevista no esquema; edição manual não sobrescreve origem ERP e sobrevive a reinício.
**Where**: `server/infrastructure/persistence/policy-repository.ts`
**Depends on**: T10, T15
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Guardar políticas e versões locais usando estrutura prevista no esquema; edição manual não sobrescreve origem ERP e sobrevive a reinício.
- [x] Critérios de US03 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): persistir políticas locais por sku`

#### T17: Expor alteração de política local

**Story**: US03
**Requirement**: CV-03
**What**: Validar entrada e permissão, salvar política local com versão e rejeitar conflito com 409; nenhuma alteração no cadastro ERP.
**Where**: `server/api/replenishment/policies/[id].put.ts`
**Depends on**: T16
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Validar entrada e permissão, salvar política local com versão e rejeitar conflito com 409; nenhuma alteração no cadastro ERP.
- [ ] Critérios de US03 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor alteração de política local`

#### T18: Editar política de reposição

**Story**: US03
**Requirement**: CV-03
**What**: Exibir origem dos parâmetros, validar campos obrigatórios, informar sucesso/erro e manter formulário após falha.
**Where**: `app/components/ReplenishmentPolicyEditor.vue`
**Depends on**: T17
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Exibir origem dos parâmetros, validar campos obrigatórios, informar sucesso/erro e manter formulário após falha.
- [ ] Critérios de US03 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): editar política de reposição`

#### T19: Calcular consumo líquido nas quatro janelas

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US04
**Requirement**: CV-04
**What**: Contabilizar documento/item uma vez, tratar cancelamentos e devoluções vinculados; 10 menos 2 resulta 8; janela parcial fica sinalizada.
**Where**: `server/domain/replenishment/net-demand.ts`
**Depends on**: T5, T15
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Contabilizar documento/item uma vez, tratar cancelamentos e devoluções vinculados; 10 menos 2 resulta 8; janela parcial fica sinalizada.
- [x] Critérios de US04 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): calcular consumo líquido nas quatro janelas`

#### T20: Calcular disponibilidade sem dupla dedução

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US05
**Requirement**: CV-05
**What**: 20 físicos menos reserva 4 e bloqueio disjunto 2 resulta 14; sobreposição não demonstrada produz pendência.
**Where**: `server/domain/replenishment/availability.ts`
**Depends on**: T6, T15
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: 20 físicos menos reserva 4 e bloqueio disjunto 2 resulta 14; sobreposição não demonstrada produz pendência.
- [x] Critérios de US05 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): calcular disponibilidade sem dupla dedução`

### Phase 4: Recomendação e tela

#### T21: Projetar saldo por data

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US05
**Requirement**: CV-05
**What**: Aplicar demanda e recebimentos em datas, manter ruptura anterior a chegada tardia e excluir rascunhos locais das entradas confirmadas.
**Where**: `server/domain/replenishment/project-stock.ts`
**Depends on**: T7, T19, T20
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Aplicar demanda e recebimentos em datas, manter ruptura anterior a chegada tardia e excluir rascunhos locais das entradas confirmadas.
- [x] Critérios de US05 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): projetar saldo por data`

#### T22: Calcular sugestão e explicação

**Status de execução**: Implementada e testada localmente. Gates locais aprovados; conclusão global permanece pendente.

**Story**: US06
**Requirement**: CV-06
**What**: Aplicar fórmula aprovada em G2, separar bruto/arredondado, calcular cobertura/excesso e distinguir giro indisponível; cenário proposto retorna bruto 7 e sugestão 12.
**Where**: `server/domain/replenishment/recommend.ts`
**Depends on**: T15, T19, T20, T21
**Reuses**: Padrão de funções puras e testes de user-lifecycle
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Aplicar fórmula aprovada em G2, separar bruto/arredondado, calcular cobertura/excesso e distinguir giro indisponível; cenário proposto retorna bruto 7 e sugestão 12.
- [x] Critérios de US06 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): calcular sugestão e explicação`

#### T23: Expor consulta das recomendações

**Story**: US07
**Requirement**: CV-07
**What**: Exigir sessão, devolver lista/detalhe filtráveis e paginados com parâmetros, snapshot, fonte e alertas; sem leitura direta do ERP a cada renderização.
**Where**: `server/api/replenishment/index.get.ts`
**Depends on**: T10, T16, T22
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Exigir sessão, devolver lista/detalhe filtráveis e paginados com parâmetros, snapshot, fonte e alertas; sem leitura direta do ERP a cada renderização.
- [ ] Critérios de US07 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor consulta das recomendações`

#### T24: Exibir memória de cálculo do SKU

**Story**: US07
**Requirement**: CV-07
**What**: Mostrar contribuições, janelas, origem, bruto, múltiplo e arredondado; explicar cada resultado indisponível.
**Where**: `app/components/ReplenishmentExplanation.vue`
**Depends on**: T23
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Mostrar contribuições, janelas, origem, bruto, múltiplo e arredondado; explicar cada resultado indisponível.
- [ ] Critérios de US07 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): exibir memória de cálculo do sku`

#### T25: Exibir lista filtrável de reposição

**Story**: US07
**Requirement**: CV-07
**What**: Combinar filtros produto/fornecedor/risco/pendências, priorizar ruptura e preservar acesso ao detalhe em 390px; estados vazio e erro distintos.
**Where**: `app/components/ReplenishmentList.vue`
**Depends on**: T23, T24
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Combinar filtros produto/fornecedor/risco/pendências, priorizar ruptura e preservar acesso ao detalhe em 390px; estados vazio e erro distintos.
- [ ] Critérios de US07 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): exibir lista filtrável de reposição`

#### T26: Compor página autenticada de reposição

**Story**: US07
**Requirement**: CV-07
**What**: Reutilizar AppShell e auth; conectar atualização, políticas e lista; erro de uma consulta não apaga versão válida já apresentada.
**Where**: `app/pages/replenishment.vue`
**Depends on**: T14, T18, T25
**Reuses**: auth middleware, AppShell, padrão de páginas e Playwright existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Reutilizar AppShell e auth; conectar atualização, políticas e lista; erro de uma consulta não apaga versão válida já apresentada.
- [ ] Critérios de US07 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): compor página autenticada de reposição`

### Phase 5: Revisão local

#### T27: Definir esquema de rodadas locais

**Status de execução**: Absorvida. Entrega coesa compartilhada com T8

**Story**: US08
**Requirement**: CV-08
**What**: Modelar rodada, itens, grupo por fornecedor, autor, snapshot, versão, chave idempotente e estado local; preservar sugestão e ajuste separados.
**Where**: `server/db/purchase-draft-schema.ts`
**Depends on**: T8, T22
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Modelar rodada, itens, grupo por fornecedor, autor, snapshot, versão, chave idempotente e estado local; preservar sugestão e ajuste separados.
- [x] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): definir esquema de rodadas locais`

#### T28: Gerar migration de rodadas locais

**Status de execução**: Absorvida. Entrega coesa compartilhada com T9

**Story**: US08
**Requirement**: CV-08
**What**: Gerar migration e metadados associados; testar unicidade e integridade no banco local sem modificar tabelas no ERP.
**Where**: `server/db/migrations-postgresql/0002_purchase_drafts.sql`
**Depends on**: T27
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Gerar migration e metadados associados; testar unicidade e integridade no banco local sem modificar tabelas no ERP.
- [x] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): gerar migration de rodadas locais`

#### T29: Persistir rodadas com concorrência controlada

**Status de execução**: Absorvida. Entrega coesa compartilhada com T10

**Story**: US08
**Requirement**: CV-08
**What**: Salvar grupos atomicamente, recuperar rascunhos após reinício, devolver rodada existente para mesma chave e rejeitar versão obsoleta.
**Where**: `server/infrastructure/persistence/draft-repository.ts`
**Depends on**: T28
**Reuses**: Drizzle/PostgreSQL e migrations versionadas; metadados gerados pertencem à mesma entrega
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [x] Entrega demonstrada: Salvar grupos atomicamente, recuperar rascunhos após reinício, devolver rodada existente para mesma chave e rejeitar versão obsoleta.
- [x] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [x] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): persistir rodadas com concorrência controlada`

#### T30: Revisar e confirmar rascunhos localmente

**Story**: US08
**Requirement**: CV-08
**What**: Validar ajuste, embalagem, snapshot e permissão; recalcular subtotais, preservar sugestão original e agrupar fornecedor sem emitir compra externa.
**Where**: `server/application/purchases/review-draft.ts`
**Depends on**: T15, T22, T29
**Reuses**: Contratos injetáveis de server/services/auth.ts e RFC-005
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Validar ajuste, embalagem, snapshot e permissão; recalcular subtotais, preservar sugestão original e agrupar fornecedor sem emitir compra externa.
- [ ] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): revisar e confirmar rascunhos localmente`

#### T31: Expor gravação da rodada local

**Story**: US08
**Requirement**: CV-08
**What**: Aceitar somente comandos locais de salvar/revisar rascunho com chave e versão; devolver 400/401/403/409 nos cenários definidos e nunca chamar escrita ERP.
**Where**: `server/api/purchase-drafts/index.post.ts`
**Depends on**: T30
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Aceitar somente comandos locais de salvar/revisar rascunho com chave e versão; devolver 400/401/403/409 nos cenários definidos e nunca chamar escrita ERP.
- [ ] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor gravação da rodada local`

#### T32: Revisar itens e resumo da rodada

**Story**: US08
**Requirement**: CV-08
**What**: Ajustar e remover itens da rodada, apresentar valores estimados e confirmação local; persistir pelo endpoint e manter edição em caso de erro.
**Where**: `app/components/PurchaseDraftEditor.vue`
**Depends on**: T31
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Ajustar e remover itens da rodada, apresentar valores estimados e confirmação local; persistir pelo endpoint e manter edição em caso de erro.
- [ ] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): revisar itens e resumo da rodada`

### Phase 6: Histórico e jornada

#### T33: Expor histórico de rodadas

**Story**: US09
**Requirement**: CV-09
**What**: Consultar lista e rodada selecionada por identificador validado, incluindo auditoria/snapshot e pendências; aplicar permissão em todas as consultas.
**Where**: `server/api/purchase-drafts/index.get.ts`
**Depends on**: T29
**Reuses**: server/utils/auth.ts, validação Zod e padrão de rotas existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Consultar lista e rodada selecionada por identificador validado, incluindo auditoria/snapshot e pendências; aplicar permissão em todas as consultas.
- [ ] Critérios de US09 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): expor histórico de rodadas`

#### T34: Exibir histórico e pendências locais

**Story**: US09
**Requirement**: CV-09
**What**: Mostrar autor, data, versão, sugestões, ajustes e grupos por fornecedor; nunca rotular rascunho como pedido aceito no ERP.
**Where**: `app/components/PurchaseDraftHistory.vue`
**Depends on**: T33
**Reuses**: AppShell, Nuxt UI e padrão Vue Test Utils de UserDirectory
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Mostrar autor, data, versão, sugestões, ajustes e grupos por fornecedor; nunca rotular rascunho como pedido aceito no ERP.
- [ ] Critérios de US09 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Quick passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit
**Gate**: Quick
**Commit**: `feat(comprador): exibir histórico e pendências locais`

#### T35: Compor página de revisão e histórico

**Story**: US08
**Requirement**: CV-08
**What**: Permitir selecionar itens da recomendação, salvar/reabrir rodada e consultar histórico no celular com auth; fluxo termina no rascunho local.
**Where**: `app/pages/purchase-drafts.vue`
**Depends on**: T26, T32, T34
**Reuses**: auth middleware, AppShell, padrão de páginas e Playwright existentes
**Tools**: filesystem/shell; skill tlc-spec-driven. Nenhum conector de escrita externo.

**Done when**:

- [ ] Entrega demonstrada: Permitir selecionar itens da recomendação, salvar/reabrir rodada e consultar histórico no celular com auth; fluxo termina no rascunho local.
- [ ] Critérios de US08 pertinentes à entrega e casos de falha possuem evidência em testes escritos junto desta tarefa.
- [ ] Gate Full passa; registrar comando, resultado e contagem antes/depois sem supressão de testes.

**Tests**: unit + integration
**Gate**: Full
**Commit**: `feat(comprador): compor página de revisão e histórico`

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Um entregável: validar contratos de leitura e semântica dos dados + seus testes | OK |
| T2 | Um entregável: restringir o transporte do erp a consultas permitidas + seus testes | OK |
| T3 | Um entregável: percorrer páginas sem publicar carga incompleta + seus testes | OK |
| T4 | Um entregável: traduzir produtos e fornecedores + seus testes | OK |
| T5 | Um entregável: traduzir vendas e devoluções + seus testes | OK |
| T6 | Um entregável: traduzir saldos e disponibilidade conhecida + seus testes | OK |
| T7 | Um entregável: traduzir compras pendentes + seus testes | OK |
| T8 | Um entregável: definir esquema local de versões sincronizadas + seus testes | OK |
| T9 | Um entregável: gerar migration local dos dados sincronizados + seus testes | OK |
| T10 | Um entregável: persistir e publicar snapshots atomicamente + seus testes | OK |
| T11 | Um entregável: coordenar sincronização manual + seus testes | OK |
| T12 | Um entregável: expor solicitação local de sincronização + seus testes | OK |
| T13 | Um entregável: expor estado local da sincronização + seus testes | OK |
| T14 | Um entregável: mostrar atualização e falhas + seus testes | OK |
| T15 | Um entregável: validar parâmetros e conversões + seus testes | OK |
| T16 | Um entregável: persistir políticas locais por sku + seus testes | OK |
| T17 | Um entregável: expor alteração de política local + seus testes | OK |
| T18 | Um entregável: editar política de reposição + seus testes | OK |
| T19 | Um entregável: calcular consumo líquido nas quatro janelas + seus testes | OK |
| T20 | Um entregável: calcular disponibilidade sem dupla dedução + seus testes | OK |
| T21 | Um entregável: projetar saldo por data + seus testes | OK |
| T22 | Um entregável: calcular sugestão e explicação + seus testes | OK |
| T23 | Um entregável: expor consulta das recomendações + seus testes | OK |
| T24 | Um entregável: exibir memória de cálculo do sku + seus testes | OK |
| T25 | Um entregável: exibir lista filtrável de reposição + seus testes | OK |
| T26 | Um entregável: compor página autenticada de reposição + seus testes | OK |
| T27 | Um entregável: definir esquema de rodadas locais + seus testes | OK |
| T28 | Um entregável: gerar migration de rodadas locais + seus testes | OK |
| T29 | Um entregável: persistir rodadas com concorrência controlada + seus testes | OK |
| T30 | Um entregável: revisar e confirmar rascunhos localmente + seus testes | OK |
| T31 | Um entregável: expor gravação da rodada local + seus testes | OK |
| T32 | Um entregável: revisar itens e resumo da rodada + seus testes | OK |
| T33 | Um entregável: expor histórico de rodadas + seus testes | OK |
| T34 | Um entregável: exibir histórico e pendências locais + seus testes | OK |
| T35 | Um entregável: compor página de revisão e histórico + seus testes | OK |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | Match |
| T2 | T1 | T1 | Match |
| T3 | T2 | T2 | Match |
| T4 | T1, T2 | T1, T2 | Match |
| T5 | T1, T2 | T1, T2 | Match |
| T6 | T1, T2 | T1, T2 | Match |
| T7 | T1, T2 | T1, T2 | Match |
| T8 | T4, T5, T6, T7 | T4, T5, T6, T7 | Match |
| T9 | T8 | T8 | Match |
| T10 | T9 | T9 | Match |
| T11 | T3, T4, T5, T6, T7, T10 | T3, T4, T5, T6, T7, T10 | Match |
| T12 | T11 | T11 | Match |
| T13 | T10 | T10 | Match |
| T14 | T12, T13 | T12, T13 | Match |
| T15 | T4 | T4 | Match |
| T16 | T10, T15 | T10, T15 | Match |
| T17 | T16 | T16 | Match |
| T18 | T17 | T17 | Match |
| T19 | T5, T15 | T5, T15 | Match |
| T20 | T6, T15 | T6, T15 | Match |
| T21 | T7, T19, T20 | T7, T19, T20 | Match |
| T22 | T15, T19, T20, T21 | T15, T19, T20, T21 | Match |
| T23 | T10, T16, T22 | T10, T16, T22 | Match |
| T24 | T23 | T23 | Match |
| T25 | T23, T24 | T23, T24 | Match |
| T26 | T14, T18, T25 | T14, T18, T25 | Match |
| T27 | T8, T22 | T8, T22 | Match |
| T28 | T27 | T27 | Match |
| T29 | T28 | T28 | Match |
| T30 | T15, T22, T29 | T15, T22, T29 | Match |
| T31 | T30 | T30 | Match |
| T32 | T31 | T31 | Match |
| T33 | T29 | T29 | Match |
| T34 | T33 | T33 | Match |
| T35 | T26, T32, T34 | T26, T32, T34 | Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | documento | manual | manual | OK |
| T2 | serviço | unit | unit | OK |
| T3 | serviço | unit | unit | OK |
| T4 | domínio | unit | unit | OK |
| T5 | domínio | unit | unit | OK |
| T6 | domínio | unit | unit | OK |
| T7 | domínio | unit | unit | OK |
| T8 | persistência | unit + integration | unit + integration | OK |
| T9 | persistência | unit + integration | unit + integration | OK |
| T10 | persistência | unit + integration | unit + integration | OK |
| T11 | serviço | unit | unit | OK |
| T12 | rota | unit + integration | unit + integration | OK |
| T13 | rota | unit + integration | unit + integration | OK |
| T14 | UI | unit | unit | OK |
| T15 | domínio | unit | unit | OK |
| T16 | persistência | unit + integration | unit + integration | OK |
| T17 | rota | unit + integration | unit + integration | OK |
| T18 | UI | unit | unit | OK |
| T19 | domínio | unit | unit | OK |
| T20 | domínio | unit | unit | OK |
| T21 | domínio | unit | unit | OK |
| T22 | domínio | unit | unit | OK |
| T23 | rota | unit + integration | unit + integration | OK |
| T24 | UI | unit | unit | OK |
| T25 | UI | unit | unit | OK |
| T26 | UI integrada | unit + integration | unit + integration | OK |
| T27 | persistência | unit + integration | unit + integration | OK |
| T28 | persistência | unit + integration | unit + integration | OK |
| T29 | persistência | unit + integration | unit + integration | OK |
| T30 | serviço | unit | unit | OK |
| T31 | rota | unit + integration | unit + integration | OK |
| T32 | UI | unit | unit | OK |
| T33 | rota | unit + integration | unit + integration | OK |
| T34 | UI | unit | unit | OK |
| T35 | UI integrada | unit + integration | unit + integration | OK |

## Antes de Execute

Resolver G1–G4 aplicáveis, produzir/revisar TDD e aprovar as premissas de spec.md. A geração deste plano não aprova valores ainda pendentes. Perguntar sobre ferramentas conforme a skill e oferecer agentes em lotes de fases inteiras (~7 tarefas), sem iniciar agentes até aceitação. Testes de persistência devem ter repositório testável antes de expor HTTP; não adiar teste para uma tarefa futura. Testes de segurança do transporte devem provar que operações ERP proibidas nunca são enviadas. Nenhuma tarefa deste plano cria ou altera dados no ERP.

## Reconciliação da implementação

Em retomadas após encerramento do aplicativo, arquivos foram preservados. A implementação local usa snapshots completos publicados atomicamente, em vez de checkpoints/publicação por conjunto: T11 permanece parcial nesse aspecto. Esquemas T8/T27, migrations T9/T28 e repositório T10/T16/T29 compartilham entregáveis coesos; as linhas posteriores serão registradas como absorvidas, sem fingir commits independentes para o mesmo arquivo. Evidências sintéticas não comprovam integração operacional: T1, reconciliação de devoluções T5 e atendimento parcial T7 permanecem pendentes. Nenhuma escrita no ERP ou envio de pedido foi implementado.
