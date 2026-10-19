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

## Reavaliação do acesso e dos critérios — 19/10/2026

O usuário solicitou nova validação das fontes reais e autorizou especificamente obter um token pelo fluxo de autenticação documentado. Essa exceção permite apenas a obtenção de token necessária a esta validação; não autoriza alterar registros de negócio, enviar pedidos, renovar ou encerrar sessões, nem acrescentar autenticação ao cliente de produção. Nenhum login foi executado nesta reavaliação, pois o ambiente atual não apresenta a configuração necessária.

### Evidências do ambiente atual

- `environment_status` retornou observações atuais, ambiente em execução e listas vazias de secrets, runtime variables e outbound identities. Isso não comprova credenciais disponíveis em outro ambiente nem permite reutilizar o token mantido somente em memória na validação de 16/10.
- A carga normal `node --env-file-if-exists=.env` informou `.env` ausente; as verificações booleanas de `ERP_ACCESS_TOKEN` e `ERP_STORE_ID` retornaram `false`. Não há nomes de variáveis de configuração com prefixos `ERP_`, `VAREJO_` ou `VAREJOFACIL_` no processo. Não foram lidos arquivos de segredo nem impressos valores de credenciais.
- O cliente mantém a origem fixa documentada `https://fgcuritibabatel.varejofacil.com/api`. A política de rede consultada lista apenas `mercado.varejofacil.com` como destino customizado permitido. O estado de aplicação da política em `environment_status` é `unknown`; portanto, não se declara conectividade nem autenticação confirmada para a origem da loja. Não houve tentativa de contornar o proxy, trocar a origem do cliente ou encaminhar credenciais ao host público.
- A única consulta de rede desta reavaliação foi um GET sem autenticação ao Swagger público em `https://mercado.varejofacil.com/doc/swagger2/swagger.yaml`, sem seguir redirecionamentos. A resposta foi HTTP 503; não foi obtido contrato novo utilizável. Esse resultado não determina a disponibilidade da API da loja nem valida qualquer dado de negócio.

**Resultado:** nenhuma nova amostra real de produto, estoque, venda, devolução ou compra foi obtida. A evidência autenticada anterior de cupons continua sendo histórica, não prova acesso operacional atual. Não houve login, refresh, logout, escrita comercial ou acesso ao banco de produção.

### Matriz de comprovação necessária

Os recursos abaixo já constam do contrato analisado na RFC-011. As consultas deverão usar somente GET comprovadamente de leitura na origem fixa, com token configurado, sem redirecionamentos e com paginação delimitada. A matriz especifica a evidência necessária; não registra consultas executadas nesta data.

| Área | Fonte documentada relativa a /api | Evidência mínima para liberar a regra | Efeito enquanto não comprovado |
| --- | --- | --- | --- |
| Estoque e locais | `/v1/estoque/saldos`, `/v1/estoque/locais` | Conciliar um SKU por loja/local com o saldo de referência e definir quais locais participam da disponibilidade. Comprovar se `saldo` é físico ou disponível e se reservas/bloqueios estão incluídos; se forem parcelas separadas, comprovar sua origem e se são disjuntas. | `reserved` e `blocked` continuam `null`; locais não são somados por suposição e saldo físico não é apresentado como disponibilidade confirmada. |
| Cancelamentos e devoluções | `/v1/venda/cupons-fiscais`, `/v1/pdv/trocas-devolucoes`, `/v1/venda/notas-fiscais` | Conciliar uma venda, item cancelado, documento cancelado e devolução efetiva, identificando loja, unidade e vínculo estável com o item original. Confirmar estados válidos e evitar descontar duas vezes a mesma ocorrência. | O mapper sinaliza reconciliação pendente; não subtrai devolução por proximidade de produto/data nem anuncia demanda líquida definitiva. |
| Cupons, notas e histórico | `/v1/venda/cupons-fiscais`, `/v1/venda/notas-fiscais` | Conciliar um cupom vinculado à nota e uma nota sem cupom, caso exista, definindo a fonte de cada venda. Comprovar intervalo completo de pelo menos 365 dias exigidos pelo PRD, retenção, filtros, fuso e paginação; documento mais antigo ou contagem isolada não comprovam continuidade. | Apenas cupons são ingeridos; `historyFrom` permanece `null` e a cobertura permanece pendente. Ausência de notas ou de vendas em um período não é inferida de uma amostra vazia. |
| Compras parcialmente recebidas | `/v1/compra/pedidos` e consulta individual documentada na RFC-011 | Conciliar um item parcialmente recebido e, quando disponível, cancelado: embalagens pedidas × itens por embalagem, unidades de `quantidadeAtendida`/`quantidadeCancelado`, saldo ainda esperado, datas e estados de cabeçalho/item. | Permanece suportado apenas o subconjunto aberto sem atendimento/cancelamento; parcial ou estado desconhecido rejeita a carga e preserva o snapshot publicado. |
| Cadastro, embalagem e custo | `/v1/produto/produtos`, `/v1/produto/unidades`, `/v1/produto/produtos/{produtoId}/fornecedores`, `/v1/pessoa/fornecedores`, `/v1/produto/custos` | Conciliar um SKU com unidade-base, unidade de compra, fator de conversão, fornecedor, mínimos por loja e custo. Confirmar se `itensEmbalagem` corresponde à embalagem de compra e se `custoMedio` é adequado à estimativa; não equiparar automaticamente custo médio, preço de compra e preço de venda. | Dados ausentes continuam pendentes. Prazo cadastrado não é prazo operacional comprovado; kits e compostos exigem regra própria. |

A separação B2B continua adiada por decisão do usuário e não faz parte desta validação. A existência de um campo no contrato público não comprova seu preenchimento ou sua semântica na conta da loja.

### Configuração existente na Vercel e adiamento

O coordenador confirmou por consulta apenas aos metadados das variáveis do projeto Grand Cru na Vercel, sem descriptografar valores, que os nomes `ERP_USERNAME`, `ERP_PASSWORD` e `ERP_STORE_ID` já existem em produção como variáveis sensíveis. As credenciais existem nessa plataforma; a ausência observada neste executor não significa ausência global de configuração. Nenhum valor dessas variáveis foi lido, copiado ou registrado nesta frente.

Posteriormente, o usuário optou expressamente por adiar a validação real do ERP. A proposta de script operacional foi interrompida antes da criação de qualquer arquivo novo. Não houve obtenção de token, login, consulta autenticada ou nova chamada de rede após essa decisão. A autorização pontual anterior não está sendo usada para prosseguir contra o adiamento.

### Ação mínima quando a validação for retomada

Na retomada solicitada pelo usuário, usar um ambiente seguro que receba as credenciais já existentes na Vercel e tenha acesso à origem documentada da loja, ou vincular essas credenciais pelo mecanismo seguro de configuração do executor. Não é necessário concluir que faltam credenciais na plataforma nem solicitar seus valores na conversa. Nenhum segredo deve ser versionado. A eventual liberação da origem deve ocorrer pelo fluxo suportado de configuração de rede; trocar o cliente para o host público não resolve essa dependência. Conferir novamente a prontidão antes de executar as consultas delimitadas da matriz, registrando somente status, presença/semântica dos campos e conclusões sanitizadas.

Somente a documentação foi alterada nesta frente; não foram executados `npm run check` ou testes de integração, pois não houve alteração de código. O veredito global e os estados das tarefas continuam sob responsabilidade do coordenador e não foram promovidos a concluídos por esta análise.
