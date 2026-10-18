# Comprador virtual — validação

## Validation: FAIL

**Escopo do veredito:** encerramento da feature completa do PRD. O software da etapa local foi implementado, mas fontes reais e histórias condicionais continuam pendentes. O veredito não deve ser substituído por aprovação global baseada apenas em fixtures.

## Conciliação documental e de evidências — 18/10/2026

Revisados PRD, histórias, tarefas, RFC-011 a RFC-018 e o código atual dos
mapeadores, domínio, sincronização e complementos de interface. O veredito
global **FAIL permanece**: o primeiro impedimento é **US01/T1 — Validar as
fontes do piloto**, ainda parcial. A tabela atual por história está em
[tasks.md](tasks.md). Não foram geradas novas histórias, alterados critérios
originais ou implementadas funcionalidades nesta conciliação.

| Pendência | Evidência atual confrontada | Consequência para o aceite |
| --- | --- | --- |
| US01/T1 — fontes reais | RFC-011 documenta leitura/mapeamento operacional, mas não conciliação completa das semânticas necessárias | Ler páginas ou sincronizar catálogo não comprova demanda e disponibilidade confiáveis |
| US04/T5 — vendas e devoluções | `sales-mapper.ts` não consome os vínculos de devolução, retorna `historyFrom: null`, `SALES_HISTORY_COVERAGE_UNCONFIRMED` e `RETURNS_RECONCILIATION_UNCONFIRMED`; `erp-sales.test.ts` exige preservar essas limitações | T19 prova cálculo com fixtures, sem liberar vendas líquidas e cobertura histórica reais |
| US05/T6/T20 — estoque disponível | `stock-mapper.ts` mantém `reserved`/`blocked` nulos e `disjoint: false`; `availability.ts` devolve indisponibilidade; `erp-stock.test.ts` preserva o desconhecido | Saldo físico conhecido não comprova estoque disponível; US05 continua parcial embora T6/T20 tenham software local verificado |
| US05/T7 — recebimento parcial | `purchase-mapper.ts` aceita somente o subconjunto aberto sem atendimento/cancelamento e bloqueia unidades não comprovadas; regressões em `erp-purchase.test.ts` | Não há suporte operacional validado a compras parcialmente recebidas |
| US02/T11 — retomada por conjunto | `synchronize.ts` carrega todos os conjuntos; `erp-repository.ts` publica um snapshot integral em transação e mantém o anterior na falha | Segurança do snapshot existe, mas checkpoints recuperáveis e publicação independente por conjunto permanecem não implementados |

US03/US06/US07/US08/US09 mantêm evidências de software local. As melhorias
pedidas de paginação, visões de decisão, ajuda de bloqueios, dashboard e base
visual foram vinculadas às histórias/tarefas existentes, com limites, em
`tasks.md`. Elas não completam as fontes reais, não enviam pedidos e não
substituem avaliação de uso pelo comprador. A sugestão de lista manual não
foi aprovada nem implementada.

**Gates da entrega conjunta atual:** o log
`/tmp/grand-cru-release-check.log` confirma `npm run check` aprovado com lint,
tipos, 52 arquivos/429 testes unitários e build. A coordenação também confirmou
ensaio Chromium da seleção SSR/hidratação aprovado; as duas regressões estão
em `replenishment-selection-hydration.test.ts`. A revisão visual das RFC-015
e RFC-016 usa dados sintéticos e não comprova integração real.

Na data desta conciliação, o novo PR/CI completo com PostgreSQL e a publicação
da entrega conjunta ainda estão pendentes. As validações, contagens e
publicações anteriores das RFC-011/RFC-012 e das seções históricas abaixo
não são resultado desses gates atuais. A entrega técnica pode passar sem
encerrar o PRD; não promover o veredito global por esse motivo.

**Precedência e limite da revisão:** AGENTS.md e RFC-011 autorizam login/refresh
restritos; RFC-017 autoriza push/PR/merge após checks e registra a publicação
solicitada; RFC-018 exige escopo rastreado. Esses registros superam restrições
antigas de planejamento apenas nos limites descritos. Logout e escrita de
negócio no ERP continuam proibidos. `tlc-spec-driven` não foi localizada nas
fontes disponíveis examinadas: esta atualização concilia o plano e as
evidências existentes, sem alegar nova execução formal da skill ou revisão
independente completa. `git diff --check` aprovado para a atualização.

## Registro histórico da validação original

**Revisão independente:** subagente verify_core rederivou os critérios e realizou o sensor em cópia isolada; relatório consolidado pelo coordenador a partir das evidências persistidas e das conclusões do revisor. O subagente atingiu limite de uso antes de gravar o relatório final. A correção final de prontidão de hidratação foi revisada pelo coordenador e testada no navegador, sem alegar nova revisão independente dessa alteração.
**Base Git:** 2e50fa3; branch local codex/comprador-virtual. Commits da implementação serão registrados no log de execução.
**Ambiente:** Node24.19.0; PostgreSQL17 descartável em loopback; token ERP vazio no servidor/testes de integração. Nenhum teste fez chamadas reais ao ERP. Os sete testes mutantes usaram transporte mockado inclusive na mutação GET para POST.

