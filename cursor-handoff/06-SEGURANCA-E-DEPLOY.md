# Segurança e deploy

## Dados sensíveis

O sistema trata dados de saúde. Preservar RLS, auditoria, criptografia em trânsito, buckets privados e signed URLs curtas. Não registrar PHI em logs/Sentry e não colocar secrets em código, prompt, commit ou documentação.

## Identidade e autorização

Supabase Auth é a base da identidade. `public.users.id` referencia `auth.users.id`; RLS usa `auth.uid()` e funções de resolução de paciente/médico. A API adiciona autorização em `services/api/src/middleware/auth.ts` e `assistantAccess.ts`. Toda rota com `patientId` deve provar que o usuário pode acessar aquele paciente.

## Storage

Buckets documentados: `exams`, `audios` e `recipes`, privados e acessados por signed URLs. Validar tipo/tamanho, path ownership, expiração e autorização antes de assinar upload/download.

## Riscos operacionais registrados

- A documentação cita remote Git com credencial embutida: não exibir; remover e rotacionar antes do próximo push.
- A senha administrativa da VPS foi compartilhada durante testes: trocar e usar SSH por chave.
- Restringir permissões dos `.env` da VPS.
- VPS observada em `173.212.230.29`, instalação em `/opt/medconecta`, com Nginx + PM2.
- Workflows do repositório também refletem Docker/Netlify/Vercel/Railway. Reconciliar a fonte oficial antes de deploy.
- HTTPS/domínio ainda precisavam de validação no último contexto disponível.

Não executar deploy, migration, alteração Supabase ou ação mutável na VPS sem autorização explícita e plano de rollback.
