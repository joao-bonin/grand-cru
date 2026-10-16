# RFC-004 — Autenticação e autorização de usuários

- **Status:** implementado e validado localmente; configuração e publicação de produção pendentes.
- **Relacionadas:** [RFC-001](RFC-001-mvp-grand-cru.md) e [RFC-002](RFC-002-base-desenvolvimento.md).

A evolução do painel e da exclusão de contas está na [RFC-009](RFC-009-painel-usuarios-internos.md). As contagens de testes descritas nesta RFC registram a etapa original; a versão atual possui 61 testes unitários e cinco de integração.

## Objetivo

Identificar os usuários e controlar o acesso às páginas, aos dados e às operações do Grand Cru. O público inicial é de três usuários; JWT e testes unitários são requisitos confirmados.

## Requisitos confirmados

- Utilizar JWT para autenticação.
- Restringir dashboards e APIs de negócio a usuários autenticados.
- Implementar com TypeScript no projeto Nuxt existente.
- Incluir testes unitários pertinentes em toda funcionalidade ou correção.
- Registrar decisões e evolução em RFCs.
- Criar usuários com login, senha, status ativo/inativo, data de criação, última atualização e último acesso.
- Disponibilizar telas de login e usuários com componentes Vue e fornecer uma captura da tela de login para avaliação.

## Decisões da implementação inicial

- Login único e senha, conforme solicitado. O login é normalizado para minúsculas, com 3 a 100 caracteres; aceita letras ASCII, números, ponto, hífen, sublinhado e `@`.
- Provisionamento controlado das três contas iniciais; cadastro público não foi solicitado.
- MySQL com Drizzle ORM, Drizzle Kit e driver `mysql2`; migration inicial com `users` e `login_attempts`.
- Senhas com 12 a 128 caracteres na criação ou alteração, armazenadas como hash Argon2id via `@node-rs/argon2`.
- JWT via `jose`, com HS256, emissor e audiência fixos, expiração de uma hora, identidade e versão de sessão.
- Chave JWT de pelo menos 32 bytes; ausência de configuração não utiliza chave padrão ou autenticação fictícia.
- Cookie HttpOnly e SameSite Strict, com Secure em produção; tokens não são enviados no JSON nem armazenados em localStorage.
- Operações POST/PATCH verificam Origin e recusam requisições cross-site; o frontend usa chamadas da mesma origem.
- Cada requisição autenticada consulta o usuário no banco, verificando status e versão da sessão.
- Logout revoga todas as sessões da conta. Alteração de login, senha, status ou perfil também incrementa a versão e invalida os JWTs antigos.
- Respostas de autenticação e usuários usam `Cache-Control: no-store`; hashes e controles internos de sessão não são expostos pela API.
- Mensagem de login inválido uniforme para conta inexistente, inativa ou senha incorreta; contas inexistentes também passam por verificação de hash.
- Limite persistido em MySQL: até dez tentativas em quinze minutos por login e por IP observado pelo servidor, contando tentativas válidas e inválidas. Não se confia em um `X-Forwarded-For` arbitrário; o tratamento do proxy da hospedagem deve ser validado antes da produção.

Os perfis `admin` e `user` são a escolha inicial de implementação para atender à autorização solicitada. Não foram definidos perfis mais específicos pelos stakeholders: administradores gerenciam contas, e usuários comuns acessam as páginas de negócio. As APIs verificam as permissões, independentemente da proteção de páginas no frontend. Retornam 401 para sessão ausente/inválida e 403 para falta de permissão. Uma transação impede inativar ou rebaixar o último administrador ativo.

## Modelo de usuários

| Campo | Finalidade |
| --- | --- |
| `id` | Identificador UUID. |
| `login` | Identificação única para entrar. |
| `password_hash` | Hash Argon2id; nunca a senha original. |
| `active` | Status ativo ou inativo. |
| `role` | Perfil `admin` ou `user`. |
| `token_version` | Controle interno de revogação de sessões. |
| `created_at` | Data de criação. |
| `updated_at` | Data da última alteração da conta. |
| `last_access_at` | Último login bem-sucedido; nulo antes do primeiro acesso. |

O login atualiza o último acesso sem alterar a data de atualização cadastral. As APIs serializam as datas em UTC; a tela de usuários as apresenta no fuso America/Sao_Paulo.

## Telas e endpoints

- `/login`: formulário com login, senha, alternância de visibilidade, estado de envio e mensagens de erro; layout mobile e desktop usando Nuxt UI.
- `/`: entrada protegida; administrador tem acesso à gestão de usuários, e todos podem sair.
- `/users`: administração de contas, com criação, edição, senha opcional na edição, perfil, status e datas. Alterar a própria conta exige novo login.
- `/hello-world`: demonstração pública sem dados de negócio.
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, somente administrador.

## Provisionamento e ambiente local

A primeira conta é criada pelo comando `npm run user:create-admin`, usando `GRAND_CRU_ADMIN_LOGIN` e `GRAND_CRU_ADMIN_PASSWORD` fornecidos de forma segura. O comando recusa um login existente e não redefine sua senha. Não foi deixada uma conta permanente ou uma senha padrão para acesso.

O ambiente de desenvolvimento utiliza MySQL 8.4 em Docker, exposto somente no loopback na porta 3307. Dados e configuração local são retidos em `/workspace/grand-cru-local`; `.env` é ignorado pelo Git. As credenciais locais de banco e a chave JWT foram geradas para desenvolvimento e não exibidas. O serviço e as credenciais de produção continuam pendentes.

## Pendências para a evolução

- Provisionar as contas reais e validar se os dois perfis iniciais atendem aos requisitos funcionais dos stakeholders.
- Definir recuperação de senha e eventual renovação automática; ainda não há fluxo de recuperação nem refresh token. Após uma hora é necessário novo login.
- Escolher o serviço MySQL de produção, conexões e TLS; configurar `NUXT_DATABASE_URL` e `NUXT_JWT_SECRET` no gerenciador seguro da hospedagem.
- Validar o IP observado atrás do proxy da Vercel e, se necessário, adaptar o limite usando somente cabeçalhos confiáveis da plataforma.
- Definir operação, backups, retenção dos contadores de tentativas e fluxo de aplicação de migrations em produção.

## Validação realizada

- Lint, análise de tipos, build e 41 testes unitários em seis suítes aprovados.
- Quatro testes de integração aprovados com MySQL real e Chromium: APIs e permissões; login e navegação no navegador, incluindo layout mobile; limite de tentativas persistido; provisionamento inicial sem sobrescrever conta existente.
- Foram verificadas contas inativas, senhas inválidas, cookies HttpOnly/SameSite, respostas 401/403/409/429, datas, ausência de hash no JSON, revogação no logout e alteração de conta, e proteção do último administrador ativo no banco local inicialmente vazio.
- A migration inicial foi aplicada duas vezes sem recriar tabelas.
- As contas temporárias usadas nos testes foram removidas ao final.
- O build de produção foi iniciado localmente e validado com MySQL real: tela de login, autenticação, cookie Secure/HttpOnly, sessão, autorização e revogação no logout.
- Capturas reais do Chromium para avaliação: [desktop](screenshots/login-desktop.png) e [mobile](screenshots/login-mobile.png), sem rolagem horizontal nos tamanhos verificados.

O workflow do GitHub ainda não foi executado remotamente; a implantação na Vercel e a restauração em uma nova tarefa não foram validadas. Esta implementação local não representa publicação em produção.
