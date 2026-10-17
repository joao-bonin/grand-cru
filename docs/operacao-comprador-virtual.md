# Comprador virtual — operação da etapa local

## O que foi implementado

- `/replenishment`: consulta de produtos, indicadores, pendências, parâmetros locais e seleção para revisão.
- `/purchase-drafts`: ajustes, agrupamento por fornecedor e histórico persistido no PostgreSQL do Grand Cru.
- Sincronização manual: somente consultas GET documentadas do Varejo Fácil. O token é enviado diretamente em Authorization, sem Bearer, exclusivamente pelo servidor.
- O cliente externo não expõe escrita, login, renovação, logout, batch ou destino configurável. Redirecionamentos são recusados. Erros não incluem token/corpo privado.
- Usuário autenticado consulta; admin solicita sincronização, altera parâmetros e revisa suas rodadas. Alterações locais exigem origem válida.

Salvar rascunho ou concluir a revisão local não emite pedido no ERP e não representa recebimento confirmado. Não existe botão de enviar pedido ao ERP.

## Configuração privada

Usar os campos documentados em `.env.example`: conexão PostgreSQL e JWT do Grand Cru, `ERP_ACCESS_TOKEN` e `ERP_STORE_ID`. A origem ERP é fixa no código; não há proxy HTTP genérico. Tokens de teste não foram versionados. Expiração do token exige substituição operacional fora da aplicação; esta versão não faz login/refresh automático.

Migrations são versionadas e não executadas na inicialização. Nesta implementação foram aplicadas somente em banco descartável local. Nenhuma conexão ou migration de produção foi usada.

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

`npm run test:integration`: exige PostgreSQL local descartável e servidor local iniciado com a mesma conexão, além de `ERP_ACCESS_TOKEN` e `ERP_STORE_ID` explicitamente vazios. Os testes novos recusam token ERP configurado. Nunca usar conexão de produção. Chromium precisa estar instalado; a execução local utilizou `/usr/bin/google-chrome` via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

A jornada de navegador cobre seleção, explicação, ajuste, revisão, recarga, histórico e ausência de overflow em390px. Testes de segurança utilizam transporte mockado, incluindo as mutações de método e rota: não fazem chamadas reais ao ERP.

## Limites de entrega

Leia `.specs/features/comprador-virtual/validation.md` e `tasks.md` para resultados e pendências. Exportação importável depende do contrato do destino; escrita no ERP segue proibida. B2B permanece adiado. Financeiro, OFX e Agendor dependem de fontes e regras ainda não validadas. Nenhum mock foi apresentado como integração operacional dessas fontes.
