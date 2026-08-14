# CLAUDE.md — Matemágicos

Contexto completo do projeto para retomar o trabalho em uma nova sessão sem
perder o que já foi decidido e construído. Leia isso antes de sugerir
mudanças — várias decisões aqui já passaram por iteração e correção de bugs.

---

## Visão geral

App educativo de matemática para crianças de 5 a 10 anos, com jogos de
múltipla escolha (soma, subtração, multiplicação, divisão, formas
geométricas, contagem). Projeto de estudo/portfólio (não publicado nas
lojas), mantido por um único desenvolvedor (Kauan) que alterna entre um
computador de casa e um do trabalho.

**Dois repositórios separados no GitHub:**

- **Back-end**: Spring Boot (pasta local costuma ser `Biblioteca`)
- **Front-end**: React Native + Expo (pasta local costuma ser `Matemagicos`)

---

## Stack

**Back-end:** Java 17, Spring Boot 3.4.5, Spring Security, Spring Data JPA
(Hibernate), MySQL 8, Maven, JWT (`jjwt` 0.12.6).

**Front-end:** React Native + Expo SDK ~54, TypeScript, React Navigation
(native-stack), `expo-audio`, `@react-native-async-storage/async-storage`.

---

## Estrutura do back-end

```
src/main/java/com/matemagicos/biblioteca/
├── MatemagicosApplication.java
├── config/
│   └── SecurityConfig.java          # só /auth/** e /actuator/health são públicos; resto exige JWT
├── security/
│   ├── JwtService.java              # gera/valida token
│   ├── JwtAuthenticationFilter.java # lê o header Authorization
│   └── JwtAuthenticationEntryPoint.java # garante 401 (não 403) em token ausente/inválido
├── controller/
│   ├── AuthController.java          # POST /auth/cadastro, /auth/login (ambos retornam token)
│   ├── UsuarioController.java       # GET /usuarios (protegido)
│   ├── DesempenhoJogoController.java # POST /desempenho (protegido)
│   └── RankingController.java       # GET /ranking (protegido)
├── DTO/
│   ├── CadastroRequestDTO, LoginRequestDTO, LoginResponseDTO, UsuarioDTO
│   ├── DesempenhoRequestDTO, DesempenhoResponseDTO
│   └── RankingItemDTO, RankingResponseDTO
├── exception/
│   └── GlobalExceptionHandler.java  # erros de validação em JSON; 500 não vaza detalhe interno (só loga)
├── models/
│   └── Usuario, Administrador, Jogo, DesempenhoJogo, AvaliacaoFinal, PontuacaoHistorico
├── repository/
│   └── um por entidade (UsuarioRepository tem findAllByOrderByTotalPontosDesc p/ ranking)
└── service/
    ├── UsuarioService.java          # BCrypt + cadastro/login/geração de token
    ├── DesempenhoJogoService.java   # salva partida + atualiza pontos/moedas do usuário
    └── RankingService.java          # monta top 20 + posição do usuário fora do top

src/main/resources/
├── application.properties           # senha e JWT_SECRET vêm de variável de ambiente (nunca hardcoded)
└── data.sql                         # popula os 6 jogos automaticamente (idempotente, com WHERE NOT EXISTS)

database/
└── 01_create_database.sql           # cria banco + 6 tabelas, com IF NOT EXISTS (nunca apaga dados)
```

### Regras de pontuação (em `DesempenhoJogoService`)

- 10 pontos por acerto
- 1 moeda mágica a cada 10 pontos
- Constantes ajustáveis: `PONTOS_POR_ACERTO`, `PONTOS_POR_MOEDA`

### Autenticação

- Login e cadastro retornam `{ usuario, token, refreshToken }`.
- **Access token** (`token`): JWT, dura só 30min (`jwt.expiration-ms` em
  `application.properties`). É o que viaja em toda requisição autenticada.
- **Refresh token** (`refreshToken`): não é JWT, é um UUID aleatório salvo na
  tabela `refresh_tokens` (dura 30 dias — `jwt.refresh-expiration-ms`). Usado só
  pra pedir um access token novo em `POST /auth/refresh`, sem precisar relogar.
  Rotacionado a cada uso (o antigo é revogado, um novo é devolvido). `POST
  /auth/logout` revoga o refresh token de propósito (logout de verdade, não só
  limpar o app).
- No front, o hook `useApiAutenticada` (`src/hooks/useApiAutenticada.ts`) cuida
  de tudo isso sozinho: se uma chamada autenticada tomar 401 (access token
  expirado), ele renova automaticamente com o refresh token e repete a chamada
  — a tela nem percebe. Só desloga de verdade se o refresh token também tiver
  expirado/for inválido.
- Rotas protegidas pegam o `idUsuario` do token via
  `(Integer) authentication.getDetails()` — **nunca** confiar num `idUsuario`
  vindo do corpo da requisição (risco de um usuário manipular dados de outro).
