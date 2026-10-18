# Comprador virtual — operação da etapa local

## O que foi implementado

- `/replenishment`: consulta de produtos, indicadores, pendências, parâmetros locais e seleção para revisão.
- `/purchase-drafts`: ajustes, agrupamento por fornecedor e histórico persistido no PostgreSQL do Grand Cru.
- Sincronização manual: somente consultas GET documentadas do Varejo Fácil. O token é enviado diretamente em Authorization, sem Bearer, exclusivamente pelo servidor.
- O cliente de consultas não expõe escrita, login, renovação, logout, batch ou destino configurável. Um cliente separado de sessão permite exclusivamente login e refresh, conforme a exceção autorizada em17/10/2026. Redirecionamentos são recusados. Erros não incluem token/corpo privado.
- Usuário autenticado consulta; admin solicita sincronização, altera parâmetros e revisa suas rodadas. Alterações locais exigem origem válida.

Salvar rascunho ou concluir a revisão local não emite pedido no ERP e não representa recebimento confirmado. Não existe botão de enviar pedido ao ERP.

## Configuração privada

Usar os campos documentados em `.env.example`: conexão PostgreSQL e JWT do Grand Cru, `ERP_USERNAME`, `ERP_PASSWORD`, `ERP_TOKEN_ENCRYPTION_KEY` e `ERP_STORE_ID`. A origem ERP é fixa no código; não há proxy HTTP genérico. Usuário, senha e chave ficam somente no gerenciador de segredos do servidor. Nenhum segredo possui prefixo público. O access token manual deixa de ser configuração da aplicação.

O servidor obtém a sessão em `POST /api/auth` e renova usando `GET /api/auth/refresh`. O par fica cifrado com AES-256-GCM em `erp_sessions`, com data de obtenção/renovação, expiração conhecida anulável e versão. A identidade é vinculada à conta de integração. A chave de32 bytes em base64 deve permanecer estável e protegida; não reutilizar o segredo JWT. Alteração da chave exige migração controlada da sessão cifrada; chave incorreta falha sem sobrescrever os tokens nem fazer login. Não expor a tabela por API.

Refresh é coordenado por lock transacional entre instâncias. A expiração conhecida renova na margem de30 segundos; tokens opacos não recebem TTL inventado. Uma consulta401 solicita renovação da versão rejeitada e repete somente o mesmo GET uma vez. Refresh rejeitado401/403 admite um login substituto. Timeout,429,5xx e resposta inválida falham sem fallback de login. Falhas preservam a sessão e o snapshot anterior. Não existe cron de autenticação nem logout automático. A resposta real de refresh precisa conter um par válido; sua rotação operacional permanece sem comprovação com dados reais.

Migrations são versionadas e não executadas na inicialização. Durante a implementação inicial, foram aplicadas somente em banco descartável local; a publicação posterior em produção está registrada abaixo.

Atualização operacional de17/10/2026: a etapa local do comprador foi publicada em `dpl_3Cm4aVpGBk26oVQ27g7dFmuesH6Q`. Posteriormente, a migration0002 de `erp_sessions` foi aplicada em execução explícita e a sessão renovável foi publicada em `dpl_H7Hv65zYKfjKRjTZmWE48EVkKRdb`, READY, com build normal sem migration nem redefinição de senha. Os quatro campos ERP acima ainda estavam ausentes na conferência final das variáveis de Production. Configurá-los e publicar novamente antes de sincronizar. Nenhuma chamada ao ERP real foi realizada para implementar essa mudança. Evidências e limites em RFC-010 e RFC-011.

## Como interpretar dados insuficientes

- Saldo do ERP não foi presumido disponível: reserva, bloqueio e sobreposição desconhecidos impedem o cálculo dependente.
- A data do cupom mais antigo não prova cobertura histórica completa. As janelas e o consumo indicam pendência enquanto a abrangência não for comprovada.
- Devoluções precisam de reconciliação com as vendas originais. Não apresentar como definitivo o consumo líquido real antes dessa confirmação.
- Compras parcialmente atendidas precisam de validação das unidades recebidas/canceladas. O mapper aceita apenas o subset documentado sem atendimento, com quantidades explícitas e coerentes; ambiguidades bloqueiam publicação da carga.
- Uma fonte inválida preserva o snapshot anterior. Um snapshot completo é publicado em transação local; não há atualização independente por conjunto nesta versão.
- Janela de consumo, prazo, revisão, segurança em unidades e embalagem são configurações explícitas; não foram escolhidos60/90 dias nem7 dias de segurança silenciosamente.

Essas pendências não são resolvidas por inserir zeros ou por habilitar envio de compra. A validação das fontes permanece separada da implementação e dos testes com fixtures.

## Testes

`npm run check`: lint, tipos, testes unitários e build. Node24.19.0 é o runtime do projeto. Vitest usa dois workers para limitar pressão de memória.

`npm run test:integration`: exige PostgreSQL local descartável e servidor local iniciado com a mesma conexão, além de `ERP_USERNAME`, `ERP_PASSWORD`, `ERP_TOKEN_ENCRYPTION_KEY`, `ERP_ACCESS_TOKEN` legado e `ERP_STORE_ID` explicitamente vazios. Testes de sessão usam transporte injetado e pares sintéticos. Nunca usar conexão de produção. Chromium precisa estar instalado; a execução local utilizou `/usr/bin/google-chrome` via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

A jornada de navegador cobre seleção, explicação, ajuste, revisão, recarga, histórico e ausência de overflow em390px. Testes de segurança utilizam transporte mockado, incluindo as mutações de método e rota: não fazem chamadas reais ao ERP.

## Limites de entrega

Leia `.specs/features/comprador-virtual/validation.md` e `tasks.md` para resultados e pendências. Exportação importável depende do contrato do destino; escrita no ERP segue proibida. B2B permanece adiado. Financeiro, OFX e Agendor dependem de fontes e regras ainda não validadas. Nenhum mock foi apresentado como integração operacional dessas fontes.
