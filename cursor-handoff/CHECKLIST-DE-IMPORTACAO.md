# Checklist para abrir no Cursor

- [ ] Copiar/abrir o repositório inteiro, não apenas `cursor-handoff/`.
- [ ] Confirmar que `.git`, `.cursor/rules/`, `apps/`, `services/`, `packages/`, `supabase/` e os handoffs estão presentes.
- [ ] Se a transferência foi feita por Git, copiar `cursor-handoff/CURSOR-RULE-HANDOFF.mdc` para `.cursor/rules/handoff-continuity.mdc`, pois `.cursor/` está ignorada.
- [ ] Abrir a raiz do projeto como workspace no Cursor.
- [ ] Abrir um Agent Chat e colar `cursor-handoff/PROMPT-INICIAL.md`.
- [ ] Confirmar que o Agent leu as regras `.mdc` e o contexto mestre.
- [ ] Conferir `git status --short` antes de qualquer alteração.
- [ ] Não adicionar `.env` real ao contexto do chat.
- [ ] Pedir primeiro análise/mapa; autorizar implementação somente depois.
- [ ] Exigir testes e resumo dos arquivos alterados ao final de cada tarefa.

Se o projeto for transferido para outro computador, leve o repositório completo por Git privado ou arquivo compactado seguro, excluindo `node_modules`, caches, builds e secrets. Recrie o `.env` localmente por canal seguro usando os `.env.example` como modelo.
