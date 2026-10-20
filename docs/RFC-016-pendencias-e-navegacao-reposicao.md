# RFC-016 — Pendências simples e navegação para rodadas locais

## Solicitação confirmada

Na página de Reposição publicada, o usuário informou que o link do cabeçalho “Rodadas locais” não funciona e solicitou resumir e explicar os avisos como `PRODUCT_PURCHASE_PARAMETERS_MISSING:<produto>` em linguagem simples. A orientação de entregar com commit, verificações, merge e publicação permanece vigente. A validação real do ERP continua adiada.

## Apresentação das pendências

Um apresentador puro transforma os motivos técnicos em avisos de negócio. A página reúne as ocorrências de parâmetros de compra em um único aviso, contando produtos únicos em vez de exibir centenas de códigos. O mesmo tratamento aparece na justificativa do produto e nas pendências do dashboard.

O aviso orienta conferir fornecedor, unidade de compra e quantidade por embalagem no ERP. Se as informações já existirem, orienta a equipe de integração a verificar sua leitura. Um campo não confirmado pela integração não comprova um cadastro incorreto no ERP. Pendências de período histórico, devoluções, produtos e fornecedores têm explicações próprias. Códigos desconhecidos geram uma orientação genérica, sem desaparecer silenciosamente. Motivos do domínio que já estão em português são preservados.

Esta camada não altera os motivos originais da API, as regras de cálculo nem os bloqueios das sugestões. Nenhuma alteração ou autenticação é feita no ERP.

## Navegação

A reprodução local demonstrou que o endereço do link está correto e o clique funciona com respostas imediatas, histórico vazio e erro, inclusive com milhares de pendências. Quando a consulta do histórico fica pendente, o carregamento aguardado da página impede a apresentação do destino e deixa Reposição na tela sem feedback. A correção apresenta a página de rodadas com estado explícito de carregamento enquanto consulta o histórico, mantendo erro e nova tentativa. A consulta tem espera máxima de 15 segundos e não repete automaticamente, permitindo uma tentativa manual após a falha. Essa evidência comprova a falha sob latência no ambiente local, sem atribuir uma causa específica à sessão de produção do usuário.

## Validação

Testes unitários verificam agrupamento e contagem por produto único, grandes listas, códigos desconhecidos, explicações por categoria e preservação da indisponibilidade das sugestões. O navegador verifica o clique do cabeçalho e os estados de carregamento, vazio, sucesso e erro, em desktop e celular. Dados e usuários são sintéticos, com PostgreSQL local quando necessário. Resultados globais, CI e publicação são conferidos na entrega.