## Constatações e correções

- Classificação de 401 perdida na persistência: corrigida, mantendo ERP_AUTHENTICATION_PENDING sem expor segredos.
- Parâmetros alterados entre consulta e confirmação: expectedPolicyVersion requerido; comparação na aplicação e sob lock de persistência.
- Idempotência: repetição exata retorna rodada existente; chave reutilizada para outra decisão gera409.
- Auditoria: sugestão original, ajuste, autor, data, snapshot e referência dos parâmetros persistidos.
- Recebimento no mesmo dia: aplicado antes do consumo da data; chegada posterior não oculta insuficiência anterior.
- Grupos: regressões com dois fornecedores distinguem seções e itens; teste de data em America/Sao_Paulo.
- Pendências específicas de compra de um SKU não bloqueiam outro SKU válido; regressão numérica12 preservada. Essa correção adicional do coordenador possui teste direcionado e não foi atribuída ao revisor independente.
- Mobile: menu passa a quebrar linha; overflow detectado a390px e corrigido sem enfraquecer asserção.
- Hidratação: botão de abrir rodada SSR desabilitado até conexão dos eventos; regressão SSR e teste após reload mantidos.

## Evidências locais amostradas

Esta tabela não declara cobertura operacional dos dados reais nem substitui os registros de cada tarefa.

| Critério | Evidência e resultado especificado |
| --- | --- |
| CV-02: GET e origem fixa | `tests/unit/erp-read-client.test.ts:9` — `expect(fetcher).toHaveBeenCalledWith('https://fgcuritibabatel.varejofacil.com/api/v1/produto/produtos?start=0&count=100', expect.objectContaining({ method: 'GET', redirect: 'error', headers: { Accept: 'application/json', Authorization: 'synthetic-secret' } }))` |
| CV-02: rota proibida bloqueada antes do envio | `tests/unit/erp-read-client.test.ts:14` — `expect(fetcher).not.toHaveBeenCalled()` |
| CV-02: snapshot válido preservado | `tests/integration/purchasing.spec.ts:50` — `expect(failed.snapshotId).toBe(second.snapshotId)` |
| CV-02: 401 explicitamente pendente | `tests/integration/purchasing.spec.ts:55` — `expect(authenticationFailed.error).toBe('ERP_AUTHENTICATION_PENDING')` |
| CV-02: carga concorrente não duplica operação | `tests/integration/purchasing.spec.ts:69` — `expect(duplicated).toBe(false)` |
| CV-06: exemplo numérico da recomendação | `tests/integration/purchasing-api.spec.ts:69` — `expect(source.items[0].raw).toBe(7)` |
| CV-08: sugestão original12, ajuste18 | `tests/integration/purchasing-api.spec.ts:78` — `expect(draft.items[0]!.suggested).toBe(12)` |
| CV-08: total180 | `tests/integration/purchasing-api.spec.ts:80` — `expect(draft.total).toBe(180)` |
| CV-08: referência dos parâmetros | `tests/unit/purchase-draft-service.test.ts:39` — `expect(draft.items[0]!.reference!.policy!.packSize).toBe(6)` |
| CV-09: data auditável São Paulo | `tests/unit/replenishment-ui-history.test.ts:19` — `expect(wrapper.text()).toContain('16/10/2026, 09:00:00')` |
| CV-09: rodadas não representam entrada de estoque | `tests/integration/purchasing-api.spec.ts:83` — `expect(afterDraft.items[0].pending).toBe(0)` |
| CV-07/08/09: reabrir com18 após reload | `tests/integration/replenishment-ui.spec.ts:73` — `await expect(page.getByRole('spinbutton', { name: 'Quantidade ajustada de Vinho de revisão mobile', exact: true })).toHaveValue('18')` |
| CV-07: sem rolagem horizontal a390px | `tests/integration/replenishment-ui.spec.ts:57` — `expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)` |

## Sensor de discriminação

Baseline direcionado62 testes aprovados; mutações executadas novamente em Node24.19.0. A primeira comparação detectou modificações concorrentes do coordenador; a execução foi repetida com novo baseline e isolamento confirmado. Metadados sanitizados em execution/sensor.json.

| Mutação | Evidência de implementação | Detectada |
| --- | --- | --- |
| method | `server/infrastructure/erp/read-client.ts:72` | Sim, processo de teste falhou por assertiva |
| path | `server/infrastructure/erp/read-client.ts:59` | Sim, processo de teste falhou por assertiva |
| redirect | `server/infrastructure/erp/read-client.ts:72` | Sim, processo de teste falhou por assertiva |
| snapshot | `server/application/purchases/review-draft.ts:28` | Sim, processo de teste falhou por assertiva |
| rounding | `server/domain/replenishment/recommend.ts:32` | Sim, processo de teste falhou por assertiva |
| adjustment | `server/application/purchases/review-draft.ts:34` | Sim, processo de teste falhou por assertiva |
| availability | `server/domain/replenishment/availability.ts:16` | Sim, processo de teste falhou por assertiva |

Scratch descartado, árvore real não modificada pelo sensor. Nenhum mutante sobrevivente.

