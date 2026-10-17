# Reposição paginada e interface legível: validação

**Result**: PASS

Os13critérios estão comprovados. A lacuna de ordenação encontrada na primeira rodada foi corrigida por teste discriminante, sem alteração da implementação.

**Data:** 2026-10-17. **Verifier:** subagente independente, author ≠ verifier. **Spec:** `.specs/features/replenishment-usability/spec.md`. **Diff:** `d6552d2..8750cca` (a9f6925, 4f7ad70, b1c3f8d, 8750cca). Segunda rodada de verificação; histórico da primeira preservado abaixo.

## Critérios rederivados da spec

Os IDs AC1–AC13 seguem a ordem dos critérios na spec. Evidência abaixo aponta a asserção exata, com resultado esperado derivado da spec; nenhuma pendência foi reinterpretada como aprovação.

| AC | Resultado exigido | Evidência e asserção | Resultado |
| --- | --- | --- | --- |
| AC1 | Abertura solicita start=0/count=20 | `tests/unit/replenishment-pagination-page.test.ts:29`: `expect(requestQuery.value).toMatchObject({ start: 0, count: 20 })` | PASS |
| AC2 | Navegar, mostrar intervalo/total, limitar20 e bloquear extremos | `tests/unit/replenishment-pagination-ui.test.ts:10`: `toHaveLength(20)`; linhas12–14: `toContain('1–20 de 43 produtos')`, `toContain('Página 1 de 3')`, anterior disabled; linhas18/21/22/24: `toEqual([[20]])`, `toContain('41–43 de 43 produtos')`, próximo disabled, `toEqual([20])`. `tests/unit/replenishment-query.test.ts:13`: `toEqual([20, 20, 3])` | PASS |
| AC3 | Filtros reiniciam início, pesquisam conjunto completo, fornecedores globais, ruptura e desempate produto/loja | `tests/unit/replenishment-pagination-page.test.ts:37`: query exata com start0; `tests/unit/replenishment-query.test.ts:19`: `toEqual(['sku-42'])`; linha21: `toEqual(['f1', 'f2'])`; linha11: `toBe('sku-40')`. Desempate: `tests/unit/replenishment-query.test.ts:41`: `toEqual(['x/s1', 'z/s1', 'k/s1', 'a/s1', 'a/s2', 'b/s2'])`; linha42: recorte `toEqual(['a/s1', 'a/s2'])`. Três mutantes de desempate mortos na rodada2 | PASS |
| AC4 | Limpar seleção ao mudar página/filtros e bloquear indisponíveis | `tests/unit/replenishment-pagination-ui.test.ts:19` e31: `expect(wrapper.emitted('selection')!.at(-1)).toEqual([[]])`; `tests/unit/replenishment-ui-list.test.ts:37`: checkbox `disabled` definido; `tests/integration/usability.spec.ts:106`: item filtrado `toBeDisabled()` | PASS |
| AC5 | Preservar resposta em falha, erro/repetição; bloquear paginação/seleção na carga | `tests/unit/replenishment-ui-pages.test.ts:68`: `expect(list.props('items')).toEqual([recommendation])`; linha69: erro `toContain('Não foi possível')`; `tests/unit/replenishment-ui-list.test.ts:26`: `expect(wrapper.emitted('retry')).toEqual([[]])`; `tests/unit/replenishment-pagination-ui.test.ts:36`/37: botões e checkbox `disabled` definidos | PASS |
| AC6 | Paginação inválida retorna400; página sem itens mantém total; sem ERP | `tests/unit/replenishment-pagination-route.test.ts:28`: `rejects.toMatchObject({ statusCode: 400 })` para cinco entradas; linha29: repositório não chamado; linha38: `toMatchObject({ items: [], total: 25, start: 25, count: 20 })`. Rota inspecionada depende somente de snapshot/políticas persistidos, nenhum transporte ERP | PASS |
| AC7 | Rodadas preservam consulta completa, snapshot e elegibilidade inclusive itens de outras páginas | Evidência composta: `tests/unit/replenishment-query.test.ts:27`: consulta sem count `toHaveLength(43)`; `app/pages/purchase-drafts.vue:14`: solicita `/api/replenishment` sem paginação; `tests/unit/replenishment-ui-pages.test.ts:147`: draft/snapshot/itens exatos; linhas138/150/151: seleção indisponível, editor ausente em snapshot antigo e alerta `toContain('Os dados mudaram')`. Fluxo anterior não alterado | PASS |
| AC8 | Explicar SKU1000008429 sem inventar parâmetro ausente | `tests/unit/replenishment-issues.test.ts:10`: `toBe('SKU 1000008429: parâmetros de compra incompletos. Confira fornecedor, embalagem e unidade de compra nos dados de origem.')` | PASS |
| AC9 | Resumir milhares por SKU único e manter orientação no detalhe sem código bruto | `tests/unit/replenishment-issues.test.ts:16`: mensagem exata3000produtos; linha19: `toHaveLength(1)`; linhas33/35: orientação com SKU e `not.toContain('PRODUCT_PURCHASE_PARAMETERS_MISSING')`; duplicata incluída na entrada | PASS |
| AC10 | Traduzir histórico/devolução/desconhecido, preservar natural e domínio | `tests/unit/replenishment-issues.test.ts:24`/25: traduções exatas; linha26: `toBe('Há dados da integração pendentes de validação. As sugestões dependentes continuam indisponíveis.')`; linha27: `toBe('Reservas desconhecidas')`; linhas17/37: arrays originais iguais; linha36: `toBe('Indisponível')` | PASS |
| AC11 | Claro mesmo com SO escuro; contraste>=4,5, secundários>=12px | `tests/integration/usability.spec.ts:120`: `not.toHaveClass(/dark/)`, com preferência localStorage e SO escuros linhas77/78; linhas51/52: `sample.fontSize >=12`, `sample.ratio >=4.5` por `toBeGreaterThanOrEqual`, sobre amostras reais dos textos afetados | PASS |
| AC12 |390px/desktop: campos integrais, controles>=44, grupos/ajuda, sem overflow | `tests/integration/usability.spec.ts:63`:3campos; linhas65/66: largura de cada campo dentro de1px do contêiner; linha124: altura `>=44`; linhas127/128: ações `toBeInViewport({ ratio: 1 })`; linhas130/134: scrollWidth<=innerWidth; `tests/unit/user-editor-usability.test.ts:18`: legends exatas; linhas19–23: ajuda de senha/perfis/status | PASS |
| AC13 | Preservar payload e senha opcional; bloquear todos controles/save/cancel pending | `tests/unit/user-editor.test.ts:28`: payload cadastro exato com login/senha/admin/ativo; linha34: edição exata com login/user/inativo e sem senha vazia; `tests/unit/user-editor-usability.test.ts:30`: required ausente na edição; linha35: todos inputs/select/buttons disabled; linhas37/39: save/cancel `toBeUndefined()` | PASS |

