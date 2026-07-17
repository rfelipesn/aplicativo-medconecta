# Resumo executivo

MEDconecta é um monorepo TypeScript de saúde: aplicativo do paciente em Expo/React Native, painel médico React/Vite, API Fastify, Supabase/Postgres/Storage/Reatime e persistência offline com WatermelonDB. Há autenticação, chat texto/áudio, diários de cefaleia e convulsão, demandas, eventos de saúde, receitas, documentos/exames, notificações push, biometria e assistentes.

Estado: implementação ampla e build web/API/shared/db verde, mas worktree em desenvolvimento com 46 caminhos modificados/não rastreados. Os fluxos clínicos ainda precisam de inventário ponta a ponta e validação manual. Próxima ação: mapear tela → chamada/repositório → API/Supabase → tabela → painel médico → resposta/notificação, marcando conexões completas/parciais/desconectadas.

Produto e decisões detalhadas: `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `COMECE_AQUI.md`, `🎯_LEIA_PRIMEIRO.md` e `VERSOES_RODANDO.md`.