## Pendências que impedem encerramento global

| Item | Estado / efeito |
| --- | --- |
| US01/T1 | Falta conciliar amostras reais das fontes; status de contrato não equivale a validação operacional |
| T5 | Devoluções e cobertura histórica não comprovadas; adapter não inventa histórico nem vendas líquidas definitivas |
| T7 | Atendimento parcial bloqueado até comprovar unidades recebidas/canceladas; subset aberto sem atendimento é suportado |
| T11 | Publicação transacional de snapshot completo implementada; checkpoints independentes por conjunto não implementados |
| US10 | Layout de arquivo aceito pelo destino não informado; não afirmar que um CSV genérico é importável |
| US11 | Envio e qualquer escrita no ERP proibidos; nenhuma implementação de envio |
| US12 | B2B adiado explicitamente pelo usuário |
| US13–US16 | Fontes e regras de financeiro/OFX/Agendor pendentes, não substituídas por dados fictícios |

Nenhum desses itens foi silenciosamente marcado como completo. Dados desconhecidos permanecem como pendências, e as recomendações dependentes ficam indisponíveis. O critério de compra real aceita no ERP não foi realizado.

## Gates consolidados

- `npm run check` em Node24.19.0: lint e tipos aprovados;30 arquivos /247 testes unitários aprovados,0 falhas,0 ignorados; build de produção concluído. Log local: /tmp/grand-cru-check-delivery.log.
- Suíte completa local de integração:12 aprovados,0 falhas,0 ignorados. Inclui login/autorização, transações, lock, idempotência, conflitos, seleção, revisão, reload e histórico a390px. Log local: /tmp/grand-cru-integration-pass.log. A última correção isolada de escopo de pendência porSKU recebeu12 testes direcionados e foi incluída no check247 posterior; não altera os cenários de integração com fonte sem pendências.
- Sensor independente:7/7 mutantes mortos em Node24; baseline direcionado62/62; isolamento e descarte confirmados.
- `git diff --check`, `validate_spec.py --strict` e `validate_tasks.py --strict`: aprovados.
- `validate_state.py` deve continuar recusando o encerramento global enquanto o veredito desta feature forFAIL por contratos/fontes pendentes. Isto é uma barreira de completude, não um teste de código falhando.

Não houve push, deploy, migration de produção nem escrita via API no ERP. Nenhuma conta/chave real foi criada ou alterada. As gravações dos cenários de integração ocorreram somente no PostgreSQL local descartável.

## Commits locais

Unidades coesas de esquema/migration/repositório e wiring de rotas/páginas foram consolidadas explicitamente para manter cada conjunto testável. Tarefas absorvidas estão identificadas no tasks.md; não foram inventados commits independentes para o mesmo artefato.

| Tarefas | Commit | Entrega |
| --- | --- | --- |
| T1 | 6e92e13 | docs(comprador): registrar limites das fontes de leitura |
| T8, T27 | d736675 | feat(comprador): definir contratos e esquema local |
| T9, T28 | e180c59 | feat(comprador): versionar migration dos snapshots e rodadas |
| T2 | 71012fc | feat(erp): restringir transporte a consultas permitidas |
| T3 | d36896a | feat(erp): validar paginação e limites de carga |
| T4 | 7c3d5cb | feat(erp): traduzir produtos e fornecedores |
| T5 | ba18496 | feat(erp): traduzir cupons e sinalizar conciliação pendente |
| T6 | 041e963 | feat(erp): preservar saldos e disponibilidade desconhecida |
| T7 | c6764be | feat(erp): traduzir compras com unidades comprovadas |
| T10, T16, T29 | b4c079b | feat(comprador): persistir snapshots políticas e rodadas atomicamente |
| T11 | 099fee3 | feat(erp): coordenar carga completa sem publicar dados parciais |
| T15 | 5c2a4b5 | feat(comprador): validar parâmetros explícitos de reposição |
| T19 | 6172e9b | feat(comprador): calcular consumo líquido por janela |
| T20 | 50f77d1 | feat(comprador): calcular disponibilidade sem dupla dedução |
| T21 | f84323c | feat(comprador): projetar recebimentos por data |
| T22 | ecf7217 | feat(comprador): explicar sugestões e limitações dos dados |
| T30 | 6b9bbf6 | feat(comprador): revisar rodadas locais com controle de versão |
| T12, T13, T17, T23, T31, T33 | a911913 | feat(comprador): conectar rotas locais protegidas ao fluxo de revisão |
| T14 | d3f2ec6 | feat(comprador): apresentar estado da sincronização |
| T18 | c152098 | feat(comprador): editar parâmetros locais de reposição |
| T24 | 8a71514 | feat(comprador): apresentar memória de cálculo |
| T25 | 04e9fbe | feat(comprador): listar e selecionar produtos para revisão |
| T32 | 49780e7 | feat(comprador): revisar quantidades por fornecedor |
| T34 | 7a2ef99 | feat(comprador): exibir histórico com abertura após hidratação |
| T26, T35 | f19c546 | feat(comprador): compor jornada local responsiva e autenticada |
