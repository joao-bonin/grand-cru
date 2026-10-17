# Contratos de leitura do ERP

Data: 16/10/2026. Resultado: contrato público mapeado; validação operacional completa pendente. Nenhuma chamada de rede, login ou leitura de segredo foi feita para implementar os adaptadores. Todos os testes usam fixtures sintéticas e transporte simulado.

## Evidência por fonte

A fonte desta análise é o Swagger público obtido pelo coordenador e preservado temporariamente em `/tmp/grand-cru-swagger.yaml`. O arquivo não contém amostras autenticadas. A RFC-011 registra a validação anterior de cupons: HTTP 200 com accessToken diretamente em Authorization, total informado de 1049 naquela consulta. Este trabalho não repetiu a consulta; esse número não comprova histórico completo.

| Fonte GET relativa a /api | Campos documentados usados | Validação autenticada / HTTP | Limites |
| --- | --- | --- | --- |
| /v1/produto/produtos | id, descricao, fornecedorId, unidadeDeCompra, itensEmbalagem, custoMedio, estoqueDoProduto[lojaId,estoqueMinimo] | Pendente, nenhum status obtido nesta execução | Unidade-base, kits e custo médio versus preço efetivo de compra exigem conciliação |
| /v1/pessoa/fornecedores | id, nome, prazoDeEntrega | Pendente | Prazo cadastrado não comprova prazo operacional |
| /v1/estoque/saldos | lojaId, produtoId, localId, saldo, atualizadoEm | Pendente | Saldo não comprova disponibilidade; reserva e bloqueio permanecem null e disjunção false; locais nunca são somados aqui |
| /v1/venda/cupons-fiscais | id, lojaId, dataVenda, cancelada, itensVenda[id,produtoId,quantidadeVenda,tipo] | HTTP 200 somente na validação anterior registrada na RFC-011 | tipo 1 vendido / 2 cancelado; abrangência temporal permanece desconhecida |
| /v1/venda/notas-fiscais | Não ingerido nesta etapa | Pendente | Somar notas aos cupons duplica vendas vinculadas; ingestão exclusiva de cupons não comprova cobertura NFe |
| /v1/pdv/trocas-devolucoes | Troca.itensTroca[produtoId,quantidade], status, campos de origem | Pendente | Identidade/vínculo com item de cupom, loja e estado efetivo não reconciliados; não subtrair por aproximação de produto/data |
| /v1/compra/pedidos | PedidoCompra.lojaId, id, status, dataDeEntrega; itens[quantidade,itensNaUnidade,quantidadeAtendida,quantidadeCancelado,previsaoEntrega,status] | Pendente | quantidade é embalagens; quantidadeCompleta é unidades; unidades de atendida/cancelado e status elegíveis não comprovados |

## Política implementada

O transporte tem origem HTTPS fixa, somente GET e allowlist explícita de recursos de consulta. O token existente é enviado sem Bearer. Logout, refresh, autenticação e operações de compra são inacessíveis. Não existe interface genérica de método HTTP, body ou headers controlados pelo chamador. Redirecionamentos são rejeitados pelo fetch. Falhas HTTP/JSON/transporte retornam códigos sanitizados; corpos e segredos não são logados. Respostas são limitadas a 5 MiB durante a leitura do stream, sem depender apenas de Content-Length. Inteiros JSON além da precisão segura são preservados como strings a partir do texto original (Node 24); notação exponencial insegura é rejeitada, sem arredondar identidades.

Atualização de17/10/2026: as restrições acima continuam válidas no cliente de consultas. Após exceção expressa do usuário, um cliente separado pode obter/renovar a sessão exclusivamente em POST `/api/auth` e GET `/api/auth/refresh`. O wrapper repete somente uma consulta GET permitida após401. Logout e escrita de negócio continuam inacessíveis. Sessão cifrada no PostgreSQL do aplicativo; testes apenas com mocks e banco local. A validação operacional do refresh continua pendente e não é comprovada pelos testes sintéticos. Ver RFC-011 e `.specs/features/erp-session/`.

Paginação exige start/count/total/items consistentes, total estável e avanço. Página repetida, vazia antes do total ou falha posterior rejeita toda a carga. Limites defensivos de 10000 páginas, 100 itens por página e 1000000 itens informados impedem carga ilimitada; start exige inteiro seguro não negativo e count exige inteiro entre 1 e 100 antes do transporte. Esses limites são locais, não limites oficiais confirmados. Paginação por offset não garante snapshot estável no ERP mutável; reconciliação operacional continua pendente.

Produtos homônimos mantêm identidade própria. ID numérico não seguro é recusado. Ausência de fornecedor/conversão gera pendência. Compras ABERTO com itens ADICIONADO e quantidadeAtendida/quantidadeCancelado explicitamente zero usam quantidade × itensNaUnidade, validando quantidadeCompleta quando presente. Estados terminais CANCELADO/ATENDIDO/ENCERRADO/RECUSADO são excluídos. Compras parciais ou com estado/unidade desconhecido são rejeitadas com `ERP_PURCHASE_UNITS_UNCONFIRMED`, preservando a versão publicada, até comprovar unidade de recebimentos/cancelamentos. Nunca se retorna vazio para representar fonte indisponível.

Cupons repetidos com identidade e conteúdo iguais não duplicam vendas; conflito do mesmo item rejeita a carga. Somente cupons são contabilizados, sem somar notas ou pedidos. Devoluções não são ignoradas silenciosamente: `RETURNS_RECONCILIATION_UNCONFIRMED` acompanha o conjunto, que não deve ser apresentado como vendas líquidas confiáveis. `historyFrom` permanece null mesmo com cupons antigos, pois o mais antigo observado não comprova cobertura contínua.

## Pendências de G1

- Reconciliar ao menos um produto com embalagem, fornecedor, custo e loja.
- Definir locais participantes e obter semântica comprovada de reservas e bloqueios.
- Reconciliar cancelamento e devolução com o item original, sem dados pessoais persistidos.
- Confirmar cobertura de cupons versus NFe e intervalo de histórico completo.
- Reconciliar pedido parcialmente recebido, unidades de quantidades atendidas/canceladas e status elegíveis.
- Confirmar filtros, ordenação e estabilidade da paginação, limites e fuso.

T1 permanece parcial: contrato documentado não equivale a validação operacional. T5 permanece parcial na reconciliação de devoluções; T7 permanece parcial: subconjunto aberto sem recebimentos é mapeado; atendimento parcial e estados desconhecidos ficam bloqueados. Não há autorização para testar qualquer escrita no ERP.
