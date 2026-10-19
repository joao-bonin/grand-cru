# RFC-011 — Análise da API Varejo Fácil para integração

- **Data:** 16/10/2026.
- **Status:** contrato público analisado; integração e validação autenticada ainda não realizadas.
- **Confirmado pelo usuário:** esta API será a base da integração do Grand Cru.
- **Fontes:** [documentação](https://fgcuritibabatel.varejofacil.com/api/v1/docs), [Swagger YAML](https://fgcuritibabatel.varejofacil.com/doc/swagger2/swagger.yaml), [legenda FIQL](https://fgcuritibabatel.varejofacil.com/api/v1/docs/legenda).
- **Relacionadas:** RFC-001, RFC-005, RFC-008 e RFC-010.

## Conclusão

### Restrição confirmada pelo usuário — ERP somente leitura

O usuário proibiu expressamente qualquer escrita no ERP. A validação utilizará somente o token existente e consultas comprovadamente sem alteração, sem login, refresh, logout, criação de pedidos ou testes de escrita, inclusive em homologação. As propostas de testes de criação e demais operações de escrita descritas abaixo não estão autorizadas e ficam suspensas. Uma futura mudança exige autorização explícita do usuário. A mesma restrição consta no AGENTS.md.

O contrato oferece os recursos centrais para estoque, histórico de vendas, fornecedores, financeiro e criação de pedidos de compra. É uma base adequada para desenvolver o comprador virtual, condicionada à validação de permissões, dados disponíveis e regras operacionais. A existência dos endpoints não comprova habilitação na conta nem qualidade/completude dos dados.

O próprio Varejo Fácil é um possível destino dos pedidos de compra. Ainda é necessário confirmar que este é o sistema destinatário desejado e como pedidos criados pela API seguem para aprovação e fornecedor. Criar um pedido não comprova envio ao fornecedor.

## Contrato e endereço

Swagger 2.0, versão informativa 1.0.0, última atualização declarada em 26/05/2026. O YAML contém 334 caminhos e 576 operações HTTP. HTTPS; basePath `/api`; JSON e XML documentados. Proposta: usar JSON.

Base do ambiente: `https://fgcuritibabatel.varejofacil.com/api`. O login fica em `/auth`, sem `/v1`; recursos de negócio usam `/v1/...`. Não montar `/api/v1/auth`.

## Autenticação

- `POST /auth`: corpo `Usuario`, com `username` e `password` obrigatórios.
- `GET /auth/refresh`: header `Authorization` com refreshToken.
- `GET /auth/logout`: inativa tokens; header `Authorization` com access token, grafado `acessToken` na descrição.
- `GET /v1/myself`: identificação do usuário autenticado.

Lacunas: a resposta 200 do login não tem schema; o YAML não declara `securityDefinitions` nem `security` global. Não confirma prefixo Bearer, formato completo da resposta, validade, rotação ou comportamento concorrente da renovação. Essas informações precisam de documentação complementar ou teste autenticado autorizado. Ausência de security no Swagger não significa API pública.

Recomendação: conta dedicada à integração com permissões mínimas; credenciais e tokens exclusivamente no servidor, separados do JWT do Grand Cru. Nunca registrar senhas/tokens em logs ou persistir no frontend.

## Mapeamento para os requisitos

Todos os caminhos abaixo são relativos a `/api`.

| Necessidade | Recursos documentados | Observações |
| --- | --- | --- |
| Cadastro de SKU | `GET /v1/produto/produtos`, `/v1/produto/codigos-auxiliares`, `/v1/produto/unidades` | Produto tem `id`, `codigoInterno`, unidades, embalagens, composição e `dataAlteracao`. |
| Estoque atual | `GET /v1/estoque/saldos`, `/v1/estoque/locais` | ResumoDeEstoque tem `lojaId`, `produtoId`, `localId`, `saldo`, `atualizadoEm`. Não somar locais sem definir quais participam da disponibilidade. |
| Mínimo/máximo | `Produto.estoqueDoProduto[]` | Campos `lojaId`, `estoqueMinimo`, `estoqueMaximo`. Conferir preenchimento por loja. |
| Prazo e segurança | `GET /v1/pessoa/fornecedores`; cadastro de produto | `Fornecedor.prazoDeEntrega` e `Produto.diasDeSeguranca`. Não equivalem automaticamente à regra aprovada de reposição por SKU. |
| Histórico de vendas | `GET /v1/venda/cupons-fiscais`, `/v1/venda/notas-fiscais` | Cupons contêm itens, produto, quantidade, loja, cliente, vínculos com pedido/nota e cancelamento. |
| Pedidos de venda | `GET /v1/venda/pedidos` | Cliente, loja, vendedor, datas, itens, status e tipo de faturamento. Pedido aberto não é venda realizada. |
| Cancelamentos/devoluções | Cupons; `GET /v1/pdv/trocas-devolucoes`; notas | Exigem reconciliação para obter demanda líquida. |
| Fornecedores por SKU | `GET /v1/produto/produtos/{produtoId}/fornecedores` | Referência inclui fornecedor, unidade, quantidade e nível principal/secundário. |
| Preços e custos | `GET /v1/produto/precos`, `/v1/produto/custos`, `/v1/tabelas-fornecedores` | Preço de venda não deve ser usado como preço de compra. |
| Compras em andamento | `GET /v1/compra/pedidos`, `/v1/compra/pedidos/{id}` | Status e quantidades atendidas/canceladas ajudam a identificar reposição pendente; cálculo precisa validação. |
| Criar compra | `POST /v1/compra/pedidos` | Recurso confirmado no contrato; não foi executado. |
| Contas a pagar/receber | `GET /v1/financeiro/contas-pagar`, `/v1/financeiro/contas-receber` | Ler títulos, vencimentos, liquidações, valores e status; não usar apenas total da conta. |
| Contas e movimentos | `GET /v1/financeiro/contas-correntes`, `/v1/lancamentos-conta-corrente` | ContaCorrente não expõe saldo atual no schema; movimentos têm `saldoInicial`, data, valor, tipo e conciliação. Conferir saldo-base e cobertura histórica. |
| Lojas e clientes | `GET /v1/pessoa/lojas`, `/v1/pessoa/clientes` | IDs permitem relacionamentos; não comprovam classificação B2B. |

## Cuidados para demanda e comprador virtual

1. **Loja x B2B:** não foi identificado campo explícito de canal nesses contratos de venda. Há cliente, loja, vendedor e `ItemVenda.localVendaId`, além de `/v1/venda/locais`. São candidatos a mapeamento, sem regra confirmada. CNPJ não basta para classificar B2B.
2. **Eventos:** `/v1/venda/pedidos/{pedidoId}/eventos` registra data, usuário e mudanças de status. Não representa festas, cestas ou ações corporativas. Essa dimensão exige outra origem ou classificação própria.
3. **Vendas líquidas:** CupomFiscal possui `cancelada`; ItemVenda.tipo descreve 1 como vendido e 2 como cancelado. A consulta aceita `exibeCupomCancelamento`. Validar representação para não descontar duas vezes cancelamentos e devoluções.
4. **Deduplicação:** cupom pode ter `notaFiscalId` e `pedidoVendaId`; não somar pedido, cupom e nota como vendas independentes. A regra para documentos sem vínculo precisa ser comprovada com amostras.
5. **Embalagens:** normalizar demanda e estoque para unidade-base antes de calcular reposição; converter novamente para embalagem de compra ao preparar pedido. Kits e compostos exigem regra específica.
6. **Histórico:** obter pelo menos os 365 dias exigidos, se disponíveis; sazonalidade pode exigir mais de um ciclo. Data inicial disponível e períodos de ruptura ainda não foram verificados.
7. **Estoque disponível:** saldo documentado não comprova desconto de reservas, disponibilidade comercial ou estoque histórico. Não inferir essas semânticas.

## Contrato de criação do pedido de compra

`POST /v1/compra/pedidos` exige no schema PedidoCompra:

- `lojaId`, `fornecedorId`, `funcionarioCompradorId`, `operacaoId`;
- `dataDeEmissao`, `condicaoDePagamento`, `valorTotal`.

Cada ItemPedidoCompra exige `produtoId`, `unidadeDeMedida`, `itensNaUnidade`, `valorDaEmbalagem`, `quantidade`, `valorTotal`. **`quantidade` significa quantidade de embalagens.** `quantidadeCompleta` é somente leitura e representa itens por embalagem × embalagens. O cabeçalho não marca `itens` como obrigatório; isso não prova que um pedido vazio seja válido operacionalmente.

Há `idExterno` descrito como identificador externo único, limitado a 36 caracteres. É candidato para correlação com UUID local, mas não comprova idempotência de POST ou filtro por esse campo. A resposta 201 documenta header `Location`, sem schema de corpo. Também há 409 e 422 com schemas de conflito/validação.

Proposta: revisão e confirmação explícitas, agrupamento por loja/fornecedor e condições compatíveis, registro durável do envio e do identificador externo, conciliação após timeout antes de qualquer reenvio. Não repetir POST automaticamente só porque a resposta se perdeu. Validar transições de status e diferenças entre pedidos `NAO_GERENCIADO` e `GERENCIADO_MAESTRO`.

## Consulta, paginação e sincronização

Listagens relevantes documentam `q` (FIQL), `sort`, `start` (posição inicial) e `count` (quantidade). Respostas ResultList têm `start`, `count`, `total`, `items`. `count=100` é exemplo, não limite confirmado.

A legenda oficial define AND `;`, OR `,`, parênteses e operadores `==`, `!=`, `=lt=`, `=le=`, `=gt=`, `=ge=`, `=in=`, `=bt=`. Ordenação aceita campos separados por vírgula; prefixo `-` indica descendente. Exemplo oficial: `sort=-id,descricao`. Campos filtráveis, combinações e formatos de data devem ser testados por recurso, sem presumir que toda propriedade do schema aceita filtro.

Proposta para o monolito Nuxt/PostgreSQL:

- Adaptador Varejo Fácil no servidor, com contratos injetáveis conforme RFC-005; domínio de reposição independente dos DTOs do ERP.
- Carga inicial paginada de cadastros, estoque e histórico; consultas do dashboard sobre o banco local.
- Upserts por ambiente/origem e ID do ERP; identidade de estoque por loja/produto/local e a identidade efetiva do registro.
- Sincronização agendada e manual utilizando o mesmo caso de uso, com bloqueio de sobreposição e progresso persistido.
- Incrementais por campos de alteração apenas onde filtro/semântica forem comprovados; janela sobreposta e reconciliação periódica para alterações tardias, cancelamentos e exclusões.
- Checkpoint por recurso, última execução bem-sucedida e data de referência expostos; falha parcial não deve apresentar sincronização completa.
- Ordenação estável e reconciliação: paginação por offset em coleção mutável pode saltar ou repetir registros.
- Timeouts, concorrência limitada e retentativas com backoff para leituras transitórias; respeitar Retry-After se houver. Limites e tratamento de 429 não estão especificados no contrato analisado.
- Preservar precisão decimal e validar IDs int64 antes de usar number JavaScript; datas e fuso devem ter contrato explícito.

## Lacunas e validação necessária

Não foram encontrados contratos explícitos de webhooks, importação OFX, integração Agendor ou cálculo pronto de cobertura/giro/recomendação. Isso não comprova ausência de recursos fora desta documentação. Agendor e OFX continuam dependências próprias; não considerar o saldo do ERP automaticamente conciliado com o banco.

Antes da implementação, validar em ambiente de homologação ou com leituras autorizadas:

1. Conta de integração, permissões/licença, resposta de login, header de autorização, expiração e refresh.
2. Loja/locais válidos, volume por recurso, tamanho máximo de página, filtros, datas/fuso, limites e retenção histórica.
3. Amostra de SKU com embalagem, mínimo/máximo, fornecedor/prazo e saldo reconciliado com o ERP.
4. Venda da loja, B2B, cancelamento, devolução e nota vinculada para fechar classificação e deduplicação.
5. Pedido parcialmente recebido para validar reposição pendente.
6. Pedido de compra apenas em homologação: campos efetivamente exigidos, totais, status, idExterno, Location e recuperação após resposta perdida; confirmar se criar gera financeiro ou aciona fornecedor.
7. Títulos parcialmente liquidados/renegociados e movimentos para validar saldo e projeções sem duplicação.

## Evidência e limites desta etapa

Documentação e YAML públicos foram acessados e a legenda FIQL foi lida. Não foram utilizadas credenciais nem executadas operações autenticadas, emissão de pedidos ou alterações no ERP. Esta etapa altera somente documentação; `npm run check` não foi executado, pois não houve alteração de código. Não há comprovação operacional da integração ainda.

## Teste autenticado somente leitura — 16/10/2026

Foi consultado exclusivamente `GET /api/v1/myself`, usando o token configurado localmente, sem expor seu conteúdo. O ERP retornou HTTP 401 tanto com `Authorization: Bearer <token>` quanto com `Authorization: <token>`. O teste foi interrompido antes das consultas de negócio. Não houve login, refresh, logout ou escrita no ERP.

Resultado: conectividade HTTPS confirmada, autenticação não validada. O 401 não permite distinguir token expirado, inválido ou mecanismo de autenticação diferente (por exemplo, chave de integração). Próximo passo: identificar a origem/tipo do token e o header exigido, sem compartilhar o segredo na conversa. Produtos, estoque, vendas e compras continuam sem validação autenticada.

## Validação do formato de autorização — 16/10/2026

Após autorização explícita do usuário para login, `POST /api/auth` retornou HTTP 200 com `accessToken` e `refreshToken`. O accessToken novo com prefixo Bearer havia retornado 401. No teste seguinte, o token retornado foi enviado diretamente em `Authorization`, sem prefixo: `GET /api/v1/venda/cupons-fiscais?start=0&count=1` retornou HTTP 200, um cupom e `total=1049`. A amostra contém `itensVenda`, `dataVenda`, `lojaId`, `cancelada` e campos de totais/cancelamentos. A contagem é o total informado para essa consulta e contexto de acesso; não comprova todo o histórico da loja.

`GET /api/v1/myself` retornou 404 sem Bearer; causa não determinada, não usar como único teste de autenticação. Leitura de cupons autenticada está comprovada. Produtos, estoque, fornecedores e compras ainda não foram testados com o formato correto. Credenciais e tokens não foram persistidos por este teste; token foi usado somente em memória. Não houve refresh, logout nem escrita nos dados de negócio do ERP.

## Planejamento a partir do PRD — 16/10/2026

Foi localizado o PRD v1.0 em `origin/work:docs/PRD.md` (commit `ede01140de4203d83ef393557e8e388723a7a39a`). O planejamento está em [histórias](../.specs/features/comprador-virtual/spec.md), [subtarefas](../.specs/features/comprador-virtual/tasks.md) e [contexto e rastreabilidade](../.specs/features/comprador-virtual/context.md). A cópia da fonte foi preservada sem merge de branches.

Decisão posterior do usuário: adiar separação B2B. O plano propõe vendas totais e explicita o risco de picos excepcionais. A emissão no ERP permanece bloqueada; login tem apenas a exceção explícita já registrada. Preparação local não satisfaz o critério original de compra real aceita no destino. Fórmula, janela de consumo, permissões, reservas e frequência permanecem pendentes identificadas. Foram criadas 16 histórias, 35 subtarefas candidatas para a etapa local e 28 subtarefas de refinamento para sete histórias futuras/condicionais. O usuário solicitou somente planejamento; nenhuma implementação, commit, push ou chamada ERP foi realizada nesta etapa.

## Nova autorização de token e reavaliação do acesso — 19/10/2026

O usuário autorizou especificamente gerar um token para realizar a validação dos dados. Essa instrução posterior abre uma exceção pontual à vedação de login desta RFC/AGENTS.md, exclusivamente para obter o token necessário à validação. Não autoriza escrita comercial, envio de pedidos, refresh/logout nem mudança do cliente de produção, que permanece somente GET em consultas permitidas.

A obtenção do token não foi executada: o ambiente atual não tem bindings de secrets/runtime variables/outbound identities, a carga normal de `.env` informa arquivo ausente e `ERP_ACCESS_TOKEN`/`ERP_STORE_ID` não estão configurados. Não foram procuradas credenciais em arquivos de segredo. A origem fixa da loja não consta entre os destinos customizados permitidos da política consultada; não houve troca de origem nem tentativa de bypass. A única chamada foi GET público, sem autenticação e sem seguir redirecionamentos, ao Swagger do host permitido, com HTTP 503; isso não informa a disponibilidade da API da loja.

A evidência autenticada de 16/10 continua válida apenas como registro histórico; não demonstra token disponível ou acesso operacional nesta sessão. A matriz de critérios para estoque/reservas, devoluções, cobertura fiscal/histórica, compras parciais e cadastro/custo, com o bloqueio atual e a ação mínima de configuração segura, está em [Contratos de leitura do ERP](validacao-erp-leitura.md#reavaliação-do-acesso-e-dos-critérios--19102026). Nenhuma nova fonte real foi validada, e nenhuma escrita de negócio, login, refresh, logout ou operação no banco de produção foi feita nesta reavaliação.

### Credenciais existentes na Vercel e validação adiada

O coordenador verificou somente os metadados das variáveis de produção do projeto Grand Cru na Vercel: `ERP_USERNAME`, `ERP_PASSWORD` e `ERP_STORE_ID` já estão cadastradas como sensíveis. Nenhum valor foi lido ou descriptografado. A limitação descrita acima é do executor atual, que não recebe essas variáveis, e não ausência de credenciais na plataforma.

O usuário decidiu posteriormente adiar a validação real do ERP. A proposta de diagnóstico operacional foi interrompida antes da criação de código; nenhum script, obtenção de token, login, consulta autenticada ou nova chamada de rede foi realizado após o adiamento. Permanece apenas a análise documental, para retomada futura solicitada pelo usuário.
