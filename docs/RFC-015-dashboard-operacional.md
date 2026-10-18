# RFC-015 — Dashboard operacional de reposição

- **Status:** requisitos confirmados; implementação local, aguardando validação final e publicação.
- **Decisão do usuário:** criar em paralelo um dashboard com a gestão de usuários existente e indicadores de sugestões de compra. Entre visões operacional e estratégica, escolheu a operacional.
- **Relacionadas:** RFC-001, RFC-005, RFC-008, RFC-013 e RFC-014.

## Objetivo e recorte confirmado

Ajudar o comprador a identificar rapidamente o que comprar, quais dados conferir e quais revisões retomar. A página inicial autenticada passa a se chamar Dashboard. A navegação mantém Reposição, Rodadas locais e, somente para administradores, Usuários.

A tela destaca quatro indicadores, uma lista curta de prioridades e rodadas recentes. A gestão de usuários continua disponível para o administrador com contagem de acessos ativos e atalhos para gerenciar e cadastrar. Usuários consultores veem a operação sem receber a listagem da equipe. As permissões de edição, sincronização e revisão permanecem nas funcionalidades existentes.

## Indicadores e fontes

A nova consulta local `GET /api/dashboard` exige a autenticação existente, envia `Cache-Control: no-store` e lê snapshot, políticas, status de sincronização e rodadas pelo repositório local. Não chama o ERP nem grava dados. O construtor de recomendações continua sendo a fonte única das sugestões; o modelo puro do dashboard agrega o conjunto inteiro antes de limitar listas.

| Indicador | Regra e significado |
| --- | --- |
| Prontos para comprar | Sugestão maior que zero e nenhuma pendência, reutilizando o mesmo predicado de Para comprar. |
| Com pendências | Combinações de produto e loja com ao menos uma pendência. Uma combinação entra uma vez, independentemente da quantidade de problemas. |
| Com ruptura prevista | Combinações com data de ruptura calculada. Não significa ruptura já ocorrida nem prova de ausência de risco nos demais produtos. |
| Risco ainda não calculado | Sem data de ruptura e com dados, política ou cálculo necessários indisponíveis. Exibido junto ao total de rupturas. |
| Rodadas em revisão | Rodadas locais salvas no estado `draft`. Não inclui seleção ainda não salva. |
| Rodadas revisadas | Rodadas locais no estado `reviewed`. Não representa pedido enviado ou recebimento. |

Os totais de produtos usam combinações de produto e loja, como a reposição. Um SKU em duas lojas conta duas vezes; isso é explicado abaixo dos indicadores. Contagens de pendências e risco podem se sobrepor. Ausência de snapshot é exibida como indisponível, sem preencher indicadores de produtos com zero. Uma base sincronizada vazia pode ter zero real. O total de rodadas é independente da existência de snapshot.

Não há estimativa monetária, soma de unidades heterogêneas, duração de revisão, tendências ou alegação de redução de rupturas. Essas medidas exigem dados e definições que ainda não existem.

## Ações e apresentação

- Até cinco sugestões prontas, ordenadas pela ruptura conhecida mais próxima, usando a mesma consulta pura da reposição. Incluem produto, loja, fornecedor, quantidade sugerida e data de risco, quando calculada.
- Atalho para a reposição; a seleção continua na tela existente. O dashboard não cria rodadas nem marca compras.
- Contagens de rodadas em revisão e revisadas, até três rodadas mais recentes com estado, data, quantidade de itens e aviso se usam dados de snapshot anterior. O autor persistido é um identificador técnico e não é exposto no resumo. Atalho para consultar rodadas.
- Data da base em horário de Brasília, atualização explícita do resumo local, avisos de sincronização em andamento ou falha. Datas de ruptura são datas de calendário: o dia é preservado, sem deslocamento por conversão de fuso. O botão Atualizar resumo não executa sincronização no ERP.
- Detalhes sobre interpretação dos indicadores recolhidos por padrão, sem gráficos decorativos ou bibliotecas adicionais.
- Equipe do administrador carrega e falha independentemente dos indicadores operacionais. Links de cadastro e gerenciamento existentes são preservados.

## Estados e acessibilidade

Carregamento tem mensagem e `aria-busy`, sem números provisórios. Erro de leitura esconde os indicadores anteriores e oferece nova tentativa; erros técnicos não são repassados à interface. Ausência de sincronização orienta abrir a reposição. Se não houver sugestões prontas mas existirem pendências, o texto explica que isso não comprova estoque suficiente. O estado vazio das rodadas orienta a preparar a primeira revisão.

O layout usa a paleta vinho e neutros existente e tokens compartilhados quando disponíveis. Indicadores em duas colunas no celular e quatro no desktop; listas e áreas de ação se adaptam à largura, com foco visível, textos legíveis, controles de pelo menos 44 pixels e informação acessível sem hover.

## Limites conhecidos

O mapeamento atual do ERP não comprova cobertura histórica nem conciliação de devoluções e mantém reservas/bloqueios desconhecidos. Isso pode impedir toda sugestão real. O dashboard apresenta pendências e risco desconhecido explicitamente e não tenta contornar essas proteções. Corrigir o cadastro no ERP pode não resolver limitações da integração.

O resumo reflete a base disponível ao consultar ou atualizar a página, sem monitoramento contínuo. A leitura usa as mesmas operações do repositório existente e não cria uma transação que reúna snapshot, políticas e rodadas. A revisão de compra permanece responsável por validar versões antes de salvar.

Nenhum pedido é enviado ao ERP ou fornecedor. Nenhuma migration, escrita de negócio no ERP, alteração de credenciais ou publicação faz parte desta implementação.

## Validação

Testes unitários com dados sintéticos verificam totais globais além de uma página, estados indisponíveis, bloqueios e risco desconhecido, prioridade por ruptura, ordenação sem mutação, estados de rodadas e snapshot anterior. A rota é exercitada com repositório e autenticação simulados, incluindo rejeição de acesso, ausência de snapshot, falha de leitura e cabeçalho de não armazenamento. Componentes e página verificam ações, carregamento, erros, mensagens de limitação e restrição da equipe ao administrador.

Validação direcionada: os 19 testes novos e os seis testes existentes de overview/navegação passaram; lint dos arquivos alterados e `npm run typecheck` passaram. A revisão paralela de design inspecionou a página em Chromium com APIs simuladas nas larguras 320, 390, 1024 e 1440 pixels, sem overflow horizontal. Também verificou no celular os cenários de ausência de snapshot e zero sugestões prontas com pendências, sem erros JavaScript ou chamadas externas. As amostras de contraste de título, indicadores, apoio, rodadas e risco ultrapassaram 4,5:1 (menor amostra medida: 6,85:1).

Esse ensaio verificou a apresentação com dados sintéticos e não comprova a integração com PostgreSQL ou ERP. O check completo é consolidado pelo coordenador da implementação conjunta. As evidências visuais da revisão de design são registradas junto à RFC-016.
