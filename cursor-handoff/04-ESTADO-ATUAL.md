# Estado atual em 17/07/2026

- Branch: `main`.
- HEAD: `a3ac9b3` — `Fix: EXPO_PUBLIC_API_URL ignorado no web bundle`.
- Snapshot observado antes deste pacote: 49 entradas no status, sendo 37 arquivos rastreados modificados e 12 caminhos não rastreados.
- As mudanças rastreadas abrangem aproximadamente 1.351 inserções e 740 remoções.
- Não havia indicação de mudanças staged.

## Áreas modificadas

Quase todas as telas mobile, tokens/tema, componentes de cefaleia e convulsão, navegação, shims, Watermelon, CSS web, auth da API, package lock e configuração/deploy. Também existem documentos de contexto e arquivos de entrypoint/deploy ainda não rastreados.

O pacote anterior `claude-handoff/` também está não rastreado e deve ser preservado; ele pode ser usado como documentação complementar, mas este pacote é o ponto de entrada específico do Cursor.

## Histórico recente relevante

Os commits recentes corrigem URL da API no bundle web, CORS, segundo login/onboarding, Netlify/Vercel e variações Docker/Nginx. Isso indica uma área instável: testar autenticação, origem da API e deploy sempre que esses arquivos forem alterados.

## Verificação realizada

`npm run typecheck` passou em 17/07/2026: 7 tarefas bem-sucedidas em mobile, web, API, DB e shared. O resultado veio do cache do Turborepo e deve ser reexecutado depois de novas alterações. E2E não foi executado nesta criação do handoff.

## Protocolo de preservação

Antes de qualquer edição:

1. executar `git status --short`;
2. executar `git diff -- <arquivo-alvo>`;
3. distinguir alteração existente da nova mudança;
4. não reformatar arquivos fora do escopo;
5. não fazer reset, checkout, clean, commit ou push sem pedido explícito.
