# Grand Cru

Base do MVP em Nuxt e Vue, com TypeScript e prioridade para uso no celular.

## Desenvolvimento

Use Node.js 24.19.0 (definido em `.node-version`) e npm 11.9.0.

```bash
npm ci
npm run dev
```

A tela de login fica em `/login`, a página inicial protegida em `/` e a administração
em `/users` (somente administrador). A demonstração `/hello-world` permanece pública.
O comando de desenvolvimento usa a porta 3000 por padrão.

No ambiente de nuvem, onde o diretório pessoal é somente leitura, use um cache gravável:

```bash
export npm_config_cache=/workspace/.cache/npm
npm ci
npm run dev
```

## Verificações

```bash
npm test                 # testes unitários com Vitest e Vue Test Utils
npm run test:coverage    # relatório de cobertura
npm run lint
npm run typecheck
npm run build
npm run check            # todas as verificações acima, sem cobertura
npm run preview          # inicia o build de produção
```

As verificações de pull requests e da branch `main` estão em `.github/workflows/ci.yml`.
A esteira possui jobs de qualidade/build e integração PostgreSQL/Chromium, além de acionamento manual.
O banco e a chave JWT do job de integração são descartáveis e exclusivos para testes.
A conexão com a Vercel e as regras de proteção da branch ainda precisam ser configuradas.

## Banco e autenticação

Configure `NUXT_DATABASE_URL` e `NUXT_JWT_SECRET` em `.env` ignorado pelo Git para desenvolvimento,
ou no gerenciador seguro da hospedagem. `.env.example` informa somente os nomes.
A chave JWT deve ter pelo menos 32 bytes aleatórios. O PostgreSQL usa migrations Drizzle:

```bash
npm run db:generate       # após alterar o esquema, revisar o SQL gerado
npm run db:migrate        # aplicar migrations pendentes; não roda ao iniciar a aplicação
```

Para a primeira conta, forneça `GRAND_CRU_ADMIN_LOGIN` e `GRAND_CRU_ADMIN_PASSWORD` pelo
ambiente seguro ou pelo `.env` local e execute `npm run user:create-admin`. Use uma senha
de pelo menos 12 caracteres; remova a variável de senha de provisionamento após o uso.
O comando não sobrescreve contas existentes. Não há cadastro público nem uma conta padrão.

O dashboard administrativo usa dados reais do cadastro: totais de usuários, status, perfis
e cadastros recentes. A gestão inclui busca, filtros, edição, ativação/inativação e exclusão
com confirmação. A exclusão encerra o acesso e preserva o registro; o login permanece reservado.

Usuários têm login único, hash Argon2id, status ativo/inativo, perfil, datas de criação e
atualização e último acesso. O JWT dura uma hora, fica em cookie HttpOnly e SameSite Strict
(Secure em produção) e é verificado contra o estado atual da conta. Logout encerra todas
as sessões da conta; alteração de login, senha, status ou perfil também revoga as sessões.
O último administrador ativo não pode ser inativado ou rebaixado.
Ele também não pode ser excluído. O esquema PostgreSQL já inclui `deleted_at`; as migrations MySQL anteriores ficam preservadas como histórico.

O PostgreSQL de teste é isolado e acessível somente no loopback na porta 5433.
As credenciais de teste ficam em `work/`, ignorado pelo Git. Não reutilize em produção.
As migrations PostgreSQL estão em `server/db/migrations-postgresql`; as antigas de MySQL
não são executadas pelo migrator atual e não transferem dados entre os motores.

Para Aiven, configure uma URI `postgresql://` em `NUXT_DATABASE_URL` (não a URI JDBC).
Conexões remotas sempre exigem TLS com validação de certificado. Se necessário, configure
`NUXT_DATABASE_CA` com o conteúdo PEM do certificado CA fornecido pelo Aiven. O cliente
remove opções TLS da URI para impedir que enfraqueçam essa validação. Segredos ficam
somente no gerenciador da Vercel; nunca os envie por chat. Configure produção e preview
separadamente. A migrations e o administrador devem ser provisionados explicitamente.

Os testes de integração exigem servidor de desenvolvimento rodando e PostgreSQL local com
migrations aplicadas. Criam contas temporárias e limpam os próprios dados e os contadores
dos IPs locais; não execute contra uma base de produção.

```bash
# Instale o Chromium do Playwright em máquinas sem navegador disponível:
npx playwright install chromium
npm run test:integration
# Neste ambiente, o Chromium já está instalado:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:integration
```

Para iniciar o build de produção local com as variáveis do `.env`:

```bash
npm run build
HOST=127.0.0.1 PORT=3001 node --env-file=.env .output/server/index.mjs
```

## Escopo atual

Autenticação JWT, autorização, telas de login e usuários e persistência PostgreSQL estão implementadas.
Nuxt UI é a base dos componentes; as fontes são locais ao sistema e os ícones Lucide estão
instalados, evitando requisições externas para renderizar as telas.
Dashboards, integrações com ERP e LLM e sincronização ainda não foram implementados.
Apache ECharts permanece uma proposta para a etapa de gráficos.
Nunca versione credenciais ou arquivos `.env` com valores reais.

Capturas para revisão: [login desktop](docs/screenshots/login-desktop.png) e
[login mobile](docs/screenshots/login-mobile.png).
Também estão disponíveis [dashboard](docs/screenshots/dashboard-desktop.png) e
[gestão de usuários](docs/screenshots/users-desktop.png), capturados com contas temporárias de avaliação.

Consulte [a RFC](docs/RFC-001-mvp-grand-cru.md), [as pendências](TODO.md) e
[as orientações para agentes](AGENTS.md).

## Recuperar senha do administrador

Alterar `GRAND_CRU_ADMIN_PASSWORD` no ambiente não altera contas existentes. Para recuperar
a senha, configure o login da conta e a senha desejada no ambiente seguro e execute
`npm run user:reset-admin-password` explicitamente. O comando exige administrador ativo
existente, altera somente o hash, revoga sessões e verifica o hash persistido. Não cria,
reativa nem promove contas. Remova as variáveis de provisionamento após concluir.
