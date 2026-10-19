# Comprador virtual — desenho da implementação

Data: 16/10/2026. Implementação local autorizada pelo usuário; paralelismo explicitamente solicitado prevalece sobre lotes sequenciais da skill. Nenhuma autorização de escrita no ERP.

## Fronteiras

- Domínio puro recebe snapshots e políticas explícitas, sem HTTP/banco/Vue.
- Transporte externo exclusivo para GET em allowlist fixa de rotas documentadas do Varejo Fácil. Método não configurável, redirecionamento recusado, sem login, refresh, logout ou batch na aplicação.
- Token existente é configuração privada `ERP_ACCESS_TOKEN` do processo servidor. Nenhum segredo em runtime público, payload de UI ou logs.
- Rotas Grand Cru utilizam a autenticação JWT existente, validação de origem em mutações locais e admin para sincronização, parametrização e revisão; user consulta.
- Um snapshot versionado local contém dados traduzidos/minimizados. A publicação ocorre apenas após carga completa; versão anterior permanece na falha. Não inferir reservas nem cobertura histórica desconhecidas.
- PostgreSQL local do Grand Cru armazena snapshots, estado de sincronização, políticas por loja/SKU e rodadas locais. JSONB tipado mantém DTO de aplicação coeso; colunas de identidade e versão permitem constraints e concorrência.
- Lock advisory PostgreSQL por origem impede cargas simultâneas e é liberado se a conexão morrer. Falhas ficam persistidas. Uma execução ativa interrompida é substituível quando não há lock.
- Revisões usam snapshot e versão otimista; idempotência por chave da rodada. Grupos por fornecedor são derivados dos itens locais. Nenhum pedido local é recebimento confirmado.

## Parâmetros e limites

Sem janela ou estoque conhecido não há sugestão. L/R/S/M, janela, embalagem, fornecedor e custo são editados localmente por admin. Não adotar 60/90 dias ou segurança de 7 dias silenciosamente. Fórmula configurável usa os critérios numéricos da spec, com S em unidades. Datas de consumo usam dias civis completos em America/Sao_Paulo. Escopo por loja, sem juntar estoques de lojas diferentes.

Não habilitar agendamento sem política de operação. Nenhuma migration de produção será executada. Retenção: preservar dados e auditoria nesta versão; não realizar purge automático.

## Entregas futuras

US10 exportação real depende de layout validado; não anunciar CSV genérico como aceito. US11 envio bloqueado por regra de segurança. B2B começou com domínio puro em 19/10; integração operacional permanece pendente. Financeiro/OFX/Agendor têm contratos externos e regras pendentes; implementar somente o que puder ser comprovado localmente, registrar limites e não apresentar mocks como integração real.

## Atualização — 19/10/2026

O usuário autorizou completar a retomada de sincronização e iniciar B2B com subagentes paralelos. A RFC-012 detalha checkpoints por conjuntos completos, validade técnica, isolamento por credencial/loja e recuperação de trabalhador interrompido. A RFC-013 registra a primeira fatia pura de B2B; o adiamento foi revogado para iniciar essa fatia, sem assumir classificação real ou integração com as recomendações.

Commit, merge e verificação em produção foram autorizados posteriormente pelo usuário. A validação real das fontes do ERP foi adiada expressamente nesta entrega; os segredos existentes na Vercel não foram lidos. Essas novas autorizações não permitem escrita comercial no ERP.

## Testes e revisão

Testes unitários por entrega com fixtures sintéticas, ERP sempre mockado. Integração contra PostgreSQL descartável e servidor local sem token ERP. Revisão independente, correção e revalidação em até três ciclos; sensor de mutação em cópia isolada, nunca no checkout real.
