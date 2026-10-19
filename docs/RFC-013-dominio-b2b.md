# RFC-013 — Primeira implementação do domínio B2B

Data: 19/10/2026. O usuário retomou explicitamente a implementação B2B antes adiada e pediu uma frente paralela. Esta entrega inicia US12; não declara concluída a história nem altera as recomendações atuais de vendas totais.

## Fatia implementada

- Classificação de canal por mapa explicitamente fornecido ao domínio. Identificações ausentes ou sem mapeamento permanecem não classificadas. Não se infere B2B por CNPJ, vendedor, nome ou local sem validação.
- Avaliação pura de linhas de compromisso, por SKU, loja e unidade-base, com quantidades comprometidas, atendidas, canceladas, reservadas e incrementais separadas na memória de cálculo.
- O exemplo da história é preservado: compromisso de nove unidades, nenhuma atendida/cancelada e quatro reservadas de forma comprovada gera cinco unidades incrementais. A disponibilidade usada por uma integração futura deverá já excluir essas reservas; não se deve deduzi-las novamente.
- Reservas precisam estar vinculadas à mesma linha de compromisso, produto, loja e unidade. Identidades duplicadas, quantidades contraditórias, atendimento/cancelamento excessivos e reserva superior ao pendente impedem o cálculo.
- Falta de canal, data, quantidades atendidas/canceladas ou evidência das reservas gera situação indeterminada. Lista vazia comprovada é diferente de vínculos desconhecidos.

## Contratos técnicos e decisões pendentes

Os contratos desta fatia aceitam contagens inteiras exatas já normalizadas em unidade-base, dentro da precisão segura, e datas civis explícitas. Valores fracionários/conversões ainda não suportados são recusados. Isso limita o software entregue; não afirma que todo produto do ERP use unidades inteiras nem aprova sua semântica operacional.

As datas são preservadas sem presumir fuso, relógio ou horizonte de planejamento. Não há agregação entre produtos, lojas ou unidades. A integração futura precisa validar classificação real, identidade dos compromissos e reservas, conversões, horizonte temporal e ausência de dupla contagem com as vendas e a disponibilidade.

Fila de não classificados, correções auditáveis, eventos excepcionais, sazonalidade, persistência, interface e incorporação à reposição ainda dependem de refinamento. Nenhuma chamada ao ERP ou alteração em dados reais foi feita nesta fatia.

## Validação

Testes unitários com entradas explícitas verificam classificação, cenário nove menos quatro, atendimento/cancelamento, duplicação, vínculos incompatíveis, datas inválidas, quantidades inválidas e preservação de pendências. A validação conjunta consta em `.specs/features/comprador-virtual/validation.md`.