**Resultado:**13/13 critérios completamente comprovados; AC3 fechado na rodada2. Não há lacuna de precisão na spec: o desempate exigido é explícito.

## Gates, integridade e qualidade

- Plano implícito de três tarefas na spec, três commits atômicos presentes. Não há tasks.md, compatível com três passos explícitos.
- Gate obrigatório `npm run check`: log final `/tmp/grand-cru-ux-check-verified.log` inspecionado, lint/tipos/389 unitários em45arquivos e build PASS (33,9s), após F1. Primeira rodada usou `/tmp/grand-cru-ux-check-final.log`,388unitários e build34,1s. Executado pelo autor antes da verificação, não repetido no diretório real para preservar servidor/artefatos ativos.
- `npm run test:integration`: log `/tmp/grand-cru-ux-integration-final.log` inspecionado,20PASS em39,7s; autor atestou Node24/PostgreSQL17/servidor locais com variáveis ERP vazias. Integração nova impõe banco localhost/127.0.0.1 e aborta tráfego externo do navegador; linha135 exige `expect(external).toEqual([])`.
- Baseline364unitários/19integrações; final389/20: +25unitários/+1integração (F1 acrescenta1). `git diff --name-status ... -- tests` contém apenas sete arquivos adicionados. Nenhum teste anterior removido, modificado, enfraquecido ou ignorado.
- Mapeamento reverso: novos query4 cobrem AC2/3/7 e vazio/imutabilidade; rota8 cobrem AC6 e autenticação; UI3 cobrem AC2/4/5; página2 cobrem AC1/3/4/5 e encolhimento do conjunto; issues5 cobrem AC8/9/10 e vazio/singular; UserEditor3 cobrem AC12/13; integração1 cobre AC2/3/4/8/11/12. Nenhum teste sem vínculo de requisito/edge encontrado.
- Diretrizes: AGENTS.md e RFC-005. Consulta extraída em função pura, domínio sem HTTP/banco/UI. Tradução somente apresentação, invariantes e códigos preservados. Mudanças cirúrgicas, sem nova persistência, perfil, fórmula ou contrato ERP.
- Segurança: diff não adiciona transporte ERP, credenciais, tokens, migrations, origem/método arbitrários nem escrita em dados ERP. API local mantém autenticação antes de acessar repositório; `tests/unit/replenishment-pagination-route.test.ts:33`/34 comprovam rejeição e ausência de leitura quando não autenticado. Sensor usa apenas fixtures sintéticas.
- Edge cases cobertos: página além do fim/vazia, filtros fora da página, encolhimento do total, erro preservando dados, duplicata de SKU, código técnico com valor privado sintético, singular/vazio, cadastro/edição e pending.
- Capturas sintéticas revisadas pelo autor e screenshots mobile do formulário/reposição inspecionadas independentemente pelo Verifier: `docs/screenshots/user-form-mobile.png`, `user-form-desktop.png`, `replenishment-pagination-mobile.png`; geometria e contraste também têm asserções de navegador. UAT humano não executado nem alegado; não bloqueia os gates locais autorizados.