- **Recuperação de senha**: `POST /auth/esqueci-senha` (recebe email, sempre
  responde `ok:true` mesmo se o email não existir — evita enumeration attack)
  gera um código de 6 dígitos (tabela `password_reset_tokens`, válido 15min,
  uso único) e manda por email via `EmailService`/`spring-boot-starter-mail`.
  `POST /auth/redefinir-senha` (email + código + senha nova) valida e troca a
  senha, e revoga **todas** as sessões ativas do usuário (`refresh_tokens`) por
  segurança — se a senha mudou, ninguém deveria continuar logado em outro
  aparelho com a sessão antiga.

---

## Estrutura do front-end

```
src/
├── config/
│   └── api.ts                   # API_URL — MUDA conforme rede/dispositivo (ver seção abaixo)
├── context/
│   └── UsuarioContext.tsx       # estado global do usuário logado + persistência via AsyncStorage
├── services/
│   ├── authService.ts           # cadastro/login
│   ├── jogoService.ts           # POST /desempenho
│   └── rankingService.ts        # GET /ranking
├── game/
│   └── perguntas.ts             # gera perguntas por tipoOperacao + dificuldade, com variação de frase
├── screens/
│   ├── LoginScreen, CadastroScreen, HomeScreen
│   ├── JogoScreen.tsx           # tela ÚNICA reutilizável p/ todos os jogos (recebe tipoOperacao)
│   └── RankingScreen.tsx
├── components/
│   ├── BotaoGrande.tsx, CampoTexto.tsx
└── theme/
    └── colors.ts
```

### Navegação (`App.tsx`)

Stack: `Login → Cadastro/Home`. `Home → Jogo` (com params) e `Home → Ranking`.
Tela inicial decidida dinamicamente: se já tem sessão salva no AsyncStorage
(`estaLogado`), abre direto na `Home`; senão, `Login`. Enquanto checa,
mostra um loading (`AppNavigator` em `App.tsx`).

### Context (`UsuarioContext.tsx`)

Fonte única da verdade pro usuário logado — evita passar dados via
`route.params` de tela em tela. Expõe: `usuario`, `token`, `estaLogado`,
`carregando`, `logar()`, `deslogar()`, `atualizarUsuario()` (usado depois de
uma partida pra atualizar pontos/moedas sem precisar relogar). Persiste
tudo no AsyncStorage (`@matemagicos:sessao`).

### `JogoScreen.tsx` — como funciona

- Recebe via params: `idJogo`, `titulo`, `tipoOperacao`, `dificuldade`,
  `icone`, `cor` (definidos em `HomeScreen.tsx`, no array `JOGOS` — os
  `id` batem com a ordem de inserção do `data.sql` no back).
- Gera 10 perguntas de múltipla escolha (`game/perguntas.ts`) uma única vez
  no mount.
- Toca som de acerto/erro (`expo-audio`) + anima (fade entre perguntas,
  shake no erro, bounce no resultado final).
- Ao terminar, chama `POST /desempenho` e atualiza o Context com os novos
  totais.
- "Jogar de novo" usa `navigation.replace()` (recarrega a tela do zero, sem
  precisar resetar cada state manualmente).

### `api.ts` — ⚠️ PRECISA SER AJUSTADO A CADA REDE NOVA

```ts
export const API_URL = 'http://SEU_IP_AQUI:8080';
```

- Emulador Android: `http://10.0.2.2:8080`
- Web (`npx expo start` → `w`): `http://localhost:8080`
- Celular físico: IP real do computador na rede (`ipconfig` no Windows) — **muda toda vez que troca de rede/computador**. Isso já causou bugs reais (erro "Tempo esgotado") mais de uma vez.

---

## Configuração necessária em CADA computador novo

Nada disso é versionado no Git (por design — são segredos/config local):

1. **Variáveis de ambiente do Windows** (usuário, não sistema):
   - `DB_PASSWORD` — senha do MySQL **desse** computador (pode ser diferente em cada um)
   - `JWT_SECRET` — pode reaproveitar o mesmo valor entre computadores
   - `MAIL_USERNAME` — email Gmail dedicado ao projeto (ex: `matemagicos.app@gmail.com`), usado pra enviar os códigos de recuperação de senha
   - `MAIL_PASSWORD` — **senha de app** do Gmail (não é a senha normal da conta; gera em myaccount.google.com/apppasswords, precisa de verificação em 2 etapas ativada). Pode reaproveitar entre computadores.
   - Depois de criar, **fechar e abrir o VSCode de novo** (obrigatório)
2. **Banco de dados**: rodar `database/01_create_database.sql` no MySQL Workbench (cria as 6 tabelas vazias; `data.sql` popula os jogos sozinho quando o back sobe)
3. **`api.ts`**: ajustar o IP conforme a seção acima
4. **Maven**: `.\mvnw.cmd` deve funcionar sozinho (o `.mvn/wrapper/maven-wrapper.properties` já está no repositório — se não estiver, é porque não foi commitado; ver "Pegadinhas" abaixo)

---

## Pegadinhas já resolvidas (não repetir)

