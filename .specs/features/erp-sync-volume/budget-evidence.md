# Evidência do orçamento da carga — tarefa 1

Validado em 17/10/2026 com Node 24 e somente clientes ERP simulados.

- Orçamento global constante de 180.000 ms, verificado antes e depois de cada GET; igualdade com o limite também rejeita a carga.
- Volume sintético: 3.077 produtos, 55 fornecedores e 18.612 saldos; cupons, devoluções e compras vazios. Cada GET acrescenta 300 ms ao relógio injetado.
- Resultado: todos os produtos, fornecedores e saldos retornados em 222 consultas / 66.600 ms. O teste compara os identificadores de todos os produtos e locais, além de todos os saldos físicos.
- Fronteiras: nenhuma consulta começa em 180.000 ms; última resposta em 179.999 ms aceita; resposta em 180.000/180.001 ms rejeitada sem consultar a próxima fonte; resposta tardia da última fonte também rejeitada.
- Teste anterior de interrupção preservado, ajustando somente o relógio de 50.001 para 180.001 ms conforme o requisito confirmado.
- `nitro.vercel.functions.maxDuration = 300` usa a opção suportada no Nitro instalado (`node_modules/nitropack/dist/presets/vercel/types.d.ts`, campos `functions` e `maxDuration`).
- Timeout individual de 15 segundos, paginação, mapeadores e contratos de consultas não foram alterados.

Comandos executados com `PATH=/tmp/grand-cru-node24/node_modules/node-linux-x64/bin:$PATH`:

```sh
npx vitest run tests/unit/erp-synchronization.test.ts tests/unit/erp-sync-volume.test.ts
npx eslint server/application/erp/synchronize.ts nuxt.config.ts tests/unit/erp-synchronization.test.ts tests/unit/erp-sync-volume.test.ts
```

Resultado: 2 arquivos / 9 testes aprovados; ESLint aprovado. O coordenador executará `npm run check`, integração local e os gates restantes após consolidar o diagnóstico seguro das fontes. Nenhuma consulta real ao ERP foi executada nesta tarefa.
