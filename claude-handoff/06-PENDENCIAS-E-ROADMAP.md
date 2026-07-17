# Pendências e roadmap

## P0/P1

1. Inventariar cada ação paciente → API/Supabase → tabela → painel médico → retorno/notificação; critério: mapa com status completo/parcial/desconectado.
2. Corrigir conexões desconectadas em demandas, sintomas/crises, chat, documentos/exames e receitas; critério: teste de ida e volta com dados reais de teste.
3. Validar RLS, signed URLs, autenticação e não exposição de PHI/secrets.
4. Reconciliar deploy VPS/Nginx/PM2 com workflows Docker/GitHub antes de publicar.

## P2/P3

- Adicionar E2E aos fluxos clínicos essenciais, push e autenticação de produção.
- Validar mobile em dispositivo/viewport e painel web responsivo.
- Consolidar tokens Fluent Accent e alinhar web ao sistema visual sem quebrar lógica.
- Investigar chunk web >500 kB e cobertura/observabilidade.

Arquivos prováveis: `apps/*/src`, `services/api/src/routes/*`, `packages/shared/src/schemas/*`, `supabase/migrations/*`, `.github/workflows/*`.
