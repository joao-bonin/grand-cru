# Contexto e limites do planejamento

Data: 16/10/2026. Status: proposta de decomposição; não autoriza Execute.

Atualização de 19/10/2026: o usuário autorizou implementar a retomada por conjunto e retomar B2B em paralelo. Commit, merge e teste em produção também foram autorizados nesta conversa. A validação real do ERP foi adiada por decisão posterior do usuário. RFC-012/RFC-013 e os registros de execução prevalecem sobre o estado histórico descrito abaixo. A proibição de escrita comercial no ERP permanece.

## Fonte e decisões confirmadas

PRD localizado em origin/work:docs/PRD.md, commit ede01140de4203d83ef393557e8e388723a7a39a. A main não continha esse arquivo. prd-source.md é uma cópia fiel, sem merge ou checkout.

A separação B2B foi adiada pelo usuário. Varejo Fácil foi escolhido como base de integração. Escritas nos dados do ERP estão proibidas, inclusive em homologação. O login tem autorização específica; refresh e logout continuam proibidos. Credenciais não fazem parte destes documentos. Cupons foram consultados com sucesso usando accessToken diretamente em Authorization; outras fontes ainda não foram validadas nesse formato.

## Divergências do PRD

- RF03/RF04 e partes de RF05/RF06/RF07 exigem B2B; nesta etapa usar vendas totais e explicitar essa limitação. Não excluir automaticamente picos sem regra aprovada.
- RF01 pressupõe arquivos; proposta é primeira carga pela API GET. Adaptador de arquivos só será detalhado se uma fonte realmente o exigir.
- RF09/CA13 e o piloto exigem pedido aceito no destino; a etapa local só prepara rascunhos. Não chamar isso de conclusão do MVP original.
- Janela de 60 dias no PRD versus 90 sugerida na conversa: nenhuma está aprovada. Segurança em unidades (S) não é o mesmo parâmetro que os 7 dias sugeridos anteriormente.
- A fórmula do PRD e o exemplo com B2B não devem ser copiados como regra aprovada. O exemplo sem B2B em spec.md é uma proposta de teste: bruto 7, arredondado 12.

## Bloqueios antes de implementar partes dependentes

| Gate | Decisão ou evidência | Tarefas dependentes |
| --- | --- | --- |
| G1 | Mapear loja/locais, reservas/bloqueios, devoluções, compras pendentes, datas e histórico com leituras e amostras; marcar ausências explicitamente | T4–T11, T19–T23 |
| G2 | Aprovar janela de consumo, L/R/S/M, unidade-base, devoluções, datas e fórmula sem B2B; definir limites válidos dos parâmetros | T15–T23, T30 |
| G3 | Aprovar quem pode sincronizar, alterar parâmetros e confirmar rascunhos; proposta admin altera e user consulta | T12, T17, T23, T31, T33 |
| G4 | Fechar TDD: esquema, migrations, duração/retomada, retenção, escopo de lojas e limites operacionais; agendamento fica condicional | T8 em diante; agendamento futuro |
| G5 | Contrato de arquivo e nova autorização explícita para qualquer efeito no ERP | US10/US11 e piloto real |

As pendências não impedem criar histórias e subtarefas, mas impedem tratar o plano como implementação pronta. Não criar defaults silenciosos para satisfazer uma validação estrutural.

## Dimensões implícitas

| Dimensão | Tratamento no plano |
| --- | --- |
| Validação e limites | US03; G1/G2 definem valores de negócio; T2 limita origem/rotas |
| Falha parcial | US02 mantém snapshot anterior; US08 salva grupos em transação local |
| Idempotência | US02 identidade fonte/item; US08 chave de rodada |
| Autenticação e limites | Sessão interna existente, permissões G3, token ERP só no servidor; 401 interrompe |
| Concorrência | Lock por origem e versão otimista nas rodadas |
| Ciclo de vida | Preservar rascunhos e auditoria; política de retenção G4, sem purge automático |
| Observabilidade | Estado por recurso, última atualização e erro sem segredos |
| Dependência externa | Timeout/429/5xx tratados no adaptador e testados com mocks |
| Transições | Rascunho local não se torna confirmado no destino; emissão bloqueada |

## Estado atual reaproveitável

Nuxt/Vue/Nuxt UI; auth JWT e perfis admin/user; PostgreSQL/Drizzle; AppShell; Vitest/Vue Test Utils; Playwright e CI PostgreSQL. Não há implementação do comprador virtual. Nenhum teste do produto foi executado para elaborar este plano.

## Cobertura do PRD e diferenças de aceite

