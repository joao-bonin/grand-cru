# RFC-010 — PostgreSQL no Aiven com aplicação na Vercel

- **Status:** mudança confirmada pelo usuário; implementação local validada; conexão de produção pendente.
- **Data:** 15/10/2026.
- **Relacionadas:** RFC-001, RFC-003, RFC-004, RFC-006 e RFC-007.

## Decisão

O usuário informou que sua conta Aiven oferece apenas PostgreSQL e solicitou alterar o projeto. PostgreSQL substitui MySQL como banco atual, mantendo Nuxt, Drizzle, autenticação JWT e Vercel. A disponibilidade/custo do plano Aiven deve ser confirmada no console; nenhum recurso pago foi solicitado ou criado.

## Implementação

- Driver `pg` e adaptador Drizzle `node-postgres`; esquema `pg-core`, booleanos nativos e datas com fuso horário.
- Migration inicial PostgreSQL separada em `server/db/migrations-postgresql`, já incluindo exclusão lógica. O gerador e o migrator apontam somente para essa pasta. As migrations MySQL ficam preservadas como histórico; não representam transferência automática dos dados.
- Consultas de limites de login usam `ON CONFLICT`, `CASE` e contagem atômica. Violação de unicidade usa código PostgreSQL `23505`, inclusive quando encapsulada pelo Drizzle. Transações mantêm proteção do último administrador ativo.
- Configuração de conexão compartilhada entre aplicação, migrations e comando de administrador; pool de três conexões por instância, timeout e integração com `attachDatabasePool` na Vercel.
- Conexões remotas exigem TLS com validação do certificado; `NUXT_DATABASE_CA` permite fornecer CA PEM. Opções TLS da URI são removidas para não desativar validação. Somente loopback local dispensa TLS.
- CI usa PostgreSQL 17 com imagem fixada por digest e credenciais descartáveis; testes de integração recusam destinos remotos.
- O MySQL e seus dados locais anteriores foram preservados.

## Produção e segredos

O endereço fornecido pelo usuário é JDBC e não contém senha utilizável nesta sessão. Obter no console Aiven a URI de aplicação `postgresql://`, armazená-la diretamente como `NUXT_DATABASE_URL` de Production no gerenciador Vercel e configurar a CA PEM como `NUXT_DATABASE_CA`, se exigida. Não publicar usuário, senha ou URI em documentação, logs ou chat.

Gerar `NUXT_JWT_SECRET` exclusivo de produção; não reutilizar credenciais de teste. Aplicar migrations e provisionar o administrador explicitamente pelos scripts existentes em executor seguro autorizado a acessar o Aiven. Não há migration automática na inicialização. Preview não deve usar banco de produção.

A conexão Vercel apresentou 403 para logs e acesso autenticado na etapa anterior. Acesso ao novo projeto/equipe deve ser autorizado para validar o fluxo remoto. Não foram executadas migrations no Aiven nesta implementação.

## Validação

- `npm run check`: lint, tipos, 64 testes unitários e build passaram.
- PostgreSQL 17 local isolado, exposto somente em 127.0.0.1:5433. Migration aplicada e reaplicada sem erro.
- Seis testes de integração passaram: API e cookies, permissões, criação/edição/exclusão, revogação, navegação desktop/mobile, limite de login e provisionamento seguro do administrador.
- Janela expirada e contagem atômica de 20 tentativas concorrentes validadas no PostgreSQL local. Lint repetido após o novo teste passou.
- Conexão Aiven, migração dos dados antigos e login remoto ainda não foram validados.

## Publicação

Chave `NUXT_JWT_SECRET` gerada aleatoriamente e salva como variável sensível somente em Production no projeto Vercel, sem exibição do valor. Deploy `dpl_HJfjvebKd9Cs5cdPvLJ4ESBsBuh8` solicitado com os arquivos locais e essa configuração. URI PostgreSQL e eventual CA ainda dependem de configuração segura do Aiven; nenhuma credencial de banco remoto foi recebida ou usada.

Deploy concluído em produção com estado READY e alias https://grand-cru-iota.vercel.app. O build remoto levou aproximadamente 42 segundos. Isso valida a publicação do código, não a conexão Aiven nem login remoto.

## Conexão Aiven e provisionamento — 15/10/2026

