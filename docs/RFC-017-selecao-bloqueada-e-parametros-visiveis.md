# RFC-017 — Motivos da seleção bloqueada e parâmetros visíveis

## Solicitação confirmada

O usuário pediu informar por que o controle “Incluir na rodada local” está desabilitado e relatou que “Parâmetros de compra” não funciona no segundo produto da lista de Reposição. A orientação de concluir com testes, commit, merge e publicação continua vigente. A validação real do ERP permanece adiada.

## Motivos da seleção

Cada controle bloqueado tem uma explicação visível, associada por `aria-describedby`, e a ajuda “Por que não posso selecionar?”, acessível por toque e teclado. A ajuda apresenta todas as pendências em português, reaproveitando o apresentador da RFC-016.

As orientações distinguem parâmetros configurados localmente de dados não confirmados do ERP: cadastro de compra, fornecedor, estoque, reservas/bloqueios, período de vendas e devoluções. Informar parâmetros locais não comprova dados externos. A sugestão e os bloqueios da API não são modificados nem ignorados.

A elegibilidade da interface exige política presente, sugestão numérica não negativa e ausência de pendências, em alinhamento com a preparação de rodadas. Uma sugestão calculada igual a zero permanece selecionável. A lista também remove seleções que perderam validade ou permissão e filtra emissões inválidas.

## Abertura dos parâmetros

A reprodução em desktop e celular confirmou que o botão emitia a ação e montava o formulário. Como o editor era inserido acima da lista, a ancoragem da rolagem mantinha o produto na tela e deixava o formulário fora da área visível, sem foco. Verificar somente a existência ou `toBeVisible` não detecta esse defeito.

A edição passa a abrir em uma janela modal identificada pelo produto e loja, com foco no formulário, rolagem interna, cancelar/fechar e retorno ao botão de origem. O fechamento é bloqueado durante o salvamento. A seleção de outro produto monta os campos correspondentes, preservando o isolamento entre identidades e o controle de versão. Erros deixam os ajustes visíveis para revisão e nova tentativa.

## Critérios de validação

Os testes verificam motivo associado ao controle, todos os bloqueios, sugestão zero, dados inválidos e remoção de seleção obsoleta. O navegador deve abrir os parâmetros do segundo produto após rolar a lista, verificar que o editor está **no viewport** e com foco, cancelar/voltar, trocar produto, salvar, tratar erro e conferir permissões. O modal deve permanecer utilizável em celular e nos temas claro/escuro.

Usuários e dados são sintéticos, com PostgreSQL local quando necessário; não há autenticação, sincronização ou escrita no ERP. Verificações completas e publicação são registradas na entrega. A reprodução local não equivale à inspeção da sessão autenticada de produção.
