# RFC-012 — Retomada da sincronização por conjunto completo

Data: 19/10/2026. Implementação local autorizada pelo usuário, com frentes paralelas. A autorização posterior inclui commit, merge e verificação em produção. A validação autenticada das fontes do ERP foi adiada pelo usuário e não é critério demonstrado por esta entrega.

## Problema e comportamento

Uma falha na carga descartava todo o progresso, embora preservasse corretamente o último snapshot publicado. A próxima solicitação precisava consultar novamente todas as fontes. Agora a sincronização persiste conjuntos completos já traduzidos no PostgreSQL do Grand Cru e pode reutilizá-los na próxima solicitação.

Os conjuntos são catálogo (produtos e fornecedores), estoque, vendas (cupons e consulta de devoluções) e compras pendentes. Apenas um conjunto totalmente paginado e traduzido recebe checkpoint. A falha de uma página ou de uma fonte do conjunto obriga reler aquele conjunto desde o início. Isso evita retomar um offset instável sem prova de consistência do ERP. A versão publicada só muda quando todos os conjuntos formam a carga completa em uma transação; rascunhos locais não viram entradas de estoque.

## Recuperação e segurança

- Checkpoints contêm exclusivamente os mesmos campos de negócio traduzidos/minimizados usados nos snapshots. Não persistem respostas brutas, credenciais ou dados pessoais adicionais.
- A retomada exige a mesma loja e credencial, representadas por hash privado no servidor, sem expor o hash no estado público. Uma mudança descarta o progresso anterior.
- O limite técnico de reutilização é de quinze minutos desde o início da carga original. Não renova a validade a cada tentativa. Checkpoints expirados ou com formato desconhecido iniciam nova carga. Esse limite não aprova uma frequência de sincronização nem comprova consistência transacional da fonte.
- O lock de sessão PostgreSQL permanece exclusivo por origem. A morte da conexão libera o lock; a consulta de estado identifica uma execução abandonada e a marca como falha para permitir nova solicitação. Não toma o lock de um trabalhador ativo.
- Autenticação pendente interrompe a leitura e invalida o checkpoint, sem login, refresh ou logout automáticos. O transporte da aplicação continua somente GET em origem e recursos permitidos.
- Sucesso limpa os checkpoints; a próxima atualização começa uma carga nova. Nenhuma publicação parcial é apresentada como versão atual.

## Interface e autorização

A tela apresenta os quatro conjuntos e permite `Retomar atualização` após falha recuperável. Mantém a versão anterior visível e as restrições de sessão, perfil admin, origem da requisição e configuração do servidor. A mesma solicitação local de sincronização escolhe entre retomada e carga nova; nenhuma operação comercial é enviada ao ERP.

O estado retornado ao navegador inclui apenas nomes dos conjuntos concluídos/em consulta e indicação de retomada. Não inclui os dados de checkpoint nem seu escopo privado. Após sucesso todos os conjuntos são apresentados como concluídos, mesmo com checkpoint já removido.

## Persistência e entrega

Migration PostgreSQL aditiva: `checkpoint` JSONB e `current_dataset` em `erp_sync`. Migrations continuam explícitas e não rodam na inicialização. O banco descartável recebeu a migration antes da integração. Uma publicação deve aplicar a migration na conexão do ambiente de destino antes de habilitar a nova sincronização; o transporte externo continua sem escrita no ERP.

O `vercel.json` mantém framework Nuxt e instalação pelo lockfile, deixando a plataforma usar seu build padrão. Isso permite passar explicitamente, somente na publicação autorizada, o comando `npm run db:migrate && npm run build` com as variáveis do destino já injetadas pela Vercel, sem copiar valores sensíveis para este executor. A falha da migration impede disponibilizar essa publicação. Não se habilita migration automática na inicialização nem acesso autenticado ao ERP.

A skill `tlc-spec-driven` citada no plano não está disponível nos catálogos cloud/executor nem nos diretórios locais de skills desta tarefa. Foram preservados critérios explícitos, testes por comportamento, revisão independente e registros de validação, sem alegar execução de ferramentas ausentes.

## Limites mantidos

Retomada não comprova cobertura histórica, devoluções reconciliadas, disponibilidade de estoque ou unidades de recebimentos parciais. Essas ausências continuam bloqueando as recomendações dependentes. Exportação, emissão no ERP, financeiro e Agendor mantêm seus contratos pendentes. Os resultados de testes locais e publicação estão registrados em `validation.md` e no relatório de execução desta entrega.