O usuário informou as variáveis configuradas. A listagem sem descriptografia confirmou `NUXT_DATABASE_URL`, `NUXT_DATABASE_CA` e `NUXT_JWT_SECRET` como segredos restritos a Production. Nenhum valor foi lido ou copiado para o executor local.

A publicação pontual `dpl_DrudBfoPFP1jzNQY3Laao5cuLHS2` usou um `vercel.json` enviado em memória com `npm run db:migrate && npm run build` e concluiu READY. Isso comprova a execução bem-sucedida do migrator com a configuração de produção. O arquivo local permanece com `npm run build`; migrations não foram adicionadas à inicialização.

O usuário também configurou as duas variáveis de provisionamento `GRAND_CRU_ADMIN_LOGIN` e `GRAND_CRU_ADMIN_PASSWORD`, verificadas somente pelos nomes e ambiente. A publicação pontual `dpl_DviU492V8Q9qDdKBStGaSLGc1k7Y` executa migrations, criação do administrador e build. A conta deve ser validada pelo usuário com sua própria senha; a sessão não tem acesso aos valores. Remover as variáveis de provisionamento após sucesso.

A consulta de logs com escopo explícito continua retornando 403. A confirmação de comandos pontuais depende de sucesso do deployment, com encadeamento por `&&`.

O provisionamento do administrador falhou antes do build, com erro de validação `too_small`. Nenhum valor secreto foi exposto. É necessário corrigir os campos de administrador conforme o contrato (`login` e senha) antes de repetir. A publicação anterior com migrations permanece válida.

Após correção das variáveis informada pelo usuário, o provisionamento foi repetido em `dpl_2c4hyCa1RDdm5LNoSC8TWj9EhDDF`. Resultado ERROR com `BUILD_UTILS_SPAWN_1` e saída 1 do encadeamento; a resposta não identifica se houve falha de migration, criação da conta ou build. Não é possível confirmar criação do administrador. A consulta de logs permanece bloqueada por escopo da conexão; solicitar trecho sanitizado do painel, sem segredos. Publicação normal solicitada novamente a partir de `dpl_HJfjvebKd9Cs5cdPvLJ4ESBsBuh8`, que não contém provisionamento no build.

## Recuperação da senha do administrador

O usuário confirmou que a senha tentada foi alterada nas variáveis após a conta já existir. O provisionamento original não sobrescreve contas. Foi implementado um comando separado `user:reset-admin-password`, para uso explícito com o login e a senha definidos nas variáveis seguras. Exige administrador ativo existente, preserva perfil e dados, usa o repositório transacional existente para atualizar somente o hash e revogar sessões, e verifica a senha contra o hash persistido antes de declarar sucesso. Não há endpoint público de recuperação nem redefinição automática ao iniciar a aplicação.

Foram adicionados testes unitários para limites e proteção das contas e teste PostgreSQL local para senha anterior recusada, nova senha aceita e incremento de versão da sessão. Nenhuma credencial de produção foi lida.

Validação da recuperação: `npm run check` passou com 71 testes unitários; sete testes de integração PostgreSQL local passaram. A primeira tentativa de integração encontrou servidor desligado e foi interrompida; após iniciar Nuxt, a suíte completa passou. Deploy pontual `dpl_AGFhFKXdxMLkbbArfSxw2KPLTyk4` solicitado com `npm run user:reset-admin-password && npm run build`. O arquivo local e a publicação final usarão somente o build normal. As variáveis foram conferidas por nome e escopo, sem descriptografia.

A execução de recuperação `dpl_AGFhFKXdxMLkbbArfSxw2KPLTyk4` falhou com validação `too_small` antes de atualizar o banco. Foi solicitado corrigir os valores de Production; não declarar senha redefinida. Publicação normal sem execução de recuperação solicitada em seguida.

Após o usuário salvar os valores corrigidos, a recuperação foi repetida em `dpl_8kzEeNWpqeQJqYPm9KExzqxAsvSL`, concluída READY. O comando encadeado exige que a senha seja atualizada e verificada contra o hash persistido antes de construir a aplicação. Sessões anteriores foram revogadas. Publicação normal solicitada em seguida a partir de `dpl_yhLu9SRMFsB5sBxW3t29UjtpgQWY`, sem recuperação no build. O login HTTP remoto ainda depende de verificação pelo usuário; não houve leitura de segredos.
