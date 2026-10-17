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

## Continuidade da autenticação — proposta de 17/10/2026

O usuário questionou o uso de access token fixo na publicação e apontou a necessidade de login e renovação após expiração. A configuração manual atual não resolve a continuidade operacional da autenticação. A recomendação é manter credenciais somente no servidor, obter accessToken e refreshToken em `POST /api/auth` e renovar pelo contrato `GET /api/auth/refresh`, com coordenação entre sincronizações concorrentes e repetição limitada da consulta original. Validade, rotação e comportamento de falha da renovação ainda precisam ser comprovados; não presumir que o refreshToken possa ser reutilizado indefinidamente.

Esta é uma proposta pendente, não autorização para executar ou implementar login/refresh: o AGENTS.md vigente os proíbe expressamente, e a exceção anterior autorizou apenas o teste pontual já concluído. A eventual exceção precisa abranger explicitamente autenticação e renovação da sessão da integração, preservando a proibição absoluta de escrita nos dados de negócio, logout e demais operações. Nenhuma chamada real ou mudança de código foi realizada nesta discussão.

### Exceção confirmada pelo usuário — 17/10/2026

Após a proposta acima, o usuário autorizou expressamente apenas autenticação e renovação, permitindo criar tabela no banco do aplicativo para tokens e data de renovação. Esta decisão substitui as proibições anteriores exclusivamente para `POST /api/auth` e `GET /api/auth/refresh`. Logout, testes de escrita e qualquer alteração de dados de negócio do ERP continuam proibidos. AGENTS.md foi atualizado com essa autorização.

Implementação: cliente de autenticação separado do cliente GET de negócio, origem fixa, sem redirects; tokens cifrados em PostgreSQL com chave exclusiva no gerenciador de segredos; renovação sob lock por identidade, versão monotônica e repetição de uma consulta GET no máximo uma vez após 401. Sem prazo fixo inventado: `exp` de JWT serve somente como pista de agendamento; token opaco renova após 401. Testes usam exclusivamente mocks e PostgreSQL local. Contrato real de refresh/rotação não é considerado validado por fixtures.

Validação local da implementação: `npm run check` em Node24.19.0 aprovado com337 testes unitários, lint, tipos e build;18 testes de integração aprovados em PostgreSQL17 local descartável. Foram verificados tokens cifrados, datas/versões, rollback, concorrência entre pools, renovação lenta, rotação e repetição limitada. A revisão independente inicial apontou dois problemas corrigidos: espera do lock menor que a duração possível do refresh/login e corpos de erro sem cancelamento. Regressões mantidas; revisão final e sensor registrados em `.specs/features/erp-session/validation.md` quando concluídos.

Durante a validação, a migration0002 `erp_sessions` foi versionada e aplicada no banco local. Configuração necessária no servidor: `ERP_USERNAME`, `ERP_PASSWORD`, `ERP_TOKEN_ENCRYPTION_KEY` (32 bytes aleatórios em base64) e `ERP_STORE_ID`. Nenhuma chamada ao ERP real foi feita para implementar ou testar a sessão renovável.

### Publicação da sessão renovável — 17/10/2026

Após PASS independente12/12 critérios,337 testes unitários,18 integrações locais e7/7 mutações detectadas, o código de `e99d54567ab730f56c90acf7b1bf59a4db85cc96` foi publicado conforme a autorização de publicação direta em produção. A execução `dpl_HujoWDdRYvZWHTsewqed5qQv4axo` concluiu READY e os logs confirmaram `Migrations aplicadas.`. A migration0002 cria exclusivamente `erp_sessions` no banco do aplicativo; não altera dados de negócio do ERP.

A publicação final `dpl_H7Hv65zYKfjKRjTZmWE48EVkKRdb` concluiu READY, confirmada no alias `https://grand-cru-iota.vercel.app`, com o arquivo original de build normal (hash3494b2f8c125558f4724b0f7c93f0a214d6e8993). Não há migration nem redefinição de senha na inicialização ou no build normal. GET anônimo `/api/erp/status` retornou401 após a publicação. Nenhuma chamada ao ERP real foi executada.

