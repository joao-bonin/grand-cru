# UX-02 — evidência por tarefa

PASS:21 testes em4 arquivos (5 novos), ESLint direcionado sem erros/avisos. Recomendação e códigos de domínio não foram alterados; testes anteriores preservados.

| Critério | Evidência e asserção | Resultado |
| --- | --- | --- |
| SKU e orientação sem causa inventada | tests/unit/replenishment-issues.test.ts:10 `toBe('SKU 1000008429: parâmetros de compra incompletos. Confira fornecedor, embalagem e unidade de compra nos dados de origem.')` | PASS |
| Resumo por SKU único | mesmo arquivo linha16 compara mensagem exata de3000produtos; linha19 `toHaveLength(1)`; linha21 código ausente | PASS |
| Tradução e fallback | linhas24–28 comparam traduções exatas de histórico/devoluções, fallback seguro, texto natural e deduplicação | PASS |
| Integridade e detalhe | linhas33–37 comparam orientação, ausência do código bruto, `suggested` Indisponível e array original intacto; linha17 array global intacto | PASS |
| Vazio e singular | linhas40–41 verificam seção ausente e mensagem singular exata | PASS |

Mapeamento reverso: cada um dos5 testes de replenishment-issues cobre respectivamente os critérios acima; os testes existentes de explicação/página permanecem cobertos por seus requisitos anteriores. Nenhuma regra de elegibilidade ou valor desconhecido foi alterado. AGENTS.md e RFC-005 seguidos.
