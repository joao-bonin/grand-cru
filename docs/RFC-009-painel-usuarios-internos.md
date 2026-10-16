# RFC-009 — Primeiro dashboard e gestão de usuários internos

- **Status:** implementado e validado localmente; contas reais e publicação pendentes.
- **Relacionadas:** RFC-004 (autenticação), RFC-005 (DDD), RFC-007 (CI) e RFC-008 (comprador virtual).

## Decisão e escopo

O usuário aprovou a identidade visual da tela de login, reconhecendo o contexto de loja de vinhos, e solicitou iniciar o dashboard. Em seguida, priorizou uma funcionalidade independente do ERP: cadastro, edição, exclusão e inativação de usuários internos.

Nesta etapa, o dashboard é um painel administrativo de equipe e acessos. Estoque, sugestões de compra, caixa e Agendor permanecem no escopo da RFC-008 para as próximas integrações. Não foram adicionados indicadores fictícios de negócio nem um motor de reposição sem regras aprovadas.

## Funcionalidades entregues

- `/`: painel do administrador com totais de usuários cadastrados, ativos, inativos e administradores ativos, calculados a partir da API de usuários. Exibe cadastros recentes e caminhos para criar e gerenciar contas.
- `/users`: busca por login, filtros combinados por status e perfil, criação e edição em formulário, ativação/inativação e exclusão mediante confirmação.
- A lista exibe perfil, status, criação, atualização e último acesso; quem nunca acessou é identificado explicitamente.
- Administradores têm acesso à gestão. Usuários comuns recebem uma página de entrada sem dados administrativos; as APIs continuam impondo autorização no servidor.
- Layout responsivo com a paleta vinho, creme e tons naturais adotada na tela de login. Módulos futuros aparecem como “Em breve”, sem navegação para funcionalidades inexistentes.

## Exclusão e regras de acesso

Foi adotada exclusão lógica como escolha inicial de implementação: `DELETE /api/users/:id` define `deleted_at`, inativa a conta e revoga seus JWTs. A conta desaparece da lista e deixa de autenticar, enquanto o registro permanece no banco para preservar sua identidade e histórico.

- Somente administrador pode excluir; requisições devem ser da mesma origem.
- A exclusão exige confirmação na interface.
- Conta excluída não pode ser reativada pela edição comum; novo DELETE ou PATCH retorna 404.
- O login continua reservado pela unicidade do cadastro, inclusive após exclusão. Reuso de login, restauração e remoção definitiva não fazem parte desta versão.
- A regra de domínio que preserva ao menos um administrador ativo é aplicada tanto na inativação/rebaixamento quanto na exclusão, dentro de transação com bloqueio de registros.
- Alterar ou excluir a própria conta, quando permitido, exige novo login. Excluir a própria conta também limpa seu cookie.

A nova migration `0001_mysterious_thunderbird.sql` acrescenta apenas a coluna nullable `deleted_at`; preserva os cadastros existentes. Migrations permanecem separadas da inicialização da aplicação.

## Organização do código

- Componentes de apresentação: `AppShell`, `AdminOverview`, `UserMetrics`, `UserDirectory` e o formulário `UserEditor`.
- Consultas e contadores de usuários ficam em funções independentes de Vue, na camada compartilhada de aplicação.
- A invariável do último administrador ativo foi extraída para `server/domain/identity/user-lifecycle.ts`, sem dependência de HTTP ou banco.
- O repositório MySQL protege a operação transacional; o adaptador HTTP traduz os erros de domínio em respostas da API.
- A interface importa os módulos compartilhados pelo alias Nuxt `#shared`, também configurado no Vitest, garantindo resolução consistente no build SSR.

Não foi adicionada uma biblioteca de gráficos nesta entrega: os indicadores da equipe são contadores de dados reais. A biblioteca de gráficos do estoque permanece uma decisão da etapa correspondente.

## Validação

- `npm run check` aprovado: lint, tipos, 61 testes unitários em oito suítes e build de produção.
- Cinco testes de integração aprovados com MySQL real e Chromium. A suíte cobre permissões, revogação de sessão, proteção do último administrador, exclusão lógica, reserva de login e o fluxo completo de cadastro/edição/busca/ativação/inativação/exclusão pelo navegador.
- Cancelar a confirmação de exclusão mantém o usuário; confirmar remove-o da lista.
- Layout mobile verificado sem rolagem horizontal nos tamanhos testados.
- Capturas reais do Chromium: [dashboard desktop](screenshots/dashboard-desktop.png), [dashboard mobile](screenshots/dashboard-mobile.png), [usuários desktop](screenshots/users-desktop.png) e [usuários mobile](screenshots/users-mobile.png).
- As capturas utilizaram três contas temporárias de avaliação persistidas no banco local e removidas ao final. Não foram deixadas contas permanentes ou senhas padrão.

A suíte de integração passou antes do ajuste do alias `#shared`; após o ajuste, lint/tipos/testes unitários/build e a navegação das quatro capturas foram verificados com sucesso. Não houve execução remota do CI ou publicação na Vercel.

## Próximos passos

- Provisionar as contas reais no ambiente seguro e executar o workflow no GitHub.
- Retomar a configuração de produção quando houver acesso à Vercel e ao banco escolhido.
- Após validação do contrato do ERP e dos parâmetros de negócio, iniciar estoque e compras segundo a RFC-008.
