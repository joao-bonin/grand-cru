# UX-03 — evidência por tarefa

PASS local: `npm run check` com388 testes unitários, lint, tipos e build Node24; `npm run test:integration` com20/20PASS em39,7s. Testes ERP somente mocks, todas as variáveis ERP vazias, PostgreSQL e servidor locais. Capturas sintéticas desktop/mobile revisadas visualmente. Sem alteração de testes anteriores.

| Critério | Evidência e asserção | Resultado |
| --- | --- | --- |
| Tema claro com preferência escura, contraste e tamanho | tests/integration/usability.spec.ts:120 HTML sem dark; setup semeia preferência antiga e emula SO escuro; linhas51–52 exigem fontSize>=12 e ratio>=4.5 nas cores computadas de textos da reposição, diretório, métricas e formulário | PASS |
| Grupos e ajuda | tests/unit/user-editor-usability.test.ts:18 compara legends exatas; linhas19–23 senha, perfil user/admin e inativação | PASS |
| Campos amplos e ações por toque | tests/integration/usability.spec.ts:58 formulário sem overflow; linhas63–66 três campos em largura integral; linha124 altura>=44; linhas127–128 ambas ações integralmente no viewport mobile; linhas130/134 sem overflow em390/1440px | PASS |
| Cadastro/edição sem mudança de regras | tests/unit/user-editor-usability.test.ts:27–31 preserva limites e senha opcional; tests/unit/user-editor.test.ts:28/34 compara payloads com senha no cadastro e sem senha vazia na edição | PASS |
| Bloqueio pending | tests/unit/user-editor-usability.test.ts:35 campos/buttons disabled, linhas37/39 save/cancel ausentes; o guard previne submissão duplicada | PASS |
| Paginação real e pendências | tests/integration/usability.spec.ts:87–107 verifica20/20/3 itens, query count20, total43, seleção limpa, filtro do SKU29 retornando página1, aviso humano e item indisponível | PASS |
| Restrição externa | tests/integration/usability.spec.ts:135 `expect(external).toEqual([])`; servidor local com ERP desabilitado | PASS |

Mapeamento reverso: os3 novos unitários UserEditor correspondem a grupos/ajuda, regras existentes e pending. O novo teste de integração corresponde aos critérios de UX-01/02/03 acima; inspeção visual complementa geometria/contraste, não substitui asserções. Diretrizes AGENTS.md/RFC-005 e skill seguidas. Nenhuma asserção anterior enfraquecida, teste apagado ou ignorado.

Correções encontradas pelos gates: imports relativos de shared em Vue substituídos pelo alias #shared já usado no projeto; controles nominalmente44px mediam43,99px durante animação, então o layout foi ampliado para48px. A asserção44px não foi reduzida. A revisão visual final alinhou a cor primária ao vinho e mostrou Salvar/Cancelar lado a lado no celular.

Capturas: docs/screenshots/replenishment-pagination-mobile.png, user-form-mobile.png e user-form-desktop.png. Somente dados sintéticos. Revisão independente e sensor são o próximo gate; esta evidência ainda não afirma publicação nem UAT humano.

Encerramento: F1 elevou a bateria para389 unitários sem mudar runtime; revisão independente PASS13/13 e sensor sem lacunas pendentes. Publicação dpl_CEBC97oT88rDCQL1E1Df1ZDZs6aL READY confirmada no alias principal. HTTP200/401 e tokens visuais no CSS público conferidos; sem validação de sessão autenticada de produção ou UAT humano. Ver RFC-012.
