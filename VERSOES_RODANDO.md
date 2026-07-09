# 🚀 Versões Rodando para Testes Visuais

## Status Atual

✅ **Backend API (Médico + Paciente)** - http://localhost:3333  
✅ **Web - Painel do Médico** - http://localhost:5173  
✅ **Mobile - App do Paciente** - http://localhost:8082 (Expo)  

---

## 🔗 URLs de Acesso

### **1️⃣ Painel do Médico (WEB)**
```
http://localhost:5173
```
**O que é**: Interface web para médicos gerenciarem pacientes, consultas, relatórios  
**Como acessar**: Abra o link em um navegador (Chrome, Firefox, Safari, Edge)  
**Responsividade**: Pronta para web + tablet (mobile futuro)  
**Tecnologia**: React 18 + TypeScript + Vite + TailwindCSS  

### **2️⃣ App do Paciente (MOBILE)**
```
http://localhost:8082
```
**O que é**: Aplicativo mobile (React Native + Expo) para pacientes acessarem consultas  
**Como acessar**: 
- **Opção 1** (Mais fácil): Escaneie o QR code que aparece no terminal/console Expo
- **Opção 2**: Abra Expo Go no seu celular/emulador e procure por "MEDconecta"
- **Opção 3** (Desenvolvimento): Abra http://localhost:8082 no navegador (web preview do Expo)

**Responsividade**: Mobile-first (exclusivo para pacientes via smartphone)  
**Tecnologia**: React Native + TypeScript + Expo + React Navigation  

### **3️⃣ Backend API (AMBAS AS VERSÕES)**
```
http://localhost:3333
```
**O que é**: Servidor Node.js que serve ambas as aplicações  
**Endpoints**: 
- `/me` - Perfil do usuário autenticado
- `/me/change-password` - Troca de senha (correção implementada!)
- `/me/consents` - Registra consentimentos LGPD
- Outros endpoints específicos para médicos e pacientes

**Autenticação**: Supabase Auth (JWT tokens)  
**Banco de dados**: Prisma + PostgreSQL (Supabase)  

---

## 📱 Diferenças Entre as Versões

| Aspecto | Médico (Web) | Paciente (Mobile) |
|---------|--------------|-------------------|
| **Plataforma** | Web (Desktop/Tablet) | Mobile only |
| **Acesso** | http://localhost:5173 | http://localhost:8082 |
| **Responsividade** | Desktop-first | Mobile-first |
| **Usuários** | Médicos e admin | Pacientes |
| **Funcionalidades** | Gerenciar pacientes, consultas, relatórios | Enviar dados, visualizar histórico, biometria |
| **Autenticação** | Email + Senha | Email + Senha + Biometria (opcional) |
| **Offline** | Não | Sim (WatermelonDB) |
| **Futuro** | Versão mobile planejada | Exclusivo mobile |

---

## 🧪 Como Testar

### Cenário 1: Testar Versão Médico (Web)
1. Abra http://localhost:5173 no navegador
2. Login com credenciais de médico
3. Explore o painel
4. Teste navegação, operações CRUD

### Cenário 2: Testar Versão Paciente (Mobile)
**Via Expo Go (Recomendado)**:
1. Instale Expo Go no seu celular (iOS/Android)
2. Abra o app Expo Go
3. Escaneie o QR code que aparece em http://localhost:8082
4. Aguarde o app carregar
5. Teste login, onboarding, biometria

**Via Emulador**:
1. Tenha Android Studio ou Xcode instalados
2. Execute: `npm run android` ou `npm run ios` (na pasta apps/mobile)
3. O emulador abre automaticamente

### Cenário 3: Testar Integração Médico + Paciente
1. Abra Painel do Médico em http://localhost:5173
2. Abra App do Paciente em paralelo (Expo Go ou emulador)
3. Faça ações na app do paciente
4. Veja atualizações em tempo real no painel do médico

---

## 🔧 Configuração Técnica

### Ambiente Compartilhado
- **Supabase URL**: https://jrhsugwodskbmoztqvds.supabase.co
- **API URL**: http://localhost:3333 (web) | http://10.0.2.2:3333 (Android) | http://localhost:3333 (iOS)
- **Banco de dados**: PostgreSQL via Supabase

