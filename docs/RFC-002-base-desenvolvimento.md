# RFC-002 — Base de desenvolvimento e qualidade

- **Status:** base implementada e validada neste ambiente; publicação e validação no GitHub pendentes.
- **Relacionada:** [RFC-001](RFC-001-mvp-grand-cru.md).

## Contexto e decisões

Esta RFC registra a etapa inicial. A evolução posterior de autenticação, Nuxt UI, MySQL e testes de integração está na [RFC-004](RFC-004-autenticacao-autorizacao.md); os cinco testes descritos abaixo eram o total daquela etapa.

O usuário autorizou iniciar o projeto e instalar suas dependências, preservando os documentos existentes. Após esclarecer a diferença entre Next.js, NestJS e Nuxt, confirmou Nuxt com Vue para reunir interface e rotas de servidor no mesmo projeto.

TypeScript foi solicitado explicitamente. Testes unitários são obrigatórios para cada funcionalidade nova ou correção e fazem parte do critério de aceite registrado no `AGENTS.md`.

## Base preparada

- Node.js 24.19.0 e npm 11.9.0 já estavam disponíveis; não foi necessário reinstalar o runtime.
- Nuxt 4.6.1, Vue 3 e Vue Router foram instalados, com versões exatas e lockfile registrados no Git quando os arquivos forem commitados.
- TypeScript está configurado em modo estrito; `vue-tsc` valida os tipos.
- ESLint realiza a análise estática.
- Vitest, Vue Test Utils e Happy DOM executam os testes unitários; V8 gera o relatório de cobertura.
- As versões exatas das dependências estão em `package.json` e `package-lock.json`.

Nuxt UI e Apache ECharts permanecem recomendações da RFC-001, sem instalação nesta etapa. MySQL, JWT, ERP, LLM e dashboards ainda não foram implementados.

## Páginas iniciais

- `/`: apresentação do projeto e indicação de que a integração e os indicadores ainda não foram implementados.
- `/hello-world`: página solicitada pelo usuário, com o título “Hello World” e navegação de retorno ao início.
- Layout responsivo inicial, sem métricas ou dados fictícios de negócio.

## Instalação e operação

Use o checkout existente em `/workspace/grand-cru`, sem criar worktrees por padrão. O ambiente de nuvem já é isolado.

```bash
cd /workspace/grand-cru
export npm_config_cache=/workspace/.cache/npm
npm ci
npm run dev
```

O cache em `/workspace` é necessário neste ambiente porque o diretório pessoal não permite escrita. Em máquinas com cache pessoal gravável, o comando padrão `npm ci` é suficiente.

Encerre apenas o servidor que você iniciou antes de reinstalar as dependências; reinicie-o depois. O servidor de desenvolvimento usa a porta 3000 por padrão. Processos não devem ser considerados persistentes após publicação ou restauração de um ambiente.

## Verificações e CI

`npm run check` executa lint, análise de tipos, testes unitários e build. `npm run test:coverage` produz um relatório adicional; ainda não há uma meta percentual de cobertura definida.

O workflow `.github/workflows/ci.yml` executa instalação pelo lockfile e `npm run check` em pull requests e pushes na `main`. Seus comandos foram validados localmente; a execução no GitHub, a proteção de branch e a conexão com a Vercel continuam pendentes.

### Evidências da validação local

- Instalação inicial e reinstalação por `npm ci` concluídas.
- Lint e análise de tipos aprovados.
- Duas suítes e cinco testes unitários executados e aprovados.
- Build de produção concluído.
- `/` e `/hello-world` responderam HTTP 200 com os títulos esperados no HTML, tanto em desenvolvimento quanto no servidor do build de produção.
- Após reinstalação e reinicialização, as duas páginas e os cinco testes foram verificados novamente com sucesso.
- O relatório de cobertura foi gerado, sem equivaler a validação das funcionalidades de negócio ainda ausentes.

Não foi realizada validação visual em navegador ou dispositivo móvel; responsividade e usabilidade deverão ser avaliadas durante a implementação do MVP.

## Configuração reutilizável e limites

Os campos `install_script` e `start_skill` foram salvos no rascunho do ambiente. Salvar não publica nem executa essas instruções; revisão, salvamento e publicação pela interface ainda são necessários. A restauração em uma nova tarefa não foi validada.

O domínio `mercado.varejofacil.com` foi adicionado à lista permitida no rascunho. As tentativas de leitura da documentação foram recusadas pelo proxy com HTTP 403 no túnel CONNECT. O contrato da API não foi lido, e o usuário adiou essa etapa.
