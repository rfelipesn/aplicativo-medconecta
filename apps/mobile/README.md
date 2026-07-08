# @medconecta/mobile

App do paciente (e médico mobile) em Expo, com New Architecture habilitada.

## Stack

- Expo SDK 52 (New Architecture / Fabric / TurboModules)
- Supabase JS (auth com sessão em `expo-secure-store`)
- Biometria (`expo-local-authentication`)
- Câmera (`expo-camera`), áudio (`expo-av`), arquivos (`expo-file-system`)
- Offline-first: WatermelonDB (`@nozbe/watermelondb`)

## Setup

```bash
# Da raiz do monorepo:
npm install

# Configurar credenciais do Supabase em app.json -> expo.extra
# (supabaseUrl, supabaseAnonKey, apiUrl)

# WatermelonDB e módulos nativos exigem um development build:
cd apps/mobile
npx expo prebuild         # gera ios/ e android/
npx expo run:ios          # ou run:android
```

> WatermelonDB exige o plugin de decorators do Babel (ver `babel.config.js`)
> e um development build (não roda no Expo Go por usar módulo nativo SQLite).

## Próximos passos (Fase 1)

1. Fluxo de login: CPF/email + senha temporária -> definir senha/PIN -> biometria.
2. Onboarding de primeiro acesso (aceite de escopo eletivo -> grava em `consents`).
3. Models WatermelonDB para `health_event_logs`, `headache_diary`, `seizure_diary`, `chat_messages`.
4. Fila offline de áudio (gravação local + background upload com retry).
