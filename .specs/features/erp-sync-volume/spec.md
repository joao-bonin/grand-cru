# Sincronização compatível com o volume do ERP

## Problem Statement

A carga real falhou com ERP_SYNC_DEADLINE após50.947ms, depois de31 páginas de produtos,1 de fornecedores e100 de estoque. O ERP informou3.077 produtos e18.612 saldos, exigindo187 páginas de estoque. O prazo de50s era insuficiente e o repositório ocultava a fonte e o código em uma mensagem genérica.

## Out of Scope

Escrita de negócio/logout no ERP, aumento de page size, paralelismo de consultas, alterações de fórmula, cron/checkpoints, inferência de reservas e preenchimento de campos desconhecidos. Os endpoints e a validação de paginação permanecem os mesmos: metadados reais confirmaram count igual ao tamanho real da página.

## Assumptions & Open Questions

| Area | Chosen default | Rationale |
| --- | --- | --- |
| Prazo da carga |180.000ms, interromper antes e após cada consulta quando esgotado | Volume real excede50s; orçamento continua finito |
| Hospedagem | Nitro Vercel functions maxDuration300s | Margem para autenticação, lock e persistência; opção confirmada nos tipos/código locais do Nitro e documentação oficial Vercel |
| Diagnóstico | Fonte fixa e código enumerado; sem itens, corpo, SQL, cabeçalhos, URL arbitrária, segredos ou causa | Informar a falha sem expor informação privada |
| Dados anteriores | Manter snapshot integral anterior em qualquer falha | Não publicar dados parciais nem converter desconhecidos em zero |
| Testes | ERP mockado e PostgreSQL local; observações reais são consultas operacionais separadas | Restrição do AGENTS.md |

Open questions: none. Outros problemas de contrato eventualmente encontrados são corrigidos apenas com evidência e sem enfraquecer as invariantes.

## User Stories

### US01 — Concluir a carga inicial ou explicar sua falha

Acceptance Criteria:

- WHEN uma carga sintética com3.077 produtos e18.612 saldos dura mais de50s mas menos de180s, the loader SHALL retornar todos os registros, sem mudar métodos, rotas, paginação ou mapeamento.
- WHEN180.000ms são atingidos antes de uma consulta, the loader SHALL falhar com ERP_SYNC_DEADLINE sem iniciar essa consulta.
- WHEN180.000ms são atingidos durante uma consulta, the loader SHALL rejeitar seu resultado antes de publicá-lo ou iniciar outra fonte.
- WHEN uma consulta ou mapeamento falha, the loader SHALL associar a fonte de uma enumeração fixa e somente um código sanitizado conhecido, preservando o código ERP_AUTHENTICATION_PENDING já tratado.
- WHEN uma falha de fonte é persistida, the repository SHALL manter o snapshot anterior e informar fonte, motivo público e preservação da versão anterior, sem propagar corpo, tokens ou mensagem arbitrária do erro original.
- WHEN o erro não tem diagnóstico reconhecido, the repository SHALL manter a mensagem genérica existente; WHEN é autenticação pendente, the repository SHALL manter o código compatível já existente.
- WHEN a aplicação é compilada para Vercel, the configuration SHALL definir maxDuration300s sem executar migration ou redefinição de senha automaticamente.

## Requirement Traceability

| ID | Requirement | Status |
| --- | --- | --- |
| SV-01 | Prazo compatível e finito | verified (budget-evidence.md) |
| SV-02 | Falha por fonte com redação segura | verified (diagnostic-evidence.md) |
| SV-03 | Snapshot preservado e configuração da hospedagem | implementing |

## Execution Plan

1. Corrigir orçamento da carga e configuração Nitro, com regressão de volume e fronteiras de tempo; commit fix(erp), gate unitários direcionados.
2. Associar falhas a fonte/código enumerados e persistir diagnóstico seguro; commit fix(erp), gate unitários e integração PostgreSQL local.
3. Executar check e integração completos, revisão independente/sensor, registrar validação e publicar correção conforme autorização de produção já existente. Nenhuma escrita de negócio no ERP.

## Evidence baseline

Metadados reais observados em17/10/2026: página final produtos start3000,count77,items77,total3077; fornecedores55; estoque18612; cupons1053; devoluções3; compras0. Paginação coerente. Execução operacional da carga original: ERP_SYNC_DEADLINE,50.947ms, última fonte estoque,31+1+100 chamadas. Tokens somente em memória; nenhum registro privado ou segredo registrado.

## Design

Orçamento global constante no caso de uso e guardas antes/depois de cada GET. A falha possui fonte enumerada, código conhecido e texto público derivado no servidor. Não transportar causas arbitrárias. O repositório mantém a publicação transacional existente e altera somente o erro público quando a falha estruturada é reconhecida. Não flexibilizar mappers ou retornar coleções vazias para fontes que falharam.
