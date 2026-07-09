# Guia de Teste: Correção do Fluxo de Onboarding

## Resumo da Correção

**Causa raiz identificada**: Race condition entre cache stale e refetch. O `placeholderData: (prev) => prev` no RootNavigator mantinha dados antigos (com `mustChangePassword=true`) durante o refetch, impedindo a transição para a tela principal mesmo após o backend confirmar a mudança de senha.

**Correções aplicadas**:
1. **RootNavigator.tsx**: Removido `placeholderData` e adicionado `staleTime: 30_000` para evitar refetch excessiva mas garantir dados frescos após invalidação
2. **OnboardingScreen.tsx**: Adicionado `refetchInterval: 1000` ao polling para detectar rapidamente o mustChangePassword=false

## Fluxo Esperado Após Correção

```
Nenhuma sessão
    ↓
Login (usuário autentica)
    ↓ (sessão criada, mas mustChangePassword=true no backend)
    ↓
Onboarding (welcome → scope → terms → password)
    ↓ (usuário cria PIN/senha e clica "Concluir")
    ↓
apiChangePassword():
  - Chama POST /me/change-password
  - Backend: atualiza senha + mustChangePassword=false
  - Backend: retorna novos access/refresh tokens
  - Cliente: injeta novos tokens no Supabase auth
    ↓
OnboardingScreen:
  - setCompleted(true)
  - queryClient.invalidateQueries(['me']) ← força refetch imediato
    ↓
RootNavigator:
  - meQuery refetch inicia
  - SEM placeholderData, aguarda dados frescos
  - /me retorna mustChangePassword=false
    ↓
meAfterChange polling (a cada 1s):
  - Confirma mustChangePassword=false
    ↓
RootNavigator renderiza App
    ↓
Tela principal carregada (SUCESSO)
```

## Instruções Exatas de Teste

### 1. Preparação do Ambiente

```bash
cd apps/mobile
npm install
npm start
```

Certifique-se de que:
- Backend está rodando (services/api)
- Conexão com Supabase funciona
- Variáveis de env estão corretas (.env.example → .env)

### 2. Teste 1: Fluxo Completo Normal (Dispositivo/Emulador Real)

**Pré-requisitos**:
- Aplicativo instalado e limpo (sem sessão anterior)
- Acesso a um CPF/email válido para criar conta

**Passos**:

1. **Abrir app** → deve mostrar Login (nenhuma sessão)

2. **Fazer login** com email/CPF válido
   - Se login bem-sucedido → app redireciona para Onboarding
   - Deve mostrar "Bem-vindo!" (welcome step)
   - Barra de progresso em ~25%

3. **Etapa Scope**
   - Clicar "Começar"
   - Ver tela com aviso de emergência
   - Marcar checkbox "Li e entendi: este app não é para emergências"
   - Clicar "Continuar"
   - Barra de progresso em ~50%

4. **Etapa Termos**
   - Ver tela com consentimentos LGPD
   - Marcar todos os 3 checkboxes:
     - ☑ Aceito os Termos de Uso
     - ☑ Aceito a Política de Privacidade
     - ☑ Autorizo o tratamento dos meus dados sensíveis
   - Clicar "Continuar"
   - Sistema deve enviar consentimentos para backend
   - Barra de progresso em ~75%

5. **Etapa Password/PIN**
   - Ver tela "Crie seu acesso"
   - **Se testar com PIN** (default):
     - Toggle está em "Usar PIN de 6 dígitos" ✓
     - Digitar PIN de 6 dígitos em "PIN"
     - Digitar o MESMO PIN em "Confirmar PIN"
     - Exemplo: 123456 em ambos
   - **Se testar com Senha**:
     - Desmarcar toggle "Usar PIN de 6 dígitos"
     - Digitar senha com 8+ caracteres em "Senha"
     - Digitar a MESMA senha em "Confirmar senha"
     - Exemplo: MinhaSenh@123
   - Clicar "Concluir"

6. **Spinner de Finalização**
   - Deve aparecer: "Finalizando seu acesso..." com spinner
   - Não deve voltar para "welcome" ou nenhuma outra tela
   - Não deve ficar travado por mais de 3-5 segundos

7. **RESULTADO ESPERADO**: 
   - ✓ Spinner desaparece
   - ✓ App mostra tela principal (AppNavigator)
   - ✓ Usuário consegue navegar entre abas normalmente
   - **FALHA SE**: Volta para onboarding, login, ou fica em spinner infinito

### 3. Teste 2: Fluxo com Biometria (iOS/Android Real)

