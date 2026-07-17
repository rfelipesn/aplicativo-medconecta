# MEDconecta — Plano e Status Real do Projeto

> Este documento substitui `.cursor/plans/medconecta_-_arquitetura_completa_ece95dfa.plan.md`,
> referenciado no README mas que não existe mais nesta pasta (ficou só local no Cursor e nunca
> foi versionado no git). **A partir de agora, este arquivo é a fonte única de verdade e deve
> ser atualizado a cada sessão de trabalho relevante — em vez de gerar novos arquivos soltos
> tipo `ONBOARDING_FIX_*.md`.**

Gerado em: 2026-07-16, a partir de inspeção direta do código, do histórico de commits e dos
arquivos de configuração — não de suposições.

---

## 1. O que é o produto

Aplicativo médico com dois lados:

- **App do paciente (mobile, Expo/React Native)** — diários clínicos (cefaleia, convulsão),
  registro de sintomas, chat com o médico, upload de documentos/exames, biometria, offline-first.
- **Painel do médico (web, Vite/React)** — gestão de pacientes, respostas de demandas/receitas,
  relatórios, assistentes com permissões granulares.
- **Backend (Fastify)** — autenticação, regras de negócio, IA de triagem e transcrição (Groq).
- **Supabase** — Postgres + Auth + Storage + Realtime, RLS, região `sa-east-1`.

Começa com 1 médico (Dr. Helton Bruno) e foi desenhado para escalar para múltiplos médicos.

## 2. Arquitetura (confirmada no código)

```
medconecta/
├── apps/mobile/       # Expo — paciente. WatermelonDB p/ offline.
├── apps/web/          # Vite + React — painel médico
├── services/api/      # Fastify — regras de negócio, IA, upload
├── packages/shared/   # Zod schemas + tipos — contrato único front/back
├── packages/db/       # Prisma — acesso tipado ao Postgres
└── supabase/          # migrations SQL + políticas RLS (fonte do schema)
```

Monorepo Turborepo + npm workspaces, TypeScript ponta a ponta. Repositório remoto real e
configurado: `github.com/rfelipesn/aplicativo-medconecta` (branch `main`, ligado a `origin`).

## 3. Estado real por área

Tabela abaixo cruza o que o README afirma com o que foi verificado nos arquivos de fato.

| Feature | Confirmado no código |
|---|---|
| Auth (médico / paciente CPF+data / assistente) | ✅ rotas em `services/api/src/routes/auth.ts`, `me.ts` |
| Chat texto + áudio (transcrição Groq) | ✅ `routes/chat.ts`, `routes/transcription.ts` |
| Diário de Cefaleia (11 passos, offline) | ✅ wizard completo em `features/headache/`, repo WatermelonDB |
| Diário de Convulsão (offline) | ✅ `features/seizure/`, `watermelon/seizureRepository.ts` |
| HealthEventLog | ✅ `routes/healthEventLog.ts` + tela mobile com filtros |
| Demandas + triagem IA (Groq) | ✅ `routes/demands.ts` |
| Receitas (solicitação + SLA) | ✅ presente nos schemas e rotas |
| Documentos / Exames | ✅ `routes/documents.ts`, `routes/exams.ts` |
| Push notifications (Expo) | ✅ `routes/pushTokens.ts`, `lib/pushNotifications.ts` |
| Biometria (Face ID / digital) | ✅ `lib/biometrics.ts`, `hooks/useBiometricLogin.ts` |
| Assistentes (permissões + audit log) | ✅ `middleware/assistantAccess.ts`, `lib/audit.ts` |
| Testes E2E (Playwright) | ⚠️ existe **1 fluxo só**: `e2e/auth-and-demands.spec.ts` (médico cadastra paciente → demanda → resposta). Cefaleia, convulsão, biometria, push **não têm E2E**. |
| CI/CD | ✅ `.github/workflows/ci.yml` (typecheck+lint+build+E2E) e `deploy.yml` (SSH + docker compose) |

**Conclusão**: a maior parte do que o README lista como pronto está de fato implementada no
código — isso não é fachada. O ponto fraco real é cobertura de teste automatizado e a
consistência entre configuração e o que está em produção (seção 4).

