# RFC-007 — Integração contínua com GitHub Actions

- **Status:** workflow preparado; validação no runner remoto pendente.
- **Relacionadas:** RFC-002, RFC-004 e RFC-006.

Após a RFC-009, as mesmas etapas passaram a executar 61 testes unitários e cinco de integração, incluindo a gestão completa de usuários. As contagens abaixo registram a etapa inicial da esteira.

## Objetivo

Preparar os primeiros passos da esteira CI/CD, começando pelas verificações no GitHub Actions. O provisionamento da Vercel e o deploy foram adiados pelo usuário.

## Workflow

Arquivo: `.github/workflows/ci.yml`.

- Executa em pull requests, pushes na `main` e acionamento manual.
- Usa permissões mínimas de leitura do conteúdo e cancela execuções anteriores da mesma referência.
- Instala a versão Node.js de `.node-version` e as dependências por `npm ci`, com cache npm.
- Fixa as actions oficiais de checkout e setup-node por SHA, obtido dos respectivos repositórios, e a imagem MySQL por digest verificado.
- Possui dois jobs independentes, limitados a quinze minutos cada.

### Qualidade e build

Executa `npm run check`: lint, análise de tipos, testes unitários e build. Os comandos já foram aprovados localmente com 41 testes unitários.

### Integração MySQL e navegador

- Inicia um serviço MySQL 8.4 descartável, acessível no loopback do runner.
- Usa credenciais de teste explícitas e descartáveis e uma chave JWT de teste; nenhuma delas é credencial de produção ou deve ser reutilizada fora deste job.
- Instala Chromium e suas bibliotecas de sistema pelo Playwright.
- Aplica migrations somente na base de teste.
- Inicia a aplicação e verifica prontidão por `/login` com HTTP 200 e `/api/auth/me` com HTTP 401 antes dos testes.
- Executa os quatro testes de integração existentes: APIs e autorização, navegação e layout mobile, limite de tentativas e provisionamento inicial.
- Inicia a aplicação em um grupo de processos próprio e encerra esse grupo ao final, inclusive em caso de falha.

## Evidências e limites

As suítes de qualidade e integração já foram aprovadas no ambiente local. A definição final do workflow foi aprovada pelo `actionlint` 1.7.7, obtido do release oficial com checksum verificado. O YAML e a sintaxe dos comandos shell também foram validados. A instalação do navegador pelo Playwright, a criação do serviço e o ciclo completo do job no runner ainda exigem uma execução no GitHub.

Não há deploy automático configurado nem uso de credenciais da Vercel. Nenhum commit, push, regra de proteção de branch ou execução remota foi realizado por esta alteração.

## Próximos passos

- Enviar os arquivos ao GitHub e executar o workflow em um pull request.
- Após verificar os jobs, configurar `Qualidade e build` e `Integração MySQL e navegador` como verificações obrigatórias para merge na `main`.
- Retomar o provisionamento da Vercel e decidir o fluxo de deploy após as verificações aprovadas.
