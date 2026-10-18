# RFC-014 — Ajuda contextual na seleção de produtos

## Pedido confirmado em 18/10/2026

O usuário tentou marcar produtos e encontrou a seleção desabilitada. Pediu um
informativo dentro do sistema detalhando o que precisa ser preenchido. Definiu
um ponto de interrogação junto ao checkbox: tocar nele deve abrir a orientação,
mantendo o checkbox desabilitado enquanto existirem bloqueios.

## Diagnóstico

A integração atual marca cobertura do histórico de vendas e conciliação de
devoluções como não comprovadas. Reservas e bloqueios do estoque também são
desconhecidos. Essas limitações impedem a sugestão automática e não são
resolvidas apenas preenchendo cadastros ou parâmetros. Há, separadamente,
pendências de cadastro no ERP e de configuração local no Grand Cru. O texto
deve distinguir as três origens e evitar prometer liberação após um simples
preenchimento.

## Implementação

- Ponto de interrogação acionável por toque, mouse ou teclado ao lado da seleção
  desabilitada. A ajuda fica fechada inicialmente e não depende de hover.
- Painel contextual com nome acessível, estado aberto/fechado, associações únicas
  por produto e fechamento pelo acionador, botão Fechar, Escape ou toque fora.
- **ERP:** indica fornecedor, unidade e embalagem conhecidos como ausentes.
  Quando um aviso agregado não identifica um campo, pede conferência sem
  afirmar qual campo está faltando. Orienta atualização após a correção.
- **Grand Cru:** detalha janela de consumo, prazo do fornecedor, intervalo de
  revisão, segurança, mínimo, embalagem e fornecedor. Informa que custo é
  opcional. Oferece atalho ao editor existente, com as permissões já aplicadas.
- **Integração:** identifica os motivos conhecidos e encaminha a validação à
  equipe responsável, sem pedir ao usuário campos que não existem no formulário.
- Quantidade zero e carregamento recebem mensagens próprias, sem apresentar
  pendências fictícias. Códigos técnicos desconhecidos e metadados internos
  não são apresentados como campos a preencher.

Nenhum cálculo, requisito de liberação, permissão ou contrato de ERP foi
relaxado. Não há preenchimento automático, edição do ERP ou envio de pedidos.
No desktop o painel tem largura limitada à área do cartão e rolagem quando o
texto é longo. No celular ele se expande no fluxo da página, com rolagem natural
e sem ficar cortado pela altura da janela.

## Validação

Testes unitários direcionados aprovados para separação de origens, campos
conhecidos, custo opcional, ausência de códigos internos, controle por toque,
teclado/Escape, fechamento externo, atalho de configuração e bloqueios
preservados. Check consolidado aprovado: lint, tipos,429 unitários e build.

O executor de design validou o painel em Chromium com fixtures sintéticas:
alvo de toque 44px, foco visível, Escape e ausência de corte horizontal. A revisão
encontrou conteúdo vertical fora da janela no celular; o painel foi ajustado
para expandir no fluxo em telas de até 600px. Nova conferência em Chromium
aprovou o conteúdo em fluxo, botão Fechar alcançável e retorno de foco.
Não houve consulta ao banco ou ao ERP reais. A publicação segue o fluxo da RFC-017.
