# Código: Mudanças Exatas Aplicadas

## Arquivo 1: apps/mobile/src/navigation/RootNavigator.tsx

### ANTES (linhas 30-37)

```typescript
  const meQuery = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: !!session,
    // Mantém dados anteriores durante refetch para evitar "flash" de
    // Login/Onboarding quando /me está sendo revalidado após a troca de senha.
    placeholderData: (prev) => prev,
  });
```

### DEPOIS (linhas 30-35)

```typescript
  const meQuery = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: !!session,
    staleTime: 30_000,
  });
```

**Mudanças**:
- ✂️ Removido `placeholderData: (prev) => prev,`
- ✂️ Removido comentário sobre "flash"
- ✅ Adicionado `staleTime: 30_000,`

---

### ANTES (linhas 39-42)

```typescript
  // Considera "pronto" quando NÃO há sessão (vai direto para Login) ou quando
  // já temos dados de /me (mesmo que esteja refetchando). Só bloqueamos na
  // carga inicial, nunca durante a transição pós-onboarding.
  const ready = !session || !!meQuery.data || meQuery.isError;
```

### DEPOIS (linhas 36-39)

```typescript
  // Pronto quando: sem sessão (Login) ou temos dados /me ou erro.
  // staleTime=30s reduz flashing durante refetch normal; após troca de senha,
  // invalidateQueries força refetch imediato. Sem placeholderData, renderiza
  // dados frescos assim que chegam, garantindo transição suave para App.
  const ready = !session || !!meQuery.data || meQuery.isError;
```

**Mudanças**:
- ✏️ Comentário simplificado e atualizado
- ✅ Explicação clara sobre staleTime e placeholderData

---

### ANTES (linhas 51-57)

```typescript
  // Decide qual rota mostrar. IMPORTANTE: durante a transição entre
  // Onboarding -> App, dependemos do dado fresco de /me (que já teve sua
  // sessão reinjetada pelo apiChangePassword). Se por algum motivo o /me
  // ainda estiver refetchando com cache anterior (mustChangePassword=true),
  // continuamos em Onboarding; assim que o dado atualizar para false,
  // passamos a renderizar App. Nunca voltamos para Login enquanto houver
  // sessão válida.
  let route: keyof RootStackParamList;
```

### DEPOIS (linhas 40-44)

```typescript
  // Escolhe rota baseado em sessão e status de onboarding. Após troca de
  // senha em OnboardingScreen (que invalida cache via queryClient),
  // o refetch de meQuery retorna dados frescos rapidamente. Sem placeholderData,
  // a transição Onboarding -> App é suave.
  let route: keyof RootStackParamList;
```

**Mudanças**:
- ✏️ Comentário refatorado (mais conciso)
- ✅ Removido menção a "cache anterior" (já resolvido)
- ✅ Adicionado referência a queryClient.invalidateQueries

---

## Arquivo 2: apps/mobile/src/screens/OnboardingScreen.tsx

### ANTES (linhas 53-60)

```typescript
  // Polling de /me usado depois de concluir o PIN: só liberamos a "tela de
  // finalização" sumir quando o backend confirmar mustChangePassword=false.
  const meAfterChange = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: completed,
    staleTime: 0,
  });
```

### DEPOIS (linhas 53-61)

```typescript
  // Polling de /me após conclusão de PIN: refetch agressivo com 1s interval
  // para detectar rapidamente quando backend confirmou mustChangePassword=false.
  const meAfterChange = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiGet<MeResponse>('/me'),
    enabled: completed,
    staleTime: 0,
    refetchInterval: 1000,
  });
```

**Mudanças**:
- ✏️ Comentário atualizado (menção a "agressivo" e "1s")
- ✅ Adicionado `refetchInterval: 1000,`

---

## Resumo das Mudanças

| Arquivo | Linhas | Ação | Impacto |
|---------|--------|------|---------|
| RootNavigator.tsx | 30-35 | Remover placeholderData + adicionar staleTime | Elimina race condition |
| RootNavigator.tsx | 36-39 | Atualizar comentário | Clareza |
| RootNavigator.tsx | 40-44 | Simplificar comentário | Clareza |
| OnboardingScreen.tsx | 53-61 | Adicionar refetchInterval | Acelera polling |

---

## Verificação Rápida

Para confirmar que mudanças foram aplicadas:

```bash
# RootNavigator.tsx deve ter staleTime MAS NÃO deve ter placeholderData
grep "staleTime: 30_000" apps/mobile/src/navigation/RootNavigator.tsx
# Esperado: 1 match

grep "placeholderData" apps/mobile/src/navigation/RootNavigator.tsx
# Esperado: 0 matches (ou comentário antigo se não deletado)

# OnboardingScreen.tsx deve ter refetchInterval
grep "refetchInterval: 1000" apps/mobile/src/screens/OnboardingScreen.tsx
# Esperado: 1 match
```

---

## Sem Mudanças Necessárias

Os seguintes arquivos **NÃO foram modificados** (e não precisam ser):

- ✓ `apps/mobile/src/lib/api.ts` - apiChangePassword já injeta sessão corretamente
- ✓ `apps/mobile/src/hooks/useSession.ts` - já funciona corretamente
- ✓ `apps/mobile/src/lib/supabase.ts` - já configurado
- ✓ `services/api/src/routes/me.ts` - backend funciona corretamente

A solução é **apenas frontend** porque o problema foi no gerenciamento de cache/refetch do React Query.

---

## Deployment Notes

1. **Sem breaking changes**: Mudar entre/dentro de componentes mantém mesma interface
2. **Sem novas dependências**: Apenas React Query built-in
3. **Sem novas env vars**: Sem configurações adicionais
4. **Compatible**: Funciona com versões existentes de React Navigation, React Query, Supabase
