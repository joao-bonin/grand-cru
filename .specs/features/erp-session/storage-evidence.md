# Cofre da sessão ERP

PASS unitário: 12 testes em `tests/unit/erp-token-cipher.test.ts`, Node 24.19.0. ESLint dos arquivos desta implementação passou.

AES-256-GCM usa nonce aleatório de 12 bytes e identidade autenticada como AAD. A chave exige 32 bytes em base64 canônico. O banco contém apenas ciphertext do par; `expires_at`, `renewed_at` e versão ficam em colunas próprias. Chave diferente, troca da identidade, conteúdo truncado ou adulterado falham com código sanitizado.

O repositório serializa leitura e alteração da mesma identidade por advisory lock transacional. A versão é incrementada no banco. Falha da operação executa rollback e preserva a sessão anterior. Erros SQL e de conexão são sanitizados; códigos de erro do caso de uso são preservados. Nenhuma migration é executada na inicialização da aplicação.

Migration gerada pelo Drizzle: `0002_serious_the_hunter.sql`, criação exclusiva de `erp_sessions` no banco do aplicativo. Não executada em produção.

Integração local aprovada após migration explícita no banco descartável: quatro casos em `tests/integration/erp-session.spec.ts`, com PostgreSQL de loopback e pares sintéticos,4/4 aprovados em3,1s. Verificam ciphertext e datas, versão monotônica, dois pools renovando uma vez, rollback preservando o par anterior e chave/adulteração recusadas antes da operação. Log local: `/tmp/grand-cru-session-storage-integration.log`. Nenhuma consulta ou autenticação no ERP real faz parte desses testes.

Revisão independente apontou que lock de5s era menor que as duas operações de autenticação de até15s. A correção usa35s e acrescenta regressão com renovação simulada de6s e dois pools: a segunda instância recebe o par rotacionado com versão2. Cinco testes de persistência e um fluxo completo com transporte mockado aprovados,6/6 em8,6s. Log: `/tmp/grand-cru-session-persistence-flow.log`.
