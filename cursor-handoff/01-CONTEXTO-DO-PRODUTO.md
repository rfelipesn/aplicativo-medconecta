# Contexto do produto

MEDconecta é uma plataforma de acompanhamento médico composta por aplicativo do paciente, painel médico e API. O objetivo central é permitir que dados e solicitações saiam do paciente, sejam persistidos com segurança, apareçam para o profissional responsável e retornem ao paciente como resposta, receita, documento, orientação ou notificação.

## Público e fluxos

- Paciente: autenticação, onboarding/PIN, dashboard, chat, demandas, diários de cefaleia e convulsão, eventos de saúde, documentos, exames, receitas, notificações e biometria.
- Médico/equipe: painel web para pacientes, demandas, chat, diários, eventos, documentos, exames, receitas, assistentes e acompanhamento.
- Backend: autorização, regras de vínculo paciente–profissional, auditoria, storage, notificações, transcrição e IA.

## Direção de produto

Antes de ampliar o visual, confirmar cada fluxo ponta a ponta:

`tela do paciente → chamada/repositório → API ou Supabase → tabela/evento → painel médico → resposta/notificação ao paciente`.

Cada fluxo deve ser classificado como completo, parcial, desconectado ou apenas visual. A prioridade é corrigir conexões clínicas reais; refinamentos visuais vêm depois sem remover lógica existente.

## Direção visual aprovada

O lado paciente segue Fluent Accent: superfícies claras, azul-petróleo suave, cabeçalho com gradiente, cartões arredondados, tipografia limpa, hierarquia forte e acentos laranja/lilás. A fonte local mais útil é `app-mockup.canvas.tsx`; também há imagens em `diario de cefaleia/` e um manual de marca em PDF. O painel médico deve pertencer ao mesmo sistema visual, sem copiar literalmente a composição mobile.