A listagem final de nomes das variáveis, sem descriptografia, confirmou os quatro campos ERP ainda ausentes em Production. Portanto o código e a tabela estão publicados, mas a integração segue desabilitada até configurar usuário, senha, chave e loja e criar uma publicação com esses campos. Não afirmar autenticação/refresh real validado. O PR #2 já havia sido integrado à main; esta mudança fica separada em `codex/erp-session`.

### Consulta solicitada do identificador da loja — 17/10/2026

O usuário solicitou consultar as lojas e retornar o ID. GET `/api/v1/pessoa/lojas?start=0&count=100` com o token local existente retornou401; nenhum ID foi confirmado. A listagem de nomes das variáveis confirmou `ERP_USERNAME`, `ERP_PASSWORD` e `ERP_TOKEN_ENCRYPTION_KEY` presentes em Production, sem descriptografia ou leitura de seus valores.

A proposta de executar login e consulta em script temporário no build da mesma versão foi rejeitada pela revisão automática por ampliar uma consulta para publicação de produção. Nenhum novo deployment foi criado e o bloqueio não foi contornado. Não havia sessão ERP disponível no navegador nem credenciais ERP no ambiente local. A consulta autenticada permanece pendente de um meio de execução autorizado; nenhum login/refresh nem escrita de negócio foi realizado nesta tentativa.

Na sequência, o usuário determinou executar `/auth` e depois a consulta. A execução pontual usou as credenciais anteriormente fornecidas, manteve o token apenas em memória e concluiu o login e GET `/api/v1/pessoa/lojas?start=0&count=100` com sucesso. A API retornou `total=1`, uma loja ativa com `id=1`, `sigla=LJ01` e nome `OZELIN LOPES COMÉRCIO DE BEBIDAS`. Portanto `ERP_STORE_ID=1` foi confirmado para esse ambiente. Nenhum segredo foi impresso ou persistido, não houve refresh, logout, alteração de dados de negócio nem nova publicação na Vercel. Esta consulta comprova a identificação da loja e o login, não a renovação real da sessão nem as demais fontes de negócio.

### Aplicação das variáveis de produção — 17/10/2026

O usuário confirmou a configuração das variáveis na Vercel. A listagem de nomes, sem descriptografia, confirmou os quatro campos em Production. A mesma versão da aplicação foi republicada com build normal, sem script de consulta, migration ou redefinição de senha. Deployment `dpl_6vCHsXBCcet2Xyg2TAkikWBUgq7d` concluiu READY e assumiu o alias `https://grand-cru-iota.vercel.app`. Não foi executada sincronização de dados nesta publicação. A confirmação de presença dos campos não substitui a validação dos valores nem comprova o refresh real; o próximo passo operacional é a sincronização manual autenticada pelo aplicativo, exclusivamente de leitura no ERP.

## Planejamento a partir do PRD — 16/10/2026

Foi localizado o PRD v1.0 em `origin/work:docs/PRD.md` (commit `ede01140de4203d83ef393557e8e388723a7a39a`). O planejamento está em [histórias](../.specs/features/comprador-virtual/spec.md), [subtarefas](../.specs/features/comprador-virtual/tasks.md) e [contexto e rastreabilidade](../.specs/features/comprador-virtual/context.md). A cópia da fonte foi preservada sem merge de branches.

Decisão posterior do usuário: adiar separação B2B. O plano propõe vendas totais e explicita o risco de picos excepcionais. A emissão no ERP permanece bloqueada; login tem apenas a exceção explícita já registrada. Preparação local não satisfaz o critério original de compra real aceita no destino. Fórmula, janela de consumo, permissões, reservas e frequência permanecem pendentes identificadas. Foram criadas 16 histórias, 35 subtarefas candidatas para a etapa local e 28 subtarefas de refinamento para sete histórias futuras/condicionais. O usuário solicitou somente planejamento; nenhuma implementação, commit, push ou chamada ERP foi realizada nesta etapa.

