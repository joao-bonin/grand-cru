# RFC-014 — Material Design e contraste da interface

- **Status:** implementação local verificada; entrega e validação em produção acompanhadas separadamente.
- **Relacionadas:** [RFC-005](RFC-005-ddd-clean-code.md), [RFC-015](RFC-015-dashboard-negocio.md).

## Problema confirmado

O usuário relatou texto invisível no login, cinza muito claro em Reposição e ausência da linguagem Material Design solicitada. A reprodução em Chromium com preferência de sistema escura confirmou o primeiro defeito: o Nuxt UI fornecia texto branco, enquanto a regra `.login-form input` fixava fundo branco, produzindo contraste **1:1**. Um teste de navegador falhou nesse campo antes da correção. Ajuda de acesso, rodapés e outros textos secundários também usavam cores claras fixas e tamanhos muito pequenos.

A correção respeita a preferência do dispositivo e a preferência persistida do usuário. Forçar o tema claro não foi a solução adotada.

## Decisões de apresentação

A linguagem Material 3 foi aplicada sobre Vue/Nuxt/Nuxt UI existentes, preservando a identidade vinho e sem adicionar biblioteca de componentes. A interface utiliza:

- Papéis semânticos compartilhados `--md-sys-color-*` para superfícies, texto principal e secundário, ação, texto sobre ação, contorno, erro e sucesso. Os tokens do Nuxt UI apontam para esses papéis.
- Paletas completas para claro e escuro. O botão de tema na barra superior usa o mecanismo persistente de color mode do Nuxt UI; o login também respeita sistema e preferência salva.
- Campos outlined com fundo e texto coordenados, botão principal preenchido, ações secundárias outlined, superfícies tonais, cartões arredondados e navegação com seleção visível.
- Tipografia de interface baseada no sistema, textos secundários ampliados e formulários com texto de 16px. A identidade editorial da marca permanece na área institucional do login.
- Áreas de toque de pelo menos 48px nos botões, navegação, campos e linhas de seleção. Caixas de seleção têm controle de 24px dentro de rótulo com área mínima de 48px.
- Foco com contorno de 3px e afastamento, além de estados de erro, carregamento, desabilitado e senha visível/oculta preservados.

As declarações legadas foram substituídas nos arquivos de estilo, evitando uma segunda camada de cores fixas competindo com o tema.

## Paleta e contrato

| Papel | Claro | Escuro |
| --- | --- | --- |
| Primary | `#713044` | `#ffb1c9` |
| On primary | `#ffffff` | `#4c1028` |
| Surface | `#fff8f8` | `#1a1317` |
| Surface container lowest | `#ffffff` | `#211a1e` |
| On surface | `#271e22` | `#f1e2e8` |
| On surface variant | `#58464e` | `#d6c1ca` |
| Outline | `#86727c` | `#a08b95` |

Os mesmos papéis são consumidos pelo dashboard de negócio. O menu lateral conserva uma superfície vinho com texto principal claro e texto secundário próprio, ambos independentes do fundo das páginas.

## Verificação e evidências

Os testes de aparência usam Chromium real, CSS computado, composição de fundos transparentes e cálculo WCAG de contraste. Cores CSS modernas são convertidas pelo canvas do navegador antes do cálculo. As asserções exigem pelo menos **4,5:1** para todos os textos amostrados, inclusive os grandes. Controles desabilitados são exceção WCAG e não entram nessa exigência.

A regressão do login foi observada antes e depois: **1:1 → 13,63:1** para texto preenchido no tema escuro. Exemplos medidos após a correção:

| Amostra | Claro | Escuro |
| --- | --- | --- |
| Texto do campo de login | 16,22:1 | 13,63:1 |
| Placeholder do campo de login | 8,75:1 | 10,02:1 |
| Texto secundário sobre surface | 8,34:1 | 10,74:1 |
| Texto secundário do menu vinho | 9,74:1 | 9,74:1 |

Cobertura automatizada de apresentação:

- Login em desktop e celular de 390px, nos temas claro/escuro; preferência salva escura com sistema claro e preferência salva clara com sistema escuro.
- Placeholders e valores digitados, senha visível/oculta, foco, estado pendente com controles bloqueados e mensagem de credenciais inválidas.
- Reposição, parâmetros locais, justificativa, histórico e editor de rodada, menu/barra superior, usuários e estados de usuário.
- Dashboard com métricas calculadas e pendentes, histórico parcial, ausência de primeira base e base vazia; filtros sem resultados.
- Ausência de rolagem horizontal nas larguras verificadas; controles móveis de salvar/revisar; troca de tema com persistência e manutenção durante navegação.

Os testes unitários existentes de login, lista, política, histórico e sincronização foram executados sem falhas. A suíte de aparência possui 22 cenários. A verificação completa de integração com PostgreSQL descartável e as checagens globais ficam registradas na entrega final.

As capturas e medições foram geradas em `artifacts/grand-cru-material` no workspace da execução. São **evidências locais com dados sintéticos e APIs da aplicação interceptadas**, identificadas assim nos arquivos JSON. Incluem `before-login-dark.png`, `before-login-dark.json`, `before-test-red.txt`, capturas `login-*`, `replenishment-*`, `purchase-drafts-*`, `users-*`, `dashboard-*` e medições de cores correspondentes. O teste salva artefatos quando `APPEARANCE_ARTIFACT_DIR` é definido.

## Limites

A aparência é testada com fixtures; não representa validação de dados reais nem homologação de contratos do ERP. Nenhum login, renovação, logout, sincronização ou escrita foi feito no ERP. A validação real continua adiada por orientação do usuário. A implementação não altera autenticação, banco ou regras de compra. Verificação do deploy e capturas de produção precisam identificar explicitamente o ambiente e não devem ser confundidas com estas evidências locais.
