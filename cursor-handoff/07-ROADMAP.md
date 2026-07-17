# Roadmap recomendado

## P0 — preservar e entender

1. Confirmar `git status` e não perder o trabalho local.
2. Construir o mapa ponta a ponta de cada fluxo clínico.
3. Classificar cada fluxo como completo, parcial, desconectado ou apenas visual.

## P1 — produto funcional

1. Corrigir primeiro demandas, sintomas/crises, chat, documentos/exames e receitas desconectados.
2. Validar autenticação, vínculo paciente–médico, RLS e signed URLs.
3. Criar E2E para caminhos clínicos essenciais.

## P2 — qualidade e experiência

1. Consolidar o design Fluent Accent sem remover comportamento.
2. Validar mobile em dispositivo/viewport real e painel responsivo.
3. Testar offline/sincronização, push e biometria.
4. Revisar bundle web e observabilidade sem PHI.

## P3 — publicação

1. Definir infraestrutura oficial.
2. Reconciliar VPS/PM2/Nginx com workflows e containers.
3. Rotacionar credenciais, fechar HTTPS/domínio e executar canário.

## Critério para cada tarefa

Toda tarefa deve declarar objetivo, arquivos, riscos, critério de conclusão e comandos/testes. Ao terminar, registrar arquivos alterados, validações executadas, resultado e pendências restantes.
