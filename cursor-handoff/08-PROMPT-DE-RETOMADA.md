# Prompt para colar no Cursor

```text
Você está assumindo o projeto MEDconecta a partir de um handoff completo.

Antes de editar qualquer arquivo:

1. Leia `.cursor/rules/cursor-handoff.mdc`.
2. Leia todos os arquivos em `cursor-handoff/`, na ordem indicada pelo README.
3. Leia integralmente `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `CLAUDE.md`, `README.md`, `COMECE_AQUI.md`, `VERSOES_RODANDO.md` e `🎯_LEIA_PRIMEIRO.md`.
4. Execute somente comandos de diagnóstico: `git status --short`, `git branch --show-current`, `git log --oneline -10` e `git diff --stat`.
5. Use primeiro o grafo de conhecimento configurado no projeto para descobrir arquitetura, símbolos e dependências; leia arquivos específicos depois.

Não altere nada ainda. Não descarte mudanças locais, não use comandos destrutivos, não faça commit/push, não execute migration/deploy e não exponha secrets.

Na primeira resposta, entregue:

- resumo do produto e arquitetura;
- estado atual do worktree;
- funcionalidades confirmadas;
- riscos e incertezas;
- próxima tarefa prioritária;
- plano curto para executá-la;
- perguntas realmente bloqueantes, se houver.

A prioridade padrão é mapear cada fluxo paciente → API/Supabase → banco/storage → painel médico → resposta/notificação, classificando-o como completo, parcial, desconectado ou apenas visual. Aguarde minha autorização antes de editar.
```