## Correção da carga por volume e diagnóstico seguro — 17/10/2026

A mensagem genérica reportada pelo usuário foi investigada com consultas operacionais somente leitura, separadas dos testes automatizados. Login e primeiras páginas acessíveis não garantiam a conclusão da carga: a execução original parou em `ERP_SYNC_DEADLINE` após50.947ms, com31 páginas de produtos,1 de fornecedores e100 de estoque. Metadados reais:3.077 produtos,55 fornecedores,18.612 saldos,1.053 cupons,3 devoluções e0 pedidos de compra. O estoque exige187 páginas de100. A página final de produtos confirmou `start=3000,count=77,items=77,total=3077`; não há evidência para flexibilizar a validação de paginação.

Correção: orçamento global de180.000ms, verificado antes e após cada consulta; Nitro configura `vercel.functions.maxDuration=300`. A [documentação oficial de duração das Functions](https://vercel.com/docs/functions/configuring-functions/duration) e os tipos/preset locais do Nitro fundamentam a configuração. O timeout individual de15s, rotas, métodos e mapeadores permanecem. O prazo maior permite o volume observado, mas não garante disponibilidade ou latência do serviço externo.

Falhas de consulta/mapeamento passam a carregar fonte fixa e código conhecido; a mensagem pública informa fonte/motivo e preservação da versão anterior. Textos arbitrários, corpos, causas, SQL, credenciais e tokens não são propagados. Falhas sem contexto reconhecido mantêm a mensagem genérica; autenticação pendente mantém o código já tratado pela interface. A publicação do snapshot permanece integral e transacional, sem dados parciais ou preenchimento artificial de campos desconhecidos.

Uma tentativa operacional após a correção retornou `ERP_TRANSPORT_FAILED` na primeira página de produtos após24.082ms, incluindo login. Isso demonstra uma falha adicional de conexão, não autenticação inválida comprovada. Resultado de carga completa e validação de produção serão registrados separadamente; não presumir sucesso pela configuração das variáveis.

Validação operacional após a retomada: a carga corrigida concluiu em90.146ms, incluindo login, com232 GETs (31 produtos,1 fornecedores,187 estoque,11 cupons,1 devoluções,1 compras). Mapeamento retornou3.077 produtos,55 fornecedores,18.612 saldos da loja,2.533 itens de venda e0 compras. Esta consulta não persistiu dados no aplicativo; tokens permaneceram em memória. Confirma a leitura/mapeamento naquele momento, não a sincronização autenticada da aplicação em produção nem o contrato real de refresh/rotação.

Gates da correção aprovados: `npm run check` (lint sem avisos, tipos,364 testes unitários e build),19 integrações completas em servidor/PostgreSQL/navegador locais; todos os segredos ERP vazios nos testes. Revisão independente sem achados,7/7 regressões detectadas em scratch, árvore real preservada. Build adicional com `NITRO_PRESET=vercel` aprovado; `.vercel/output/functions/api/erp/sync.func/.vc-config.json` contém `maxDuration:300`. Publicação será de fontes com Node24 configurado, não dos artefatos locais. Relatório: `.specs/features/erp-sync-volume/validation.md`.

Publicação confirmada: deployment `dpl_4kCfaxAVTLUKjCEQJ9k6A2XspCqJ`, fontes698f70e, estadoREADY e alias `grand-cru-iota.vercel.app` apontando para esta versão. Build normal de fontes com Node24.x configurado, sem migrations/reset de senha. Login público HTTP200 e status ERP sem sessão HTTP401. PR3 atualizado e commits enviados. A sincronização pelo usuário autenticado em produção ainda não foi executada nesta validação; a leitura completa comprovada acima foi uma consulta operacional separada, sem persistência no aplicativo. Próximo passo operacional: usuário atualizar a página e acionar Atualizar agora.