### Variáveis de Ambiente

**Web (.env)**:
```
VITE_SUPABASE_URL=https://jrhsugwodskbmoztqvds.supabase.co
VITE_SUPABASE_ANON_KEY=[token_aqui]
VITE_API_URL=http://localhost:3333
```

**Mobile (app.json)**:
```
"extra": {
  "supabaseUrl": "https://jrhsugwodskbmoztqvds.supabase.co",
  "supabaseAnonKey": "[token_aqui]"
}
```

---

## 🐛 Troubleshooting

### Problema: "Port 3333 already in use"
**Solução**: O backend já está rodando. Tudo bem, continue.

### Problema: "Port 5173 already in use"
**Solução**: A web já está rodando. Tudo bem, continue.

### Problema: Mobile/Expo não conecta à API
**Solução 1**: Verifique se está em rede local (não VPN)  
**Solução 2**: Use IP local da máquina em vez de localhost  
**Solução 3**: Em Android, tente http://10.0.2.2:3333 (já configurado)  

### Problema: "Module not found" ou erro TypeScript
**Solução**: Execute `npm install` na pasta raiz do projeto

### Problema: Supabase retorna 401 Unauthorized
**Solução**: Verifique se as credenciais de Supabase estão corretas em .env files

---

## 📊 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                           │
│  (Auth + PostgreSQL + Storage + Realtime)                   │
└────────────────────────▲────────────────────────────────────┘
                         │ JWT Tokens + Data
         ┌───────────────┴────────────────┬─────────────────┐
         │                                │                 │
    ┌────▼─────┐                    ┌────▼─────┐       ┌───▼────┐
    │  Backend  │◄───────────────────┤   Web    │       │ Mobile │
    │  API      │   (Médico)         │ (Médico) │       │(Paciente)
    │ :3333     │                    │ :5173    │       │ :8082  │
    └──────────┘                     └──────────┘       └────────┘
    
    WatermelonDB (Local)
    (Offline Cache)
           ▲
           │
           └───────────────────────────────
              Sincronização automática
```

---

## ✨ Funcionalidades Implementadas

### ✅ Backend API
- [x] Autenticação com Supabase
- [x] CRUD de Pacientes
- [x] CRUD de Médicos
- [x] Endpoint GET /me (perfil)
- [x] Endpoint POST /me/change-password (COM CORREÇÃO!)
- [x] Endpoint POST /me/consents (LGPD)
- [x] Audit logs

### ✅ Web (Médico)
- [x] Login/Logout
- [x] Dashboard
- [x] Lista de pacientes
- [x] Criação de paciente
- [x] Edição de paciente
- [x] Visualização de histórico
- [x] React Query (cache + fetch)
- [ ] Dark mode (futuro)
- [ ] Relatórios avançados (futuro)

### ✅ Mobile (Paciente)
- [x] Autenticação
- [x] Onboarding (com correção da transição!)
- [x] Criação de PIN/Senha
- [x] Biometria (Face ID/Touch ID)
- [x] Offline-first (WatermelonDB)
- [x] Sincronização automática
- [x] Diário de cefaleia
- [x] React Navigation (tabs + stack)
- [x] React Query (polling)
- [ ] Notificações push (futuro)

---

## 🎯 Próximos Passos

1. **Testar versão Web** (http://localhost:5173)
   - Login com credenciais médico
   - Explorar funcionalidades
   - Reportar problemas

2. **Testar versão Mobile** (http://localhost:8082)
   - Usar Expo Go ou emulador
   - Completar onboarding
   - Verificar correção da transição (deve ser suave!)
   - Testar biometria

3. **Testar Integração**
   - Faça ações no mobile
   - Veja reflexão no painel web
   - Verifique sincronização

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique se todos os 3 servidores estão rodando (Backend, Web, Mobile)
2. Veja arquivos de log nos terminais
3. Verifique se as portas 3333, 5173, 8082 estão livres
4. Teste conectividade: `curl http://localhost:3333`

**Documentação completa do onboarding**: Ver `🎯_LEIA_PRIMEIRO.md` e documentos relacionados.

---

**Atualized**: 2026-07-08  
**Status**: ✅ Todos os servidores rodando e prontos para testes visuais