- **`mvnw` falhando**: precisa do arquivo `.mvn/wrapper/maven-wrapper.properties` commitado no repo. Se sumir, `mvn` (instalado manualmente) funciona como alternativa.
- **PowerShell bloqueando scripts** (`foi desabilitada neste sistema`): usar `npm.cmd`/`npx.cmd` em vez de `npm`/`npx`, ou rodar `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` uma vez.
- **403 em vez de 401** em rotas protegidas: Spring Security, sem um `AuthenticationEntryPoint` customizado, devolve 403 pra qualquer falha de autenticação (não só 401). Corrigido com `JwtAuthenticationEntryPoint`.
- **Som mudo na primeira resposta** (`expo-audio`): o player precisa de um "aquecimento" real — tocar o som uma vez (baixinho, `volume = 0.01`, sem pausar no meio) assim que `useAudioPlayerStatus(...).isLoaded` vira `true`. Interromper com `pause()` cedo demais NÃO resolve. `preloadAudioSource` não existe na versão instalada (1.1.1) — não usar.
- **Firewall do Windows**: pode bloquear o celular físico de acessar a API mesmo com tudo configurado certo. Testar primeiro pelo navegador do PC usando o IP (não `localhost`) pra isolar o problema.
- **MySQL com senha diferente por computador**: é normal e esperado — cada `DB_PASSWORD` é local.

---

## Decisões de arquitetura (e por quê)

- **Ranking é geral, não só "de amigos"**: não existe sistema de amizades no modelo de dados; implementar isso seria um projeto à parte. Ranking mostra todos os usuários cadastrados, ordenados por pontos.
- **Lista de jogos é fixa no front** (`HomeScreen.tsx`), não vem do back via `GET /jogos`: mais simples, e os `id`/`tipoOperacao`/`dificuldade` já espelham o que está no `data.sql`. Migrar pra buscar do back só faria sentido se um dia existir um painel de admin pra criar jogos dinamicamente.
- **Cadastro sem responsável/adulto**: aceitável pro estágio atual (projeto de estudo). Se um dia for publicado de verdade nas lojas, precisa revisar por causa da LGPD e das políticas de apps infantis — **não é bloqueante agora**.
- **`idUsuario` sempre vem do token, nunca do body**: decisão de segurança deliberada em `DesempenhoJogoController`.

---

## Convenções do projeto

- Nomes de variáveis, funções e comentários **em português** (o dev é brasileiro e prefere assim).
- Mensagens de erro voltadas pra usuário final, tom amigável (ex: "Não rolou 😕").
- DTOs de resposta sempre incluem `"ok": boolean` + `"erro"` ou `"mensagem"`.
- Back-end usa `HashMap` em vez de `Map.of()` quando algum valor pode ser `null` (`Map.of` lança exceção com null).

---

## Combinados de como trabalhar juntos

1. **Se um arquivo sumir do ambiente da IA** (acontece por limpeza automática entre sessões/mensagens), **pedir pro usuário reenviar antes de editar** — nunca reconstruir de memória sem avisar.
2. **Qualquer mudança que envolva o Postman**: sempre entregar a coleção `.json` **completa e atualizada**, pronta pra importar — nunca pedir pra adicionar campo/requisição manualmente.
3. **Qualquer mudança que envolva o banco de dados**: sempre entregar o `01_create_database.sql` **completo e atualizado** (com `IF NOT EXISTS`, nunca apagando dados existentes), pronto pra rodar no MySQL Workbench — nunca pedir pra criar tabela/coluna manualmente.
4. O usuário tem pouca experiência prévia com o ecossistema (Maven, Git, variáveis de ambiente) — explicações passo a passo, sem pular etapas, funcionam melhor que respostas condensadas.

---

## O que já foi implementado (checklist de fundação — completo)

1. ✅ Segurança: `/usuarios` e outras rotas protegidas por JWT
2. ✅ JWT completo (login E cadastro geram token)
3. ✅ Segredos fora do código (variáveis de ambiente)
4. ✅ Script SQL completo (6 tabelas) + `data.sql` (seed dos jogos, idempotente)
5. ✅ Código back-end sem duplicação (DTO mapping centralizado)
6. ✅ Erro 500 não vaza detalhe interno
7. ✅ Mensagens de erro por campo no front
8. ✅ Home mostra dados reais do usuário (via Context)
9. ✅ Context API (estado global do usuário)
10. ✅ Endpoints de resultado de jogo (`POST /desempenho`)
11. ✅ AsyncStorage (sessão persiste entre aberturas do app)
12. ✅ Estrutura de navegação dos jogos (tela única reutilizável)
13. ✅ Lista de jogos sincronizada com `data.sql`
14. ✅ Molde de jogo completo: perguntas, múltipla escolha, dificuldade, pontuação
15. ✅ Sons e animações
16. ✅ Sistema de ranking

## Possíveis próximos passos (nenhum é bloqueante)

- Painel de administrador (criar jogos dinamicamente, hoje só via `data.sql`)
- Mais variedade de perguntas / dificuldade "difícil"
- Tela de perfil / histórico de partidas (usando `desempenho_jogo` e `pontuacao_historico`, que já existem no banco)
- Revisão de LGPD/responsável — **só se for publicar de verdade nas lojas**
- `AvaliacaoFinalRepository` já existe mas não tem service/controller — reservado pra uma futura funcionalidade de feedback consolidado (ex: feedback por IA), não implementada ainda
