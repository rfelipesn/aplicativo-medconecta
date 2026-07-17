# Funcionalidades

Implementadas no código: login/onboarding/PIN, sessão e biometria; dashboard paciente; registro e estatísticas de cefaleia; registro e estatísticas de convulsão; chat texto/áudio e transcrição; demandas paciente↔médico; eventos de saúde; receitas; documentos e exames com signed URLs; notificações e push; assistentes; painel médico com dashboard, demandas, chat, cefaleia, convulsão, eventos, documentos, exames, receitas e assistentes; cache/offline WatermelonDB.

Arquivos de entrada relevantes: `apps/mobile/src/screens/*`, `apps/mobile/src/features/{headache,seizure}/*`, `apps/mobile/src/watermelon/*`, `apps/web/src/pages/*`, `services/api/src/routes/*`, `packages/shared/src/schemas/*`, `supabase/migrations/*`.

Estado individual ainda precisa ser validado por fluxo. O E2E conhecido cobre autenticação e demandas; chat clínico, diários, push, biometria, documentos/exames e offline dependem de validação manual. Não assumir que uma tela visual está conectada à persistência.
