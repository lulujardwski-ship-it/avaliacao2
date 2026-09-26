# Critérios de aceitação — Avaliação 2

Projeto: `https://avaliacao2-01z.pages.dev/`  
Revisão em 26/09/2026. As marcações combinam conferência do código publicado, configuração exibida no painel e testes observados. Itens sem conferência completa permanecem abertos.

- [x] O site é servido pelo endereço pages.dev atribuído à equipe.
- [x] Os arquivos estáticos e as Functions compartilham a mesma origem.
- [x] O projeto foi publicado por integração com GitHub.
- [x] A equipe não instalou nem executou Node.js, npm, npx ou Wrangler para esta entrega.
- [x] Cada provedor usa uma URL de retorno própria e exata.
- [x] Os pedidos de autorização usam código e PKCE S256.
- [x] A Function apresenta o Client Secret correto somente na troca de tokens.
- [x] O retorno recusa uma transação ausente, expirada, alterada ou reutilizada. A expiração é verificada pelo código; ausência, alteração e repetição foram testadas no navegador.
- [x] O `id_token` do Google só produz uma sessão depois da validação criptográfica e semântica, conforme conferência da Function e do fluxo de login.
- [x] O `access_token` do GitHub é usado somente para consultar `/user` e a autorização é revogada antes da criação da sessão, conforme conferência da Function e do fluxo de login.
- [x] O cookie de sessão é opaco, Secure, HttpOnly, SameSite=Strict e não possui Domain.
- [x] O D1 guarda o resumo do cookie, não seu valor bruto.
- [x] `/api/me` devolve somente o perfil necessário.
- [x] O logout confere Origin, remove a sessão e expira o cookie; a tentativa de outra origem recebeu 403 e preservou a sessão.
- [x] Um cookie revogado não restaura a sessão; teste com `/api/me` retornou 401.
- [ ] Tokens e segredos não aparecem no HTML, nas URLs salvas, no armazenamento Web ou nos registros. Código e arquivos de entrega foram conferidos; armazenamento do navegador e registros precisam da conferência final no computador de teste.
- [x] A equipe consegue explicar por que os arquivos estáticos permanecem públicos: o Pages serve `public/` sem consultar a sessão; somente as rotas protegidas fazem essa consulta.
- [ ] As sessões administrativas foram encerradas no computador compartilhado. Conferir ao terminar a entrega.

**Modalidade de entrega informada pelo aluno:** individual  
**Responsável pela conferência e assinatura:** Luiz Henrique Weinert Jardwski