| PRD | Histórias | Tratamento |
| --- | --- | --- |
| RF01 | US01, US02 | Ingestão proposta por API; arquivos condicionais a necessidade real |
| RF02 | US03 | Identidade, conversão e parâmetros locais |
| RF03, RF04 | US12 | Adiados por decisão explícita |
| RF05 | US04, US05, US06 | Vendas totais; disponibilidade/indicadores condicionados à qualidade |
| RF06 | US06 | Fórmula sem B2B proposta, aprovação G2 pendente |
| RF07 | US07 | Lista mobile sem filtro de canal nesta etapa |
| RF08 | US08, US09 | Ajustes e confirmação de rascunho local |
| RF09, RF10 | US08–US11 | Preparação local agora; arquivo e conciliação externa condicionais |
| RF11 | US02 | Manual pela API; agendamento pendente G4 |
| RF12 | US11 | Bloqueado pela proibição de escrita |
| RF13 | US12 | Evolução futura |
| RF14 | US13 | Evolução futura |
| RF15 | US14 | Evolução futura |
| RF16 | US15 | Evolução futura |
| RF17 | US16 | Evolução futura |

| Critério original | História | Estado no planejamento |
| --- | --- | --- |
| CA01 | US02 | Adaptado: repetir carga API em vez de arquivo |
| CA02 | US01, US02 | Mantido: inconsistência e versão válida anterior |
| CA03 | US03, US12 | Identidade agora; canal adiado |
| CA04 | US12 | Adiado; vendas totais podem incluir eventos excepcionais |
| CA05 | US04, US07 | Adaptado: janelas totais, sem canal |
| CA06 | US05, US12 | Reservas não duplicadas agora; compromisso B2B adiado |
| CA07 | US05, US06 | Mantido, depende de validar compras pendentes |
| CA08 | US05, US06 | Mantido: projeção temporal |
| CA09 | US06, US12 | Exemplo original preservado em fonte; cenário sem B2B é outro teste, não prova o original |
| CA10 | US03, US06, US07 | Mantido: limitação e origem dos parâmetros |
| CA11 | US03, US08 | Mantido: ajuste, conversão e sugestão original |
| CA12 | US08, US10 | Grupos locais agora; geração de pedidos no formato do destino condicional |
| CA13 | US10, US11 | Bloqueado: aceitação/importação no destino não autorizada |
| CA14 | US08, US10 | Idempotência de rascunho agora; download condicionado à exportação |
| CA15 | US09, US10, US11 | Recuperação local e erro visível; falha por exportação/envio ainda condicional |
| CA16 | US05, US09, US10 | Pendência local não conta como entrada confirmada |
| CA17 | US05, US10 | Origem/identidade preservadas; vínculo local–externo condicionado à etapa futura |
| CA18 | US08, US09 | Mantido: trilha da decisão |
| CA19 | US02 | Falhas manuais agora; agendamento após G4 |
| CA20 | US13 | Evolução financeira |
| CA21 | US14 | Evolução de caixa |
| CA22 | US16 | Evolução de pipeline |
| CA23 | US12, US16 | Evolução; não gerar demanda por oportunidade incompleta |
| CA24 | US15 | Evolução de CRM |
| CA25 | US14 | Evolução de simulação |

Seções transversais: acesso e auditoria (§11) em US02/US08/US09; medição de tempo e redução proposta de 50% (§12) dependem de linha de base real, sem promessa de resultado. Compra real do piloto (§12/§13) bloqueada por G5. LLM é requisito anterior das RFCs, não está detalhado no PRD v1.0: permanece backlog separado, sem inventar histórias técnicas nesta decomposição.

## Refinamentos condicionais da entrada e operação

- RF01: se uma fonte não estiver acessível por API, obter layout oficial, especificar validação/deduplicação de arquivo e planejar adaptador de entrada; não inventar CSV genérico.
- RF11: após G4, definir frequência e política de autenticação, detalhar ponto de entrada do agendamento e reutilizar o caso de uso de sincronização. Não habilitar cron ou refresh nesta etapa.

## Verificação do planejamento

validate_spec.py --strict e validate_tasks.py --strict: zero erros e avisos. Esta evidência comprova estrutura do planejamento, não funcionamento do produto ou validade dos defaults propostos. A revisão encontrou 35 tarefas candidatas em seis fases, todas com requisito, dependência, testes e gate. Histórias condicionais têm subtarefas de refinamento e ainda exigem decomposição de implementação quando forem priorizadas.

## Execução local e limites

Implementação autorizada pelo usuário com subagentes paralelos, sem aprovações humanas intermediárias. As entregas locais foram testadas com fixtures e banco descartável. Os bloqueios G1 e G5 não foram descartados: semântica das fontes e emissão real não estão validadas. G2 não foi resolvido por escolher60/90 dias: políticas são explícitas, sem default. G3 foi implementado conservadoramente com admin para alteração e user para consulta. G4 usa design.md e migrations explícitas, sem agendamento. Publicação continua por snapshot completo em transação; em 19/10 foram adicionados checkpoints por conjunto completo para retomada, sem publicação parcial. A autorização posterior de merge e verificação em produção está registrada na RFC-012.