**Pré-requisitos**:
- Dispositivo real com Face ID/Touch ID habilitado
- Permissões de biometria concedidas

**Passos**:
1. Seguir Teste 1 até "Etapa Password/PIN"
2. Após clicar "Concluir" e ver spinner
3. **Esperado**: Pode aparecer prompt de biometria (Face ID/Touch ID)
   - Se aceitar → registra biometria e continua para App
   - Se recusar → alerta "Você pode habilitar depois nas configurações" e continua para App
   - Biometria é opcional, não deve bloquear fluxo

### 4. Teste 3: Refetch Posterior (Navegação)

**Pré-requisitos**:
- Ter completado Testes 1-2 com sucesso
- Estar na tela principal (App)

**Passos**:
1. Navegar entre abas da aplicação (se houver)
2. Background app (home button) e retornar
3. **Esperado**: 
   - Nenhuma volta para onboarding
   - App continua funcional
   - Dados carregam normalmente
   - Nenhuma chamada inesperada a /me/change-password

### 5. Teste 4: Timeout/Erro de Rede

**Pré-requisitos**:
- Estar na etapa Password/PIN
- Modo Airplane ligado ou desconectado de rede

**Passos**:
1. Desligar internet (Airplane mode ON)
2. Digitar PIN/senha
3. Clicar "Concluir"
4. **Esperado**: 
   - Alerta de erro: "Falha de conexão ao salvar a senha. Verifique sua internet e tente novamente."
   - Spinner não aparece
   - Usuário volta para tela de PIN para tentar novamente

**Passos para recuperação**:
5. Ligar internet novamente
6. Digitar PIN/senha novamente
7. Clicar "Concluir"
8. **Esperado**: Segue fluxo normal até App

### 6. Teste 5: Invalidação de Senha

**Pré-requisitos**:
- Estar na etapa Password/PIN
- Preparado para validar formatos

**Passos**:
1. **PIN inválido**:
   - Digitar apenas 5 dígitos em "PIN"
   - Clicar "Concluir"
   - **Esperado**: Alerta "O PIN deve ter 6 dígitos."

2. **Senha muito curta**:
   - Desmarcar PIN
   - Digitar senha com 7 caracteres
   - **Esperado**: Alerta "A senha deve ter ao menos 8 caracteres."

3. **PINs não conferem**:
   - PIN: 123456
   - Confirmar PIN: 654321
   - **Esperado**: Alerta "Os PINs não conferem."

4. **Senhas não conferem**:
   - Desmarcar PIN
   - Senha: MinhaSenh@123
   - Confirmar: MinhaSenh@124
   - **Esperado**: Alerta "As senhas não conferem."

## Sinais de Sucesso

✓ Transição suave entre Onboarding → App  
✓ Nenhuma volta para "Welcome" após "Concluir"  
✓ Spinner de "Finalizando seu acesso..." desaparece em < 5s  
✓ Usuário consegue usar App normalmente após transição  
✓ Nenhum console error relacionado a auth  
✓ Network tab mostra: POST /me/change-password (200) → GET /me (200) com mustChangePassword=false  

## Sinais de Falha

✗ Spinner fica infinito (> 10s)  
✗ Volta para welcome/login após "Concluir"  
✗ Erro "Não foi possível confirmar. Verificando novamente..." persistente  
✗ Network tab mostra erro 401/403 após apiChangePassword  
✗ Console mostra "Cannot read property 'user' of undefined"  
✗ Transição hesitante/com lag visível entre telas  

## Debugging (se precisar)

### Verificar network requests:
```javascript
// No DevTools (React Native Debugger ou similar)
// Monitorar:
POST /me/change-password → Check response.session (novos tokens)
GET /me → Check response.user.mustChangePassword (deve ser false)
```

### Verificar auth state:
```javascript
// Em OnboardingScreen.tsx, adicionar log temporário:
console.log('apiChangePassword completed, session now:', supabase.auth.getSession());
console.log('meAfterChange data:', meAfterChange.data);
console.log('meAfterChange isLoading:', meAfterChange.isLoading);
```

### Verificar cache:
```javascript
// Em RootNavigator.tsx, adicionar log temporário:
console.log('meQuery.data:', meQuery.data);
console.log('meQuery.isLoading:', meQuery.isLoading);
console.log('requiresOnboarding:', requiresOnboarding);
```

## Rollback (se necessário)

Se a correção causar problemas:

1. Restaurar `placeholderData: (prev) => prev` no RootNavigator
2. Remover `refetchInterval: 1000` do OnboardingScreen
3. Remover `staleTime: 30_000` do RootNavigator