## 4. Inconsistências encontradas (o motivo real de "estar perdido")

Estas são discrepâncias concretas entre o que a documentação diz e o que os arquivos mostram:

1. **Versão**: README diz *"Versão 1.0 — pronta para TestFlight e Play Console"*, mas
   `apps/mobile/app.json` tem `"version": "0.1.0"` e **não tem `extra.eas.projectId`**
   configurado — sem isso, `eas build`/`eas submit` não funcionam. Ou seja, tecnicamente ainda
   não está pronto para submissão às lojas.

2. **Destino de produção decidido; URL do app ainda desatualizada**: a infraestrutura oficial
   será a VPS `173.212.230.29`, com acesso administrativo pelo usuário `root` e deploy via
   `docker-compose` + SSH. O `app.json` ainda aponta `apiUrl` para
   `https://medconectaapi-production.up.railway.app`; essa URL deverá ser trocada pela URL HTTPS
   definitiva da API na VPS depois da configuração de domínio, proxy reverso e TLS. Credenciais
   e chaves de acesso não devem ser registradas neste repositório.

   **Verificação em 2026-07-16:** o painel já responde em `http://173.212.230.29` e a API em
   `http://173.212.230.29/api/health`. O bundle web publicado usa `http://173.212.230.29/api`.
   HTTPS ainda não está configurado. A API escuta corretamente apenas em `127.0.0.1:3333` e o
   UFW permite entrada somente nas portas `22` e `80`.

   A instalação real fica em `/opt/medconecta` e usa Nginx + PM2; Docker está inativo e `/app`
   não existe. Por isso, o workflow `.github/workflows/deploy.yml`, que executa `cd /app` e
   `docker compose`, não representa nem atualiza a produção atual. O deploy existente é manual,
   por um `deploy.sh` não versionado dentro do servidor.

3. **Múltiplos alvos de deploy coexistindo**: `railway.json`, `vercel.json` e
   `docker-compose.yml` + `deploy.yml` (SSH para VPS) existem todos ao mesmo tempo no repo.
   Isso sugere tentativa-e-erro sem limpar o que foi abandonado.

4. **Migrations com numeração duplicada**: `supabase/migrations/0003_onboarding_state.sql` e
   `supabase/migrations/0003_push_tokens.sql` — dois arquivos com o mesmo prefixo `0003`. Não
   quebra nada sozinho, mas é ambíguo sobre ordem de aplicação e deveria ser corrigido antes de
   confiar cegamente em "rodar tudo em sequência".

5. **Documentação fragmentada em arquivos de sessão**: `🎯_LEIA_PRIMEIRO.md`,
   `COMECE_AQUI.md`, `VERSOES_RODANDO.md` e 8 arquivos `ONBOARDING_FIX_*` na raiz são todos
   artefatos de **uma única sessão de correção de bug** (o race condition de cache no
   onboarding, corrigido em 2026-07-08). Isso não é uma arquitetura de documentação — é ruído
   acumulado que compete com o README pela atenção de quem abre a pasta.

6. **Plano de arquitetura original perdido**: o README referencia um arquivo de plano do
   Cursor que não existe mais no disco. Documentos de plano do Cursor, por padrão, não ficam
   dentro da pasta do projeto nem são versionados — por isso desapareceram.

## 5. Dívida técnica e riscos conhecidos

- Cobertura E2E concentrada em um único fluxo (auth + demandas); os fluxos clínicos (diários,
  biometria, push) dependem hoje só de teste manual.
- O destino de deploy foi definido como a VPS `173.212.230.29`, mas a operação ainda precisa de
  chave SSH, domínio e TLS. O Nginx já faz o proxy `/api` para a API local; o UFW está ativo.
- A VPS está no commit `81e4652`, enquanto o checkout local já está em `a3ac9b3`. O diretório de
  produção também contém alterações não commitadas e scripts de deploy não versionados. Um
  `git pull` direto pode conflitar ou perder a configuração operacional atual.
- A API roda no PM2 há 7 dias e está saudável, mas o serviço de startup `pm2-root` está habilitado
  e inativo, sem histórico de execução. O servidor exige reinício; a recuperação automática da
  API após esse reboot ainda não foi comprovada.
