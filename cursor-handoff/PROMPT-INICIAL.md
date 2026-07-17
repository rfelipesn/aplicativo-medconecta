# Prompt inicial para colar no Cursor Agent

Você está assumindo a continuidade do projeto MEDconecta neste workspace.

Antes de editar qualquer arquivo:

1. Leia integralmente `cursor-handoff/README.md`, `cursor-handoff/CONTEXTO-MESTRE.md` e `cursor-handoff/ESTADO-E-CONTINUIDADE.md`.
2. Leia `CONTEXTO_ATUAL.md`, `PLANO_MEDCONECTA.md`, `CLAUDE.md`, `README.md` e os documentos de `claude-handoff/`.
3. Siga todas as regras em `.cursor/rules/`, especialmente a consulta obrigatória ao grafo antes de explorar o código.
4. Execute apenas comandos de leitura: `git status --short`, `git branch --show-current`, `git log --oneline -10` e `git diff --stat`.
5. Preserve todas as mudanças rastreadas e não rastreadas. Não use `git reset --hard`, `git checkout --`, `git clean`, remoções em massa ou qualquer comando destrutivo.
6. Não exponha valores de `.env`, credenciais, tokens, cookies, chaves ou senhas.
7. Não faça commit, push, migration, deploy, alteração no Supabase ou acesso mutável à VPS sem pedido explícito.

Depois da leitura, não programe ainda. Responda primeiro com:

- sua compreensão do produto e da arquitetura;
- o estado atual do Git e o trabalho local que deve ser preservado;
- funcionalidades já existentes;
- pendências e riscos prioritários;
- divergências ou informações ainda não confirmadas;
- o próximo passo concreto recomendado.

A prioridade atual é produzir e validar um mapa ponta a ponta de cada fluxo: ação do paciente → tela/componente → repositório/chamada → API ou Supabase → tabela/evento → painel médico → resposta/notificação ao paciente. Marque cada fluxo como completo, parcial, desconectado ou somente visual.

Apresente um plano curto e aguarde minha autorização antes de editar arquivos.
