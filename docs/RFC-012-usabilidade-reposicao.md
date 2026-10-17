# RFC-012 — Paginação e legibilidade da reposição

Status: implementação solicitada pelo usuário em 17/10/2026. Relacionadas: RFC-008, RFC-009 e RFC-011.

## Solicitação e decisões

O usuário solicitou conferir paginação na API, explicar `PRODUCT_PURCHASE_PARAMETERS_MISSING:1000008429`, melhorar os textos cinza e o formulário de usuários. A integração já pagina o ERP. O Swagger público confirma `start` (posição inicial), `count` (quantidade) e resposta `start,count,total,items`: [documentação oficial](https://fgcuritibabatel.varejofacil.com/api/v1/docs), esquema `/doc/swagger2/swagger.yaml` apontado pela própria página. O exemplo 100 não prova um limite máximo do fornecedor.

A tela usará a API local paginada com 20 produtos por página. Filtros atuam no conjunto completo antes do recorte; ruptura tem prioridade e produto/loja desempata a ordenação. Opções de fornecedores vêm do conjunto completo. A seleção é por página e fica explícita na interface; mudar página/filtros limpa seleção. Requisições sem count mantêm o contrato completo usado para preparar rodadas fora da primeira página. Erros mantêm a última resposta publicada; resultados indisponíveis continuam bloqueados.

A pendência de parâmetros significa que a integração não comprovou fornecedor, embalagem ou unidade de compra. O código não identifica sozinho qual campo falta. A apresentação explicará essa limitação, agrupará SKUs únicos e orientará conferência, sem inventar valores ou remover bloqueios das sugestões. Códigos conhecidos serão traduzidos; códigos técnicos desconhecidos recebem aviso genérico. O domínio conserva os códigos originais.

O visual manterá a identidade vinho e fundo claro, com textos escuros e secundários de pelo menos 12px/contraste 4,5:1. O formulário terá identificação/segurança e permissões agrupadas, campos largos e controles de 44px ou mais. Regras de senha, perfis, status, payloads e proteção do último administrador permanecem.

## Segurança e validação

Nenhuma escrita nos dados de negócio do ERP. Esta etapa não exige autenticar nem consultar registros reais do ERP; documentação pública e testes simulados são suficientes. Testes de interface e persistência usam servidor/PostgreSQL locais, com segredos ERP vazios. Não há migration nova. A autorização anterior dispensa aprovações humanas intermediárias; escolhas visuais são reversíveis e serão apresentadas para avaliação do usuário.

Plano e critérios: `.specs/features/replenishment-usability/spec.md`. Baseline 364 testes unitários/19 integrações. Evidências finais e revisão independente serão registradas após os gates.

## Implementação e verificações intermediárias

O esquema público foi consultado novamente nesta etapa e confirmou os parâmetros de paginação de produtos e ResultListProduto, sem autenticação nem consultas de negócio. Os componentes agora reutilizam a consulta pura compartilhada; a API conserva autenticação e validação de limites. A apresentação traduz os códigos, sem modificar os bloqueios do domínio.

A área de toque foi aumentada para 48px inclusive no checkbox e no fechamento do modal: o teste real mediu 43,99px em um controle nominal de 44px durante a animação. A asserção mínima de 44px foi preservada. A compilação exigiu usar o alias #shared nos componentes Vue, seguindo os componentes já existentes. Não houve alteração de endpoints do ERP.

O modo automático de cor foi desabilitado pela opção suportada `ui.colorMode=false` do Nuxt UI instalado. Assim a aplicação conserva o tema claro mesmo com preferência antiga escura no navegador. A meta de contraste mínimo 4,5:1 segue a [orientação WCAG sobre contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); o teste mede cores computadas no navegador, além do tamanho da fonte e dos controles.

## Validação final

`npm run check` aprovado com389 testes unitários, lint, tipos e build;20 integrações locais aprovadas. A revisão independente comprovou13/13 critérios e inspecionou as capturas sintéticas. O sensor inicial encontrou uma lacuna no teste do desempate por produto/loja; foi acrescentada comparação da sequência completa e do recorte com entrada fora de ordem e duas lojas do mesmo produto. Remover a regra inteira ou cada parte isolada agora falha por asserção. Não houve mudança de implementação para fechar essa lacuna, nem alteração de testes anteriores. A lição L-003 ficou candidata para avaliação futura.

Relatório e evidências: `.specs/features/replenishment-usability/validation.md`, `pagination-evidence.md`, `issues-evidence.md`, `visual-evidence.md`. Screenshots de formulário mobile/desktop e paginação estão em `docs/screenshots`. Não constituem UAT humano nem validação autenticada de produção. A publicação será registrada separadamente.

## Publicação

Deployment `dpl_CEBC97oT88rDCQL1E1Df1ZDZs6aL` READY, fontes87ced8f com runtime idêntico a b1c3f8d. Alias `grand-cru-iota.vercel.app` confirmado apontando para a nova versão. Publicação normal de110 arquivos de runtime, Node24.x, sem arquivos env/testes/docs nem migrations/reset. Login público retornou200; recomendações paginadas sem sessão retornaram401. O stylesheet servido pelo alias contém `--ui-primary:#713044` e `--ui-text-muted:#5f5057`, comprovando os novos tokens visuais publicados. PR3 atualizado e commits enviados. O fluxo autenticado de produção e a avaliação visual pelo usuário continuam distintos dos testes locais; nenhuma credencial de produção foi recuperada ou sessão forjada. Nenhuma operação no ERP além da documentação pública foi realizada nesta feature.