- Os arquivos `services/api/.env` e `apps/mobile/.env` na VPS estão com permissão `644`; devem ser
  restritos ao usuário administrador antes de adicionar outros usuários ao host.
- A VPS aceita login direto de `root` por senha, não possui chave em `authorized_keys` e não tem
  Fail2ban ativo. A senha compartilhada deve ser trocada depois que o acesso por chave funcionar.
- `npm run typecheck` e `npm run lint` falham no mobile com 8 erros TypeScript. O principal é a
  resolução de `./adapter` para os arquivos `adapter.native.ts`/`adapter.web.ts`; também há erros
  no shim de `localStorage`, imports não usados e um `@ts-expect-error` obsoleto.
- `npm run build` passa para API, web, shared e db, mas não constrói o mobile porque o workspace
  mobile não possui script `build`. Portanto, o CI atual pode ficar verde sem provar que o app
  mobile compila para distribuição.
- O remote Git local contém um token de acesso embutido na URL. Esse token deve ser revogado e
  o remote deve voltar a uma URL sem credencial persistida.
- Não há changelog formal contínuo — o histórico de decisões vive espalhado entre mensagens de
  commit e os arquivos `ONBOARDING_FIX_*`.

## 6. Roadmap — próximos passos, em ordem

1. **Fechar os riscos de credenciais.** Revogar o token GitHub embutido no remote, trocar a senha
   administrativa da VPS, instalar uma chave SSH e remover a autenticação por senha quando o
   acesso por chave estiver confirmado. Não salvar senhas no repositório.
2. **Restaurar a compilação do mobile.** Corrigir os 8 erros TypeScript e adicionar uma validação
   de build/export do Expo ao CI, para que um pipeline verde também cubra o aplicativo móvel.
3. **Normalizar e endurecer a VPS já publicada.** Preservar as mudanças atuais de
   `/opt/medconecta` em Git, alinhar o workflow com PM2 + Nginx ou migrar conscientemente para
   Docker, provar o restart automático, restringir os `.env`, configurar domínio + TLS, validar
   `https://<domínio>/api/health`, corrigir `app.json` (`apiUrl`) e remover as configurações
   abandonadas de Railway/Vercel.
4. **Preencher `extra.eas.projectId`** em `apps/mobile/app.json` e decidir o número de versão
   real antes de qualquer submissão à loja.
5. **Corrigir a numeração das migrations** (`0003_onboarding_state.sql` /
   `0003_push_tokens.sql`) para uma ordem explícita (`0003`/`0004`).
6. **Consolidar a documentação solta**: extrair o essencial dos 8 arquivos
   `ONBOARDING_FIX_*` + `🎯_LEIA_PRIMEIRO.md` + `COMECE_AQUI.md` + `VERSOES_RODANDO.md` em uma
   única entrada de changelog, e arquivar ou remover os originais (posso fazer isso quando você
   quiser — só preciso da sua confirmação para apagar arquivos da pasta).
7. **Expandir E2E** para cobrir ao menos: fluxo completo do diário de cefaleia, diário de
   convulsão, e o recebimento de push notification — antes de considerar "pronto para loja".
8. **Rodar uma passada manual completa** pela tabela da seção 3 em dispositivo real (não só
   emulador), especialmente biometria e push.
9. **Manter este documento vivo**: qualquer sessão de correção/feature relevante deve atualizar
   este arquivo (seções 3, 4 ou 6), em vez de gerar um novo `.md` solto na raiz.

## 7. Sobre "usar um repositório que ajude"

Você já tem o que precisa nesse quesito: um repositório git real, com remoto configurado no
GitHub e histórico de commits coerente. Não é necessário adotar outro repositório/template —
o problema não era falta de repositório, era falta de um documento vivo amarrando tudo (que é
o que este arquivo resolve) e o excesso de configs/deploys concorrentes (seção 4).

Se quiser rastrear as pendências do roadmap acima de forma mais estruturada que uma lista em
markdown, GitHub Issues (do próprio repo que você já tem) é o caminho mais simples — sem
precisar de outra ferramenta.
