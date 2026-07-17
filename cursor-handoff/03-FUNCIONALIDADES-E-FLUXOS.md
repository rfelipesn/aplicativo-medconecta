# Funcionalidades e fluxos

## Implementações encontradas

- Login, sessão, onboarding, PIN e biometria.
- Dashboard e navegação do paciente.
- Registro, listagem e estatísticas de cefaleia.
- Registro, listagem e estatísticas de convulsão.
- Chat de texto e áudio, fila offline e transcrição.
- Demandas paciente–equipe e retorno.
- Eventos de saúde.
- Documentos e exames com upload/download por signed URL.
- Receitas.
- Notificações internas e push Expo.
- Assistentes e acesso delegado.
- Painel médico para os domínios acima.

## Onde começar a validar

| Domínio | Paciente | API/persistência | Médico |
|---|---|---|---|
| Demandas | `apps/mobile/src/screens/DemandsScreen.tsx` | `services/api/src/routes/demands.ts` | `apps/web/src/pages/DemandsPanel.tsx` |
| Chat | `apps/mobile/src/screens/ChatScreen.tsx` | `routes/chat.ts`, `routes/audio.ts`, Watermelon chat | `apps/web/src/pages/ChatPanel.tsx` |
| Cefaleia | `features/headache`, dashboards/reports | `routes/headacheDiary.ts`, migrations | `apps/web/src/pages/HeadachePanel.tsx` |
| Convulsão | `features/seizure`, dashboards/reports | `routes/seizureDiary.ts`, migrations | `apps/web/src/pages/SeizurePanel.tsx` |
| Eventos | `HealthEventsScreen.tsx` | `routes/healthEventLog.ts` | `HealthEventPanel.tsx` |
| Documentos | `DocumentsScreen.tsx` | `routes/documents.ts`, Storage | `DocumentsPanel.tsx` |
| Exames | telas/fluxos relacionados | `routes/exams.ts`, Storage | `ExamsPanel.tsx` |
| Receitas | `RecipesScreen.tsx` | `routes/recipes.ts`, Storage | `RecipesPanel.tsx` |
| Notificações | `NotificationsScreen.tsx` | `routes/notifications.ts`, `pushTokens.ts` | ações do painel/API |

## Cobertura conhecida

O código existe para os fluxos acima, mas existência de tela/rota não prova conexão completa. O E2E conhecido cobre autenticação e demandas. Diários, chat clínico, push, biometria, storage e offline precisam de validação manual e novos testes ponta a ponta.
