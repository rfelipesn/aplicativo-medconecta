# MEDconecta — instruções para o Claude Code

Antes de executar qualquer ação, leia integralmente:

@CONTEXTO_ATUAL.md
@PLANO_MEDCONECTA.md

## Regras obrigatórias

- Este repositório possui mudanças locais importantes. Comece sempre com `git status --short` e preserve tudo que já existe.
- Nunca use `git reset --hard`, `git checkout --`, limpeza recursiva ou sobrescrita em massa sem autorização explícita do usuário.
- Não faça commit, push, deploy, migration ou alteração na VPS/Supabase sem que a tarefa atual peça isso.
- Nunca escreva senhas, tokens, chaves, cookies ou conteúdo de `.env` em arquivos, logs ou respostas.
- O Supabase do MEDconecta guarda os dados do produto. O PGLite do GBrain é apenas um índice local do código e não deve ser misturado ao banco médico.
- O produto só está correto quando cada ação do paciente chega ao médico responsável e pode ser respondida/acompanhada no painel médico.
- Preserve rotas, integrações e dados existentes durante mudanças visuais.
- O app do paciente deve seguir o mockup Fluent Accent informado em `CONTEXTO_ATUAL.md`; o painel médico precisa ser visualmente coerente e funcionalmente conectado.

## Protocolo de retomada

1. Leia os dois arquivos importados acima.
2. Rode `git status --short` e confirme que as mudanças existentes serão preservadas.
3. Inspecione o código e valide as afirmações do handoff antes de editar.
4. Diga ao usuário, em português e de forma breve, o que entendeu e qual será o próximo passo concreto.
5. Prossiga pela seção `Próxima ação recomendada` de `CONTEXTO_ATUAL.md`, salvo se o usuário der uma prioridade diferente.

## Deploy Configuration (configurado por /setup-deploy em 2026-07-17)

- Platform: VPS própria `173.212.230.29` — Nginx + PM2 em `/opt/medconecta` (conforme `PLANO_MEDCONECTA.md`; ver "não verificado" abaixo)
- Production URL: `https://medconecta.173-212-230-29.sslip.io` — painel do médico (verificado: HTTP 200)
- API base URL: `https://medconecta.173-212-230-29.sslip.io/api` (verificado: HTTP 200)
- Post-deploy health check: `curl -sf https://medconecta.173-212-230-29.sslip.io/api/health`
  - Resposta esperada: `{"status":"ok","service":"medconecta-api",...}`
- Deploy status command: nenhum. Não há CLI de plataforma; use o health check acima.
- Merge method: indefinido — repo trabalha direto na `main`, sem PRs no histórico recente. `gh` CLI não está instalado.
- Project type: monorepo — painel médico (web estático) + API Fastify + app Expo (paciente).

### Custom deploy hooks

- Pre-merge: `npm run typecheck` e `npm run lint` — ATENÇÃO: falhavam no mobile no último diagnóstico. Não trate verde como prova de que o mobile compila (o workspace mobile não tem script `build`).
- Deploy trigger: **MANUAL — não automatizado a partir deste repositório.** Não existe comando de deploy versionado. O deploy real é feito por um `deploy.sh` não versionado dentro da VPS.
- Deploy status: polling do health check acima.
- Health check: `https://medconecta.173-212-230-29.sslip.io/api/health`

### ⚠️ NÃO CONFIAR em `.github/workflows/deploy.yml`

Esse workflow dispara em todo push na `main` e executa `cd /app` + `docker compose up -d --build`.
`PLANO_MEDCONECTA.md` afirma que a VPS real usa `/opt/medconecta` + PM2 e que Docker está inativo —
o que tornaria esse workflow inócuo. **Isso não foi verificado nesta sessão** e o mesmo documento já
se provou desatualizado (dizia que HTTPS não existia; HTTPS está funcionando).

Consequência prática: **não assuma que push na `main` publica em produção.** Antes de qualquer
automação de deploy (`/land-and-deploy` incluso), reconcilie o workflow com a VPS real — item 3 do
roadmap em `PLANO_MEDCONECTA.md`. A VPS também tem alterações não commitadas e está num commit
anterior ao local, então um `git pull` direto pode conflitar.

### Alvos de deploy abandonados (não usar)

`railway.json` e `vercel.json` continuam no repo mas não representam a produção atual
(`PLANO_MEDCONECTA.md`, seção 4.3). O destino oficial é a VPS.

### Verificado em 2026-07-17

- `https://medconecta.173-212-230-29.sslip.io` → 200, serve o painel do médico.
- `https://medconecta.173-212-230-29.sslip.io/api/health` → 200, API saudável.
- Bundle web publicado aponta para `https://medconecta.173-212-230-29.sslip.io/api` — coerente, sem mixed content.
- `http://173.212.230.29` e `http://173.212.230.29/api/health` → **404**. O IP puro não serve mais; o Nginx passou a responder pelo hostname sslip.io. Corrigir essa afirmação em `PLANO_MEDCONECTA.md`.

