# RFC-016 — Base visual e usabilidade do Grand Cru

Data: 18/10/2026. Estado: análise e primeira evolução visual implementadas localmente; publicação e migração de biblioteca não realizadas.

## Pedido e objetivo

O usuário pediu uma análise em paralelo do design system, considerando Material Design com Vue, preservando aproximadamente as cores existentes e melhorando a usabilidade. O objetivo de produto é uma operação de compra enxuta: identificar sugestões disponíveis, entender bloqueios e revisar quantidades sem excesso de informação.

**Confirmado:** Vue/Nuxt, vinho/bordô com neutros claros, prioridade ao celular e dashboard operacional. **A avaliar:** adoção de uma biblioteca Material. O pedido não escolheu Vuetify nem aprovou uma migração completa.

## Diagnóstico da base

A aplicação já utiliza Vue 3, Nuxt 4 e Nuxt UI 4. Os estilos próprios ficam principalmente em `main.css`, `dashboard.css` e `replenishment.css`. A marca e o login usam vinho e títulos serifados; a navegação, os cartões e os formulários já têm uma estrutura aproveitável.

Havia cores repetidas sem papéis semânticos e uma diferença entre o tema Nuxt UI (`rose`) e o vinho usado pelo CSS. Controles de tamanhos menores podiam ficar com área de toque reduzida. Títulos, números e textos auxiliares também variavam entre telas. A navegação tinha uma faixa intermediária de largura em que os quatro destinos voltavam a disputar espaço horizontal.

A quantidade de informação e os bloqueios de reposição são problemas de fluxo e qualidade dos dados. Trocar componentes não valida contratos de estoque, vendas ou devoluções nem libera uma sugestão bloqueada.

## Alternativas e recomendação

| Alternativa | Benefício | Trabalho e risco concretos | Recomendação |
| --- | --- | --- | --- |
| Evoluir Nuxt UI com princípios Material | Unifica cores, hierarquia, estados e toque mantendo os fluxos existentes | Introduzir tokens, ajustar tema e validar composição de CSS/responsividade | Aplicada nesta entrega |
| Migrar para Vuetify | Biblioteca feita para Vue, com tema configurável e padrões de interação por teclado | Substituir botões, campos, selects, alertas, modais e composição de layout; adaptar slots e validações; revalidar SSR, foco, formulários e testes | Possível etapa futura se o produto exigir uma adoção abrangente de Material |
| Adotar Material Web | Componentes Material 3 oficiais e tokens de cores | Biblioteca de Web Components, não de Vue; integração e formulários exigem trabalho próprio; o repositório informa modo de manutenção aguardando mantenedores | Não adotar nesta etapa |

**Escolha técnica local:** aplicar princípios de Material 3 na base existente, sem adicionar dependências. O Grand Cru continua usando Nuxt UI; não foi migrado para Vuetify e não implementa integralmente a especificação Material 3. A paleta é própria, preservada da aplicação, e não foi anunciada como uma paleta tonal gerada oficialmente pelo Material.

## Diretrizes de experiência

| Situação | Diretriz aplicada à experiência |
| --- | --- |
| Abrir a operação | Priorizar poucos indicadores e a próxima ação; manter acesso à equipe já existente |
| Decidir compra | Destacar produto, quantidade sugerida e risco conhecido; detalhes sob demanda |
| Checkbox bloqueado | Explicar o motivo em português e onde resolver: ERP, Grand Cru ou equipe responsável pela integração |
| Ajuda no celular | Botão de ajuda acessível por toque e teclado; painel persistente com fechamento explícito; não depender apenas de hover |
| Detalhes secundários | Divulgação progressiva com `details/summary` ou botão com estado expandido |
| Ausência de dados | Mostrar indisponibilidade e orientação; não converter dado ausente em zero, sucesso ou risco inexistente |
| Dashboard operacional | Números da base completa, definição clara dos totais e data de referência; nenhum gráfico meramente decorativo ou tendência inventada |
| Ação indisponível | Preservar bloqueio e oferecer explicação; mudar a cor não altera as regras do domínio |

Essas são recomendações de design aplicadas ao contexto do Grand Cru. Não representam resultados de pesquisa com compradores nem prova de redução do tempo de compra. A validação do ganho de usabilidade exige uso observado com o comprador.

## Primeira implementação visual

- `app/assets/css/main.css`: escala `wine` compartilhada com o Tailwind/Nuxt UI, preservando o bordô; a definição de papéis globais foi centralizada na nova folha.
- `app/assets/css/design-system.css`: tokens semânticos de marca, superfície, texto, contorno, sucesso, atenção e erro; escala de espaços; raios; tipografia de sistema e área de toque.
- `app/app.config.ts`: cor primária `wine` e padrões de tamanho/arredondamento para botão, input e select, inclusive itens do select.
- `nuxt.config.ts`: registro da folha global após os estilos existentes.

O vinho `#713044` identifica ações e foco; `#572438` reforça ações principais; a lateral permanece vinho escuro. Superfície branca e fundo claro criam hierarquia sem depender de sombras intensas. Bordas de cartões são suaves; controles usam um contorno mais forte.

Títulos operacionais e valores dos indicadores usam a mesma família de sistema, com peso e espaçamento consistentes. A marca e o caráter editorial do login permanecem. Textos de apoio das páginas e rótulos de login ganharam tamanho mais confortável. Números usam algarismos tabulares para facilitar comparação.

Botões Nuxt UI têm no mínimo 44 por 44 pixels CSS e campos pelo menos 44 pixels de altura; formulários que já tinham 48 pixels preservam esse tamanho. A navegação tem itens de 48 pixels de altura, selecionado com borda e peso além de cor, e organiza os destinos em duas colunas nas larguras menores. Foco usa contorno vinho forte em superfícies claras e branco na lateral escura. A transição da navegação respeita redução de movimento.

