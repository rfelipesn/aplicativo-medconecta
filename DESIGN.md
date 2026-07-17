# MEDconecta — Fluent Accent Design System

Fonte de verdade visual: mockup HTML `Mockup L — Fluent Accent` + imagem de referência do home.
Escopo: casca visual apenas. Não altera contratos de API, RLS ou dados.

## Memorable thing

“Canal eletivo sério, calmo e premium — o médico enxerga o que precisa responder; o paciente confia.”

## Tokens

### Cor

| Token | Hex / valor | Uso |
|---|---|---|
| `teal` / `primary` | `#85B7BF` | Marca, pills ativas, hero fill |
| `teal-strong` / `primaryStrong` | `#4E8E99` | Botões primários, tab ativa, links |
| `teal-deep` / `primaryDark` | `#0F3B41` | Texto sobre teal claro, títulos fortes |
| `teal-soft` / `primarySoft` | `#E8F2F3` | Chips, fundos de ícone |
| `teal-ultra` / `bg` | `#F0F6F7` | Fundo de tela |
| `white` / `surface` | `#FFFFFF` | Cartões opacos |
| `acrylic` | `rgba(255,255,255,0.72–0.88)` | Cartões translúcidos |
| `text` | `#1A2A2D` | Corpo |
| `text-muted` | `#6B7F84` | Secundário |
| `orange` | `#FF9F45` | Pico, elective, ênfase positiva |
| `purple` | `#9D7BFF` | Convulsão / categoria 2 |
| `blue` | `#4E9EF5` | Informativo |
| `green` | `#34C98E` | Sucesso |
| `red` | `#FF5D5D` | Urgente, erro, badge |

**Contraste de botão:** sobre `primaryStrong` (#4E8E99) usar texto **branco**. Sobre `primary` (#85B7BF) claro usar texto **`primaryDark`**.

### Tipografia

- Família: system / Segoe UI / SF Pro / Inter (web)
- Escala: largeTitle 28 · title 22 · headline 17 · body 15 · subhead 13 · caption 11–12
- Pesos: 500 corpo, 600–700 labels, 800 títulos

### Espaçamento

`4 · 6 · 10 · 16 · 20 · 28 · 36` (xxs→xxl)

### Raio

`8 · 12 · 14 · 16 · 22 · 28 · pill(999)`  
Cartões padrão: 12–16. Avatar squircle: 14. Tab active: 18.

### Sombra

- depth-1: `0 2px 8px rgba(0,0,0,0.04)`
- depth-2: `0 4px 16px rgba(0,0,0,0.06)`
- depth-3 / floating: `0 8–24px` com tom `primaryDark`

### Bordas reveal

`1px solid rgba(133,183,191,0.30)`

## Componentes canônicos (paciente)

1. **Header strip** — gradiente 160° `strong → primary → soft`, blobs brancos 8–10% opacidade
2. **Pivot pills** — glass inativo; branco ativo com texto `primaryStrong`
3. **Command bar** — 4 quick actions glass no header
4. **Hero card** — gradiente teal, chart bars, peak em laranja
5. **Widget card** — acrylic + squircle colorido
6. **Section header** — barra teal 3×16 + título 16/800 + link
7. **Action tiles** — squircle laranja/lilás/azul + pill “Registrar”
8. **List rows** — squircle + título/subtítulo + chevron
9. **Tab bar** — acrylic; item ativo gradiente teal com label branca

## Painel médico (desktop)

Mesma paleta, layout desktop:
- Header sticky com gradiente teal
- Cards com accent bar no título
- Lista de pacientes com seleção inset teal
- Demandas: prioridade (vermelho/laranja/azul/lilás), status, tempo de espera em destaque
- Sem emoji como ícone; foco visível; `prefers-reduced-motion`

## Estados

| Estado | Tratamento |
|---|---|
| Hover | leve translateY / fundo teal 6% |
| Focus | outline 3px `rgba(78,158,245,0.32)` |
| Disabled | opacity 0.5–0.6 |
| Erro | fundo `#FFE9E9`, texto `#AE3030` |
| Sucesso | fundo `#E4F8F0`, texto `#167D55` |
| Loading | spinner na cor do botão (branco em primaryStrong) |
| Vazio | card acrylic + ícone muted + copy curta |

## Anti-padrões

- Azul hospitalar antigo `#1B5FA8`
- Emoji no lugar de ícone
- Mistura de raios 4px “bootstrap” com 28px Fluent
- Texto branco sobre `primary` claro (falha de contraste)
