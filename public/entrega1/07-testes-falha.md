# Testes de falha — Avaliação 2

Ambiente: `https://avaliacao2-01z.pages.dev/`. Testes realizados em 26/09/2026. URLs de autorização/retorno, códigos, valores de cookies e parâmetros transitórios não são registrados nesta evidência.

## Caso 1 — Retorno sem cookie temporário

- **Preparação:** iniciado login com Google em janela normal. A URL de autorização foi aberta em janela anônima, sem o cookie temporário `__Host-oauth-tx` da janela normal.
- **Pedido enviado:** autorização concluída no Google, com retorno a `/oauth/callback/google` na janela anônima.
- **Resultado esperado:** a rota de retorno recusa a resposta e não cria sessão.
- **Resultado observado:** a rota exibiu “Solicitação inválida.”. Na página inicial da mesma janela anônima apareceu “Nenhuma sessão neste navegador.”. Passou.

## Caso 2 — State alterado

- **Preparação:** iniciado novo login com Google na janela normal; alterado um caractere do parâmetro `state` na URL de autorização, mantendo os demais parâmetros.
- **Pedido enviado:** autorização concluída com o `state` alterado e retorno a `/oauth/callback/google`.
- **Resultado esperado:** o retorno recusa o `state` alterado antes da troca do código.
- **Resultado observado:** o retorno exibiu “Solicitação inválida.”. A captura de conferência não contém a URL transitória. Passou quanto à recusa.

## Caso 3 — Reutilização da transação

- **Preparação:** login com Google concluído normalmente; copiada localmente a URL da requisição de callback na aba Rede, sem guardá-la nesta evidência.
- **Pedido enviado:** a URL de retorno já utilizada foi aberta novamente na mesma janela.
- **Resultado esperado:** a segunda visita é recusada porque a transação já foi consumida.
- **Resultado observado:** a segunda visita exibiu “Solicitação inválida.”. Passou quanto à recusa da repetição.

## Caso 4 — Sessão expirada

- **Preparação:** criada sessão de teste; executado `UPDATE sessions SET expires_at = 0;` no console D1 do banco de laboratório.
- **Pedido enviado:** página inicial recarregada, acionando `/api/me`.
- **Resultado esperado:** `/api/me` responde 401.
- **Resultado observado:** a página exibiu “Nenhuma sessão neste navegador.” e a aba Rede mostrou `/api/me` com status 401. Passou.

## Caso 5 — Origem inválida na saída

- **Preparação:** aberta uma nova sessão válida no site após o caso 4; a aba do site permaneceu aberta.
- **Pedido enviado:** `POST /oauth/logout` iniciado do Console em `https://example.com`, com `credentials: "include"`.
- **Resultado esperado:** a rota recusa o logout e a sessão original continua válida.
- **Resultado observado:** `logout` respondeu 403 na aba de `example.com`; depois, `/api/me` respondeu 200 na aba do site. Passou.

## Caso 6 — Reutilização do cookie revogado

- **Preparação:** em sessão de teste, o valor de `__Host-session` foi copiado temporariamente apenas no computador de teste. Após o logout, o mesmo valor foi restaurado no navegador. A cópia temporária deve ser apagada após o teste.
- **Pedido enviado:** consulta a `/api/me` com o cookie anteriormente revogado.
- **Resultado esperado:** `/api/me` responde 401 porque a sessão foi removida do D1.
- **Resultado observado:** o usuário informou status 401 na consulta após seguir o procedimento. Passou quanto à recusa do cookie revogado. O valor não consta desta evidência.
