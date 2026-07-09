# 🎯 COMECE AQUI - VERSÕES RODANDO

## ✅ Status: TUDO FUNCIONANDO!

```
┌─────────────────────────────────────────────┐
│ ✅ Backend API      → http://localhost:3333 │
│ ✅ Web (Médico)     → http://localhost:5173 │
│ ✅ Mobile (Paciente)→ http://localhost:8082 │
└─────────────────────────────────────────────┘
```

---

## 🔗 Acessos Diretos

### 1. **Painel do Médico (WEB)**
```
👉 http://localhost:5173
```
- **Tipo**: Versão WEB (React + Vite)
- **Usuários**: Médicos + Admin
- **Responsividade**: Desktop/Tablet (mobile no futuro)
- **Como abrir**: Clique no link ou cole em um navegador

### 2. **App do Paciente (MOBILE)**
```
👉 http://localhost:8082
```
- **Tipo**: Versão MOBILE (React Native + Expo)
- **Usuários**: Pacientes (exclusivo mobile)
- **Acesso**:
  - ✅ **Opção 1 (Mais fácil)**: Expo Go no celular (escaneie QR code)
  - ✅ **Opção 2**: Android Studio/Xcode emulator (próx. comando)
  - ✅ **Opção 3**: Preview web em http://localhost:8082

### 3. **Backend API**
```
http://localhost:3333
```
- Autenticação e dados compartilhados
- Endpoints: `/me`, `/me/change-password`, `/me/consents`, etc.

---

## 🧪 Como Testar

### Cenário Mínimo (5 minutos)
1. Abra **http://localhost:5173** (Web do Médico)
2. Faça login ou crie uma conta
3. Explore o painel

### Teste Completo (30 minutos)
**Opção A - Expo Go (Recomendado para celular real)**:
1. Instale Expo Go: https://expo.dev/tools
2. Abra http://localhost:8082 no computador
3. Escaneie o **QR Code** com o celular (Expo Go)
4. App carrega automaticamente
5. Teste login + onboarding (deve ser suave!)
6. Teste biometria

**Opção B - Emulador Android**:
1. Abra Android Studio
2. Inicie um emulador Android
3. Execute: `npm run android -w @medconecta/mobile`

**Opção C - Emulador iOS**:
1. Abra Xcode (macOS only)
2. Inicie um simulador iOS
3. Execute: `npm run ios -w @medconecta/mobile`

### Teste de Integração (15 minutos)
1. Web (Médico): http://localhost:5173
2. Mobile (Paciente): http://localhost:8082 (Expo Go)
3. Abra ambos em paralelo
4. Faça ações na app do paciente
5. Veja atualizações em tempo real no painel médico

---

## 🎓 Sobre as Versões

### Versão Médico (Web)
**Hoje**: Funciona 100% como WEB  
**Futuro**: Versão mobile planejada  
**Usuários**: Médicos (login + email)  
**Acesso**: Navegador desktop/tablet  

### Versão Paciente (Mobile)
**Hoje**: Funciona 100% como MOBILE (React Native)  
**Sempre**: Exclusivo para mobile  
**Usuários**: Pacientes (login + biometria opcional)  
**Acesso**: Smartphone/emulador apenas  

---

## 🐛 Solução de Problemas

### Problema: "Porta já em uso"
✅ **Tudo bem**, os servidores já estavam rodando de sessões anteriores. Isso é normal.

### Problema: Mobile não carrega
✅ Aguarde (compilação pode levar 1-2 min na primeira vez)  
✅ Se ainda não carregar, verifique console em http://localhost:8082

### Problema: Login não funciona
✅ Verifique se Backend (3333) está rodando  
✅ Verifique credenciais de Supabase em .env

### Problema: Onboarding travado (antes da correção)
✅ **JÁ ESTÁ CORRIGIDO!** (Veja 🎯_LEIA_PRIMEIRO.md para detalhes da correção)  
✅ Agora transição é suave (<500ms)

---

## 📱 Diferentes Resoluções

### Web (Médico)
```
Desktop:   1920x1080+ (otimizado)
Tablet:    768x1024 (suportado)
Mobile:    Futuro (em planejamento)
```

### Mobile (Paciente)
```
iPhone:    375x812+  (Portrait)
Android:   Varia     (Portrait/Landscape)
Tablet:    Não suportado (foco em smartphone)
```

---

## 🚀 Arquitetura Resumida

```
MEDconecta
├─ Backend API (Node.js)         → :3333
│  ├─ Autenticação (Supabase)
│  ├─ CRUD Pacientes/Médicos
│  └─ Endpoints específicos
│
├─ Web (React + Vite)            → :5173
│  ├─ Painel Médico
│  ├─ Gerenciamento Pacientes
│  └─ Relatórios/Histórico
│
└─ Mobile (React Native + Expo)  → :8082
   ├─ App Paciente
   ├─ Autenticação + Biometria
   ├─ Onboarding (CORRIGIDO!)
   ├─ Sincronização Offline
   └─ Diário de Cefaleia
```

---

## ✨ Funcionalidades Testáveis Agora

✅ **Web (Médico)**
- Login/Logout
- Dashboard
- Listar pacientes
- Criar/editar pacientes
- Ver histórico

✅ **Mobile (Paciente)**
- Login com email/senha
- Onboarding suave (SEM TRAVAMENTOS!)
- Criar PIN/Senha
- Biometria (Face ID/Touch ID)
- Navegação tabs
- Diário de cefaleia

---

## 📚 Documentação

Se precisar de mais detalhes:

| Arquivo | Conteúdo |
|---------|----------|
| 🎯_LEIA_PRIMEIRO.md | Resumo da correção do onboarding |
| VERSOES_RODANDO.md | Guia completo de acesso |
| ONBOARDING_FIX_TEST_GUIDE.md | Testes detalhados do onboarding |
| ONBOARDING_FIX_TECHNICAL_SUMMARY.md | Análise técnica profunda |

---

## 🎯 Próximo Passo

### Escolha uma opção:

**Option A** - Testar WEB (5 min)
```
Abra: http://localhost:5173
Faça login e explore o painel
```

**Option B** - Testar MOBILE (15 min)
```
1. Abra http://localhost:8082 no computador
2. Escaneie QR code com Expo Go
3. Teste app no celular
```

**Option C** - Testar AMBAS em paralelo (30 min)
```
1. Abra Web em http://localhost:5173
2. Abra Mobile via Expo Go
3. Teste integração
```

---

## 📞 Verificação Rápida

Tudo funcionando? Execute isto no terminal:
```bash
# Verifique Backend
curl http://localhost:3333

# Verifique Web
curl -s http://localhost:5173 | head -1

# Verifique Mobile (deve retornar HTML do Expo)
curl http://localhost:8082
```

---

**Criado**: 2026-07-08  
**Status**: ✅ Pronto para testes visuais  
**Próximo**: Escolha um cenário de teste acima!
