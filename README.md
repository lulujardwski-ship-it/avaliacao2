# Laboratório de autenticação (Avaliação 2)

Projeto para Cloudflare Pages com Google OpenID Connect, GitHub OAuth, PKCE S256 e sessões D1. Não contém credenciais. O conteúdo em `public/` é acessível por URL; somente as rotas de API consultam a sessão.

## Publicação

1. Crie um repositório GitHub com `main` e envie **o conteúdo desta pasta** para a raiz. `public/` e `functions/` devem ficar lado a lado.
2. No Cloudflare Pages, conecte o repositório via GitHub. Escolha framework `None`, build command vazio, output directory `public` e root directory vazio. Teste `/api/health` na URL de produção.
3. Crie o banco D1 e execute `schema.sql` no console. Adicione ao Pages um binding D1 chamado `DB` e faça uma nova implantação.
4. No Google Cloud, registre um cliente OAuth Web com callback `https://SEU-PROJETO.pages.dev/oauth/callback/google`. Configure a tela de consentimento em teste e inclua sua conta como usuária de teste.
5. No GitHub, registre uma OAuth App com Homepage URL `https://SEU-PROJETO.pages.dev` e callback `https://SEU-PROJETO.pages.dev/oauth/callback/github`. Deixe Device Flow desativado.
6. No Pages, defina `PUBLIC_BASE_URL` (URL de produção sem barra final), `GOOGLE_CLIENT_ID` e `GITHUB_CLIENT_ID` como variáveis; `GOOGLE_CLIENT_SECRET` e `GITHUB_CLIENT_SECRET` como **segredos criptografados**. Reimplante.
7. Teste ambos os logins e o logout na URL de produção, além dos seis casos de falha do PDF. Não inclua valores transitórios em logs ou evidências.

Não crie `package.json`, `package-lock.json`, `node_modules` ou `wrangler.jsonc` neste projeto. Não coloque credenciais no repositório.

## Evidências

Depois dos testes reais, coloque **exatamente os oito arquivos pedidos** em `public/entrega1/` e confirme o acesso a cada URL publicada. São `01-pages-configuracao.pdf`, `02-google-retorno.txt`, `03-github-retorno.txt`, `04-d1-esquema.txt`, `05-inicio-login-google.pdf`, `06-inicio-login-github.pdf`, `07-testes-falha.md` e `08-aceitacao.md`.

Revise cada PDF e texto: a pasta será pública. Remova valores de cookies, códigos, tokens, `state`, `nonce`, `code_challenge`, segredos e identificadores privados da conta. Registre somente testes observados; não marque como executado um teste ainda pendente.

## Arquitetura

- `GET /oauth/login/{google|github}` cria transação temporária D1 e cookie `__Host-oauth-tx`.
- `GET /oauth/callback/{google|github}` consome a transação uma vez, valida a identidade e cria sessão opaca de oito horas.
- `GET /api/me` lê o resumo do cookie de sessão no D1 e devolve perfil mínimo.
- `POST /oauth/logout` exige `Origin` exata e exclui a sessão D1.

O fluxo Google verifica assinatura RS256 via descoberta OIDC e JWKS, além de emissor, audiência, validade e nonce. O fluxo GitHub consulta `/user` e exige revogação da autorização antes da sessão local.
