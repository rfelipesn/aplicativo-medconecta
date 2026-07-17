# MEDconecta — handoff para o Cursor

Este pacote transfere o contexto técnico e operacional do projeto para uma nova sessão do Cursor. Ele deve viajar junto com a pasta inteira do repositório; sozinho, não contém todo o código.

## Ordem obrigatória de leitura

1. `.cursor/rules/cursor-handoff.mdc`
2. `cursor-handoff/01-CONTEXTO-DO-PRODUTO.md`
3. `cursor-handoff/02-ARQUITETURA-E-ESTRUTURA.md`
4. `cursor-handoff/03-FUNCIONALIDADES-E-FLUXOS.md`
5. `cursor-handoff/04-ESTADO-ATUAL.md`
6. `cursor-handoff/05-COMANDOS-E-AMBIENTE.md`
7. `cursor-handoff/06-SEGURANCA-E-DEPLOY.md`
8. `cursor-handoff/07-ROADMAP.md`
9. `cursor-handoff/08-PROMPT-DE-RETOMADA.md`
10. `cursor-handoff/09-CHECKLIST-DE-ENTREGA.md`

Depois, ler integralmente `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `CLAUDE.md`, `README.md`, `COMECE_AQUI.md`, `VERSOES_RODANDO.md` e `🎯_LEIA_PRIMEIRO.md`.

## Regra principal

O worktree contém trabalho em andamento. Nenhuma mudança local deve ser descartada, sobrescrita ou “limpa” sem autorização explícita do usuário. Antes de editar, executar `git status --short`, entender o diff do arquivo alvo e explicar o plano.

## Como importar no Cursor

Abra a pasta raiz `C:\Users\xr\Documents\aplicativo med cursor` como workspace no Cursor. Não abra apenas esta subpasta. Inicie um Agent Chat e cole o conteúdo de `08-PROMPT-DE-RETOMADA.md`.