O alvo de 44 pixels é uma decisão de conforto deste produto. A WCAG 2.2, critério 2.5.8 de nível AA, estabelece 24 por 24 pixels CSS com exceções; não se atribui indevidamente o mínimo de 44 a esse critério.

## Referências primárias consultadas

Pesquisa realizada em 18/10/2026. A política de rede permite os repositórios oficiais no GitHub, então foram lidos os arquivos-fonte da documentação abaixo. Não se presume que páginas externas não acessadas tenham sido verificadas.

1. [Material Web — papéis e tokens de cor](https://github.com/material-components/material-web/blob/main/docs/theming/color.md): cor comunica hierarquia, estado e marca; papéis de superfície e conteúdo associados.
2. [Material Web — estado do projeto](https://github.com/material-components/material-web): biblioteca Material 3 de Web Components e aviso de modo de manutenção.
3. [Vuetify — configuração de tema](https://github.com/vuetifyjs/vuetify/blob/master/packages/docs/src/pages/en/features/theme.md): configuração de superfícies, cores e contextos de tema.
4. [Vuetify — acessibilidade](https://github.com/vuetifyjs/vuetify/blob/master/packages/docs/src/pages/en/features/accessibility.md): atributos de ativação, foco e navegação por teclado. A biblioteca não dispensa validação da aplicação.
5. [W3C — Target Size (Minimum), WCAG 2.2](https://github.com/w3c/wcag/blob/main/understanding/22/target-size-minimum.html): tamanho e distância entre alvos.
6. [W3C — Contrast (Minimum)](https://github.com/w3c/wcag/blob/main/understanding/20/contrast-minimum.html): contraste para leitura, incluindo 4,5:1 para texto comum e exceção de 3:1 para texto grande.
7. [W3C — Focus Not Obscured (Minimum)](https://github.com/w3c/wcag/blob/main/understanding/22/focus-not-obscured-minimum.html): visibilidade de controles focados e cuidado com conteúdo sobreposto.
8. [W3C — Content on Hover or Focus](https://github.com/w3c/wcag/blob/main/understanding/21/content-on-hover-or-focus.html): conteúdo adicional que aparece em hover/foco deve atender condições de fechamento, permanência e acesso pelo ponteiro, quando aplicável.
9. [WAI-ARIA APG — Disclosure](https://github.com/w3c/aria-practices/blob/main/content/patterns/disclosure/disclosure-pattern.html): mostrar e ocultar detalhes com ativação por teclado e estado expandido.
10. [WAI-ARIA APG — Tooltip](https://github.com/w3c/aria-practices/blob/main/content/patterns/tooltip/tooltip-pattern.html): tooltip não recebe foco; conteúdo com elementos focáveis precisa de outro padrão. O próprio documento declara que esse padrão de tooltip está em desenvolvimento, por isso ele não foi tratado como norma final.

## Validação e limites

A verificação desta frente usa Chromium local, APIs interceptadas e fixtures sintéticas. Nenhum acesso ou alteração ao ERP, nem leitura ou escrita de banco de produção, faz parte da revisão visual. A verificação completa do repositório é consolidada pela coordenação após as entregas paralelas.

Resultados observados:

- Login, dashboard, modal de usuário e ajuda da reposição sem rolagem horizontal em 390 pixels; dashboard também em 320, 1024 e 1440 pixels.
- Navegação com 48 pixels de altura; ajuda com 44 por 44 pixels; formulário de usuário com campos e ações de 48 pixels. O botão Sair ficou com pelo menos 44 por 44 pixels.
- Amostras visíveis de títulos, indicadores, textos auxiliares, ações de usuários e orientações excederam 4,5:1 de contraste; o menor resultado amostrado foi 6,85:1. Isso não equivale a auditoria completa de todos os componentes e estados.
- A revisão identificou que a ajuda sobreposta poderia abrir abaixo da janela. A coordenação ajustou o painel para fluxo natural no celular; a reconferência confirmou ausência de corte por ancestrais, fechamento alcançável por rolagem e retorno do foco ao botão de ajuda. Escape também fecha e preserva foco visível com contorno de 3 pixels.
- Dashboard sem sincronização mantém indicadores indisponíveis; zero sugestões com bloqueios orienta a conferir pendências. Ambos passaram na apresentação móvel.
- Nenhum erro JavaScript nem requisição externa no roteiro final. APIs foram simuladas; o contrato real entre API e banco não foi exercitado nesta frente.
- ESLint dos arquivos de configuração e verificação de whitespace passaram. Nenhuma regra funcional nova foi adicionada por esta frente; os testes funcionais e o `npm run check` ficam na consolidação.

Evidências com dados sintéticos: [dashboard no celular](screenshots/design-system-dashboard-mobile.png), [dashboard no desktop](screenshots/design-system-dashboard-desktop.png), [ajuda da reposição](screenshots/design-system-help-mobile.png), [formulário de usuário](screenshots/design-system-user-form-mobile.png), [dashboard sem dados](screenshots/design-system-dashboard-empty-mobile.png) e [dashboard com bloqueios](screenshots/design-system-dashboard-blocked-mobile.png).

Não há afirmação de conformidade integral WCAG nem de melhoria mensurada de produtividade. A próxima avaliação de produto deve observar um comprador encontrando uma sugestão, entendendo um bloqueio, abrindo sua resolução e preparando uma revisão local. Medir conclusão da tarefa, dúvidas e erros antes de ampliar o design system.
