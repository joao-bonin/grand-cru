# RFC-006 — Preparação do provisionamento na Vercel

- **Status:** publicação retomada por autorização do usuário; MySQL de produção pendente.
- **Relacionadas:** RFC-001 e RFC-004.

## Objetivo e estado

O usuário solicitou provisionar o projeto na Vercel e, em seguida, orientou pausar essa configuração para priorizar o GitHub Actions. Nenhuma conta, projeto remoto ou deployment foi criado.

As ferramentas e os recursos disponíveis nesta sessão não incluem um MCP da Vercel. Também não foram encontrados autenticação da CLI, token configurado ou vínculo local com um projeto Vercel. A conta poderá ser criada ou conectada pelo usuário posteriormente.

## Preparação realizada

- `vercel.json` define framework Nuxt, `npm ci` para instalar e `npm run build` para construir.
- `.vercelignore` impede enviar `.env`, arquivos com credenciais locais, dependências instaladas, saídas de desenvolvimento e documentação no upload de código.
- `NITRO_PRESET=vercel npm run build` foi executado com sucesso e gerou `.vercel/output` localmente. Isso comprova geração do artefato, sem equivaler a deploy ou prontidão da infraestrutura remota.
- O build usa funções Node.js; a implementação com MySQL e Argon2id não foi direcionada ao runtime Edge.

## Pendências quando o trabalho for retomado

- Disponibilizar acesso autenticado à conta/equipe Vercel e confirmar o destino do projeto.
- Criar ou vincular o projeto e a integração GitHub.
- Selecionar MySQL de produção e configurar `NUXT_DATABASE_URL` e `NUXT_JWT_SECRET` de forma segura, com ambientes de preview e produção separados.
- Configurar versão Node.js, região junto ao banco, conexões, TLS e aplicação de migrations.
- Provisionar as contas reais, publicar e validar login, autorização e funcionalidades no ambiente remoto.

Credenciais não devem ser enviadas em chat, incluídas nas RFCs ou versionadas. A configuração de deploy pelo GitHub depende dessas pendências e não está implementada.

## Retomada em 15/10/2026

O usuário confirmou Vercel como hospedagem e autorizou continuar a publicação. Não foi localizada uma RFC-010 nesta cópia do projeto; esta atualização registra somente decisões e resultados observados nesta sessão.

- Projeto Vercel criado: `grand-cru` (`prj_Ec0Pq4A7odUC6l7fxq8J1Arr9Hv2`), na conta conectada (`team_x31ULWM1ACJt38MgYxhPoI5X`).
- Framework Nuxt e Node.js 24.x; vínculo local salvo em `.vercel/project.json`, ignorado pelo Git.
- Primeiro deploy de produção solicitado: `dpl_GCWivPcY9AAW4Cmdh4zbj7VGPufh`.
- Envio dos arquivos locais, incluindo alterações ainda não commitadas; a base Git é `b39787b`, que não representa sozinho o conteúdo publicado. A integração de publicação por GitHub continua pendente.
- `npm run check` passou: lint, tipos, 61 testes em oito arquivos e build local.
- MySQL de produção, chave JWT exclusiva, migrations e administrador real permanecem pendentes. Nenhuma migration foi executada em produção e nenhuma credencial local foi copiada para o deploy.
- Publicação das páginas não comprova login funcional; validar autenticação remotamente após provisionar banco e segredos.

### Limitação de validação remota

A consulta de logs e o acesso autenticado à página retornaram HTTP 403 por falta de autorização da conexão Vercel para o escopo `joao-bonins-projects`. A CLI Vercel não está instalada. O deploy concluiu com estado READY em produção e alias https://grand-cru-iota.vercel.app. O build remoto levou aproximadamente 43 segundos. Não se deve declarar login funcional ou validação remota concluída. Para continuar, autorizar o novo projeto/equipe na conexão Vercel e definir o MySQL de produção.

## Proposta de MySQL para revisão — 15/10/2026

O usuário pediu preparar uma opção de MySQL; isso confirma o motor, mas não a contratação de um provedor ou plano.

Recomendação: Aiven for MySQL, serviço gerenciado externo conectado às funções Node.js da Vercel. Preserva o esquema Drizzle/MySQL existente. A disponibilidade e os preços atuais de planos, inclusive eventuais ofertas gratuitas, não foram verificados nesta sessão e devem ser conferidos no console https://console.aiven.io/ antes de contratar. Nenhum recurso foi criado.

Configuração proposta:

1. Criar serviço MySQL exclusivo do Grand Cru e selecionar região próxima de `iad1`, região atual das funções; conferir versão compatível com as migrations locais, limites de conexões, backups e restauração do plano.
2. Configurar TLS com validação de certificado; verificar se o certificado requer CA específica do provedor. Não usar `rejectUnauthorized: false`. O código atual recebe somente URI: adaptar uma configuração de conexão compartilhada entre aplicação, migrations e provisionamento de administrador, caso seja necessária CA própria.
3. Usar credencial de aplicação com permissões limitadas e credencial administrativa separada para migrations. Armazenar URI em `NUXT_DATABASE_URL`, restrita a Production no projeto Vercel. Preview não deve usar esse banco.
4. Gerar `NUXT_JWT_SECRET` exclusivo de produção com pelo menos 32 bytes aleatórios. Não enviar valores pelo chat nem copiá-los do desenvolvimento.
5. Revisar o pool existente (cinco conexões por instância), configurar limites conforme o plano e avaliar `attachDatabasePool` de `@vercel/functions` para Fluid Compute. A documentação Vercel informa suporte ao MySQL2: https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package.
6. Após autorização do provedor/plano e conexão segura disponível, aplicar migrations explicitamente e criar administrador pelos scripts existentes; não executar migrations na inicialização. Verificar em MySQL local qualquer alteração de autenticação/persistência antes de publicar.
7. Fazer novo deploy e validar login, logout, bloqueio sem autenticação e gestão de usuários. O acesso remoto segue dependente da autorização da conexão Vercel ao projeto/equipe.

O próximo passo humano é criar/conectar uma conta Aiven e selecionar o plano. Não há ferramenta autenticada Aiven nesta sessão; não foi possível verificar custo ou provisionar o serviço. O plano é uma proposta, não uma integração concluída.

## Substituição da proposta de MySQL

Em 15/10/2026, o usuário informou disponibilidade apenas de PostgreSQL no Aiven e confirmou adaptar o projeto. A proposta MySQL acima fica superada; consultar RFC-010. Nenhuma oferta gratuita foi validada por API nesta sessão; conferir o plano no console Aiven.
