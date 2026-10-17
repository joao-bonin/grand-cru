# RFC-012 — Paginação e legibilidade da reposição

Status: implementação solicitada pelo usuário em17/10/2026. Relacionadas: RFC-008, RFC-009 e RFC-011.

## Solicitação e decisões

O usuário solicitou conferir paginação na API, explicar `PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429`, melhorar os textos cinza e o formulário de usuários. A integração já pagina o ERP. O Swagger público confirma `start` (posição inicial), `count` (quantidade) e resposta `start,count,total,items`: [documentação oficial](https://fgcuritibabatel.varejofacil.com/api/v1/docs), esquema `/doc/swagger2/swagger.yaml` apontado pela própria página. O exemplo100 não prova um limite máximo do fornecedor.

A tela usará a API local paginada com20 produtos por página. Filtros atuam no conjunto completo antes do recorte; ruptura tem prioridade e produto/loja desempata a ordenação. Opções de fornecedores vêm do conjunto completo. A seleção é por página e fica explícita na interface; mudar página/filtros limpa seleção. Requisições sem count mantêm o contrato completo usado para preparar rodadas fora da primeira página. Erros mantêm a última resposta publicada; resultados indisponíveis continuam bloqueados.

A pendência de parâmetros significa que a integração não comprovou fornecedor, embalagem ou unidade de compra. O código não identifica sozinho qual campo falta. A apresentação explicará essa limitação, agrupará SKUs únicos e orientará conferência, sem inventar valores ou remover bloqueios das sugestões. Códigos conhecidos serão traduzidos; códigos técnicos desconhecidos recebem aviso genérico. O domínio conserva os códigos originais.

O visual manterá a identidade vinho e fundo claro, com textos escuros e secundários de pelo menos12px/contraste4,5:1. O formulário terá identificação/segurança e permissões agrupadas, campos largos e controles de44px ou mais. Regras de senha, perfis, status, payloads e proteção do último administrador permanecem.

## Segurança e validação

Nenhuma escrita nos dados de negócio do ERP. Esta etapa não exige autenticar nem consultar registros reais do ERP; documentação pública e testes simulados são suficientes. Testes de interface e persistência usam servidor/PostgreSQL locais, com segredos ERP vazios. Não há migration nova. A autorização anterior dispensa aprovações humanas intermediárias; escolhas visuais são reversíveis e serão apresentadas para avaliação do usuário.

Plano e critérios: `.specs/features/replenishment-usability/spec.md`. Baseline364 testes unitários/19 integrações. Evidências finais e revisão independente serão registradas após os gates.
