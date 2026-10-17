# UX-01 — evidências por tarefa

PASS:32 testes em6 arquivos, incluindo os testes existentes de lista/páginas. ESLint direcionado sem erros/avisos; teste de página repetido após ajuste de importação de tipo,2/2PASS. Nenhum teste anterior alterado.

| Critério | Evidência e asserção | Resultado |
| --- | --- | --- |
| Início e navegação20 | tests/unit/replenishment-pagination-page.test.ts:29 `expect(requestQuery.value).toMatchObject({ start: 0, count: 20 })`; linha34 start20; tests/unit/replenishment-pagination-ui.test.ts:10 `toHaveLength(20)` | PASS |
| Filtros globais e ordenação | tests/unit/replenishment-query.test.ts:11 primeiro sku-40; linha19 `toEqual(['sku-42'])`; linha21 fornecedores f1/f2 | PASS |
| Limites e seleção | tests/unit/replenishment-pagination-ui.test.ts:19 seleção vazia; linhas21–24 última página/retorno; linha31 limpa filtros | PASS |
| Carga e erro | tests/unit/replenishment-pagination-ui.test.ts:36–37 disabled; tests/unit/replenishment-ui-pages.test.ts mantém items anteriores no erro; página nova linha46 revisão disabled | PASS |
| API e autenticação | tests/unit/replenishment-pagination-route.test.ts:23–24 itens/metadados; linhas28–29 rejeita400 antes do repositório; linhas33–34 não autorizado; linha38 vazio/total | PASS |
| Rodadas completas | tests/unit/replenishment-query.test.ts:27 `toHaveLength(43)`; testes existentes de preparação de rodada e snapshot permaneceram PASS; contrato sem count preservado | PASS |

Mapeamento reverso: os três testes de replenishment-query cobrem filtros/ordenação/recorte/consulta completa; os oito casos de pagination-route cobrem payload, autenticação e limites da rota; os três testes pagination-ui cobrem navegação/seleção/filtros/carga; os dois de pagination-page cobrem query local e recuperação de página reduzida. Todos se limitam aos sete critérios de UX-01. Diretrizes: AGENTS.md e RFC-005; sem novos testes de bibliotecas. Integração completa e revisão independente serão executadas após a tarefa visual.

## F1 — lacuna de discriminação corrigida

A revisão independente comprovou que remover o desempate por produto/loja sobrevivia aos testes iniciais. Foi acrescentado um caso com entrada fora de ordem, produtos com a mesma data de ruptura e duas lojas para o mesmo produto. `tests/unit/replenishment-query.test.ts:41` exige sequência completa `x/s1,z/s1,k/s1,a/s1,a/s2,b/s2`; linha42 exige o recorte3/2 `a/s1,a/s2`. O teste deriva do AC3 original, sem alterar implementação nem asserções anteriores. Novo gate `npm run check`:389 unitários, lint, tipos e build PASS. As20 integrações anteriores permanecem válidas porque não houve alteração da fonte runtime. Revalidação independente aprovada: mutante completo e cada parte produto/loja mortos por asserção; nenhum sobrevivente pendente.
