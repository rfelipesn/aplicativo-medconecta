# Bugs e riscos

- Worktree tem 46 caminhos locais; não descartar.
- Histórico recente contém correções de API URL web, CORS e onboarding; validar regressões.
- Documentação registra erros anteriores de TypeScript em adapters Watermelon/shims; o typecheck atual passou, mas revalidar após qualquer mudança mobile.
- Fluxos clínicos, push e biometria não possuem cobertura E2E suficiente.
- Deploy observado em VPS `173.212.230.29` com Nginx+PM2 diverge do workflow Docker; não executar deploy automático sem reconciliar.
- Documentação registra credencial embutida no remote Git e senha VPS compartilhada anteriormente: não exibir, remover/rotacionar antes de push.
- Build web passa com warning de chunk minificado acima de 500 kB.
- Dados de saúde são sensíveis: manter RLS, signed URLs, auditoria e secrets fora do Git.