## Sensor de discriminação: histórico da primeira rodada

Baseline de cinco arquivos direcionados PASS no scratch antes de qualquer mutação,16testes; Node26 disponível no shell do Verifier. Gates completos acima foram executados pelo autor com Node24. Cada mutação foi revertida antes da seguinte. Logs em `/tmp/grand-cru-ux-sensor-*.log`, índice em `/tmp/grand-cru-ux-sensor-results.json`.

| Mutante | Local real | Falha introduzida | Resultado |
| --- | --- | --- | --- |
| M1 slice | `shared/application/replenishment-query.ts:23` | start+1 descarta primeiro item | Morto: AssertionError |
| M2 global-product-filter | `shared/application/replenishment-query.ts:16` | Ignorar filtro por produto | Morto: AssertionError |
| M3 selection-clear | `app/components/ReplenishmentList.vue:19` | Não limpar seleção ao paginar | Morto: AssertionError |
| M4 private-code | `shared/application/replenishment-issues.ts:14` | Exibir código desconhecido bruto | Morto: AssertionError |
| M5 sku-dedup | `shared/application/replenishment-issues.ts:19` | Contar ocorrências em vez de SKUs únicos | Morto: AssertionError |
| M6 pending-guard | `app/components/UserEditor.vue:10` | Emitir save durante pending | Morto: AssertionError |
| M7 identity-tiebreak | `shared/application/replenishment-query.ts:20` | Remover desempate produto e loja | **Sobreviveu:3/3queryPASS** |

**Resultado:**6/7mortos,1sobreviveu. Nenhum morto por import/setup: os seis logs contêm AssertionError de comportamento. Scratch foi criado com git archive b1c3f8d, node_modules symlink e cópia desreferenciada de .nuxt; somente fontes scratch mutadas. Scratch removido. Porcelain real comparado byte a byte antes/depois e idêntico: edição preexistente de visual-evidence.md e .codex/ não rastreado. Nenhum stash, servidor, banco ou endpoint ERP usado pelo Verifier.

## Histórico da lacuna e correção F1

1. **Major, AC3:** adicionar caso unitário com entrada propositalmente fora de ordem, empate de ruptura, IDs de produto distintos e mesmo SKU em lojas distintas. Comparar sequência completa de produto/loja e recorte de página com valores exatos. Arquivo: `tests/unit/replenishment-query.test.ts`; implementação correta já existe em `shared/application/replenishment-query.ts:20`. Gate: direcionado, `npm run check`; reexecutar mutanteM7 e exigir AssertionError. Nenhum teste anterior deve ser alterado ou enfraquecido.

**Primeira rodada:** relatório FAIL, validate_state rejeitou corretamente o resultado. Lição L-003 registrada como candidate por `lessons.py`, com sinal surviving_mutant e fonte M7. Nenhuma lição adicional criada pela revalidação limpa.

**Correção concluída em8750cca:** cenário fora de ordem com empate de produto/loja e datas distintas, sequência completa e recorte exatos em `tests/unit/replenishment-query.test.ts:41`/42. Diff b1c3f8d..8750cca contém apenas esse teste e duas documentações. Nenhum código runtime ou teste anterior alterado. Portanto as20integrações anteriores continuam aplicáveis; o gate completo posterior valida389unitários e build.

## Sensor de discriminação: revalidação F1

Scratch novo de git archive8750cca com node_modules symlink e cópia desreferenciada de .nuxt. Baseline4querytestsPASS antes de mutar. As três variantes usam a mesma fonte `shared/application/replenishment-query.ts:20`, cada uma restaurada antes da seguinte:

| Mutante | Comportamento incorreto | Resultado |
| --- | --- | --- |
| R2-full | Sem desempate de produto e loja | Morto por AssertionError na asserção exata `tests/unit/replenishment-query.test.ts:41` |
| R2-product | Sem desempate de produto, preservando loja | Morto por AssertionError na mesma asserção |
| R2-store | Sem desempate de loja, preservando produto | Morto por AssertionError na mesma asserção |

Logs: `/tmp/grand-cru-ux-sensor-r2-{baseline,full,product,store}.log`; índice `/tmp/grand-cru-ux-sensor-r2-results.json`. Scratch removido; porcelain real idêntico byte a byte ao baseline dessa rodada, incluindo todos os artefatos existentes. Sem mudanças reais de código/testes, stash, servidor, banco, endpoints ou operações externas.

**Sensor final:** seis falhas de comportamento já discriminadas na primeira rodada; lacuna de desempate eliminada e comprovada por três variantes adicionais.0mutantes sobreviventes pendentes.

**Lacunas ranqueadas atuais:** nenhuma. UX-01, UX-02 e UX-03 verificados. UAT humano e publicação não fazem parte da evidência executada. **validate_state:** PASS, executado após persistir esta revisão.
