# CLAUDE.md — Matemágicos

Contexto completo do projeto pra retomar o trabalho sem perder o que já foi
decidido e construído. Leia isso inteiro antes de sugerir mudanças — várias
decisões aqui já passaram por iteração e correção de bugs, e repeti-las seria
retrabalho.

> **Nota de handoff (IA):** este arquivo foi escrito originalmente com apoio de
> outra IA (Claude) e agora o projeto passa a ser trabalhado com você. As
> Fases 1 e 2 do roadmap (ver seção "Checklist de melhorias" no fim) estão
> **completas**. **A tarefa atual é só a Fase 3** ("Conteúdo dos jogos") — não
> comece nenhuma outra fase sem o usuário pedir explicitamente.

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
(Hibernate), MySQL 8, Maven, JWT (`jjwt` 0.12.6), `spring-boot-starter-mail`
(envio de email via Gmail SMTP).

**Front-end:** React Native + Expo SDK ~54, TypeScript, React Navigation
(native-stack), `expo-audio`, `@react-native-async-storage/async-storage`,
`@react-native-community/netinfo` (detecção de conexão com a internet).

---

## Estrutura do back-end

```
src/main/java/com/matemagicos/biblioteca/
├── MatemagicosApplication.java
├── config/
│   ├── SecurityConfig.java          # só /auth/** e /actuator/health são públicos; resto exige JWT
│   └── RateLimitFilterConfig.java   # registra o RateLimitFilter em /auth/* e /usuarios/conta
├── security/
│   ├── JwtService.java              # gera/valida access token (JWT, 30min)
│   ├── JwtAuthenticationFilter.java # lê o header Authorization
│   ├── JwtAuthenticationEntryPoint.java # garante 401 (não 403) em token ausente/inválido
│   └── RateLimitFilter.java         # limita tentativas por IP+rota (login, cadastro, etc.)
├── controller/
│   ├── AuthController.java          # /auth/cadastro, /login, /refresh, /logout, /esqueci-senha,
│   │                                 # /redefinir-senha, /reenviar-verificacao, /verificar-email
│   ├── UsuarioController.java       # GET /usuarios, PUT /usuarios/perfil, DELETE /usuarios/conta
│   ├── DesempenhoJogoController.java # POST /desempenho, GET /desempenho/historico
│   └── RankingController.java       # GET /ranking
├── DTO/
│   ├── CadastroRequestDTO, LoginRequestDTO, LoginResponseDTO, UsuarioDTO
│   ├── RefreshRequestDTO, EsqueciSenhaRequestDTO, RedefinirSenhaRequestDTO
│   ├── VerificarEmailRequestDTO, EditarPerfilRequestDTO, ExcluirContaRequestDTO
│   ├── DesempenhoRequestDTO, DesempenhoResponseDTO, HistoricoItemDTO
│   └── RankingItemDTO, RankingResponseDTO
├── exception/
│   └── GlobalExceptionHandler.java  # erros de validação em JSON; 500 não vaza detalhe interno (só loga)
├── models/
│   ├── Usuario (com campo emailVerificado), Administrador, Jogo
│   ├── DesempenhoJogo, AvaliacaoFinal, PontuacaoHistorico
│   └── RefreshToken, PasswordResetToken, EmailVerificationToken
├── repository/
│   └── um por entidade (UsuarioRepository tem findAllByOrderByTotalPontosDesc p/ ranking;
│       vários têm métodos deleteByUsuario_IdUsuario / deleteByIdUsuario usados na exclusão de conta)
└── service/
    ├── UsuarioService.java          # cadastro/login/refresh/logout/esqueci-senha/redefinir-senha/
    │                                 # reenviar-verificacao/verificar-email/editarPerfil/excluirConta
    ├── DesempenhoJogoService.java   # salva partida + atualiza pontos/moedas + obterHistorico()
    ├── RankingService.java          # monta top 20 + posição do usuário fora do top
    ├── RefreshTokenService.java     # gera/valida/rotaciona/revoga refresh tokens
    ├── PasswordResetService.java    # código de recuperação de senha (6 dígitos, 15min)
    ├── EmailVerificationService.java # código de verificação de email (6 dígitos, 24h)
    ├── EmailService.java            # envia os dois emails acima via JavaMailSender
    └── FiltroDeNomeService.java     # valida nome (caracteres + palavras impróprias)

src/main/resources/
├── application.properties           # senha, JWT_SECRET, MAIL_USERNAME/PASSWORD vêm de variável
│                                     # de ambiente (nunca hardcoded)
└── data.sql                         # popula os 6 jogos automaticamente (idempotente, com WHERE NOT EXISTS)

database/
└── 01_create_database.sql           # cria banco + 9 tabelas, com IF NOT EXISTS (nunca apaga dados)
```

### Regras de pontuação (em `DesempenhoJogoService`)

- 10 pontos por acerto (`PONTOS_POR_ACERTO`, package-private — reaproveitado por
  `obterHistorico()` pra recalcular pontos de partidas antigas sem duplicar o número)
- 1 moeda mágica a cada 10 pontos (`PONTOS_POR_MOEDA`)
- Os pontos ganhos **não ficam salvos direto em `desempenho_jogo`** — só em
  `pontuacao_historico`, sem vínculo por id com a partida específica. Se
  `PONTOS_POR_ACERTO` mudar de valor um dia, partidas antigas exibidas no
  histórico vão refletir o valor novo (imprecisão histórica pequena, aceitável
  pro estágio atual — se incomodar no futuro, o certo é passar a salvar
  `pontosGanhos` direto em `DesempenhoJogo` na hora de registrar).

---

## Estrutura do front-end

```
src/
├── config/
│   └── api.ts                   # API_URL — MUDA conforme rede/dispositivo (ver seção abaixo)
├── context/
│   └── UsuarioContext.tsx       # estado global do usuário logado (token + refreshToken) +
│                                 # persistência via AsyncStorage
├── hooks/
│   ├── useApiAutenticada.ts     # renova o access token sozinho quando expira (401 -> refresh -> retry)
│   └── useConectividade.ts      # expõe se o celular tem internet, em tempo real (netinfo)
├── utils/
│   └── fetchComRetry.ts         # comRetry() — repete chamadas de LEITURA que falharam por
│                                 # conexão; NUNCA usar em ações que criam/alteram dado no servidor
├── theme/
│   ├── colors.ts
│   └── jogosVisual.ts           # ícone/cor/nome por tipoOperacao — compartilhado entre telas
├── services/
│   ├── authService.ts           # cadastro/login/refresh/logout/esqueci-senha/redefinir-senha/
│   │                             # verificar-email/reenviar-verificacao
│   ├── jogoService.ts           # POST /desempenho
│   ├── historicoService.ts      # GET /desempenho/historico
│   ├── rankingService.ts        # GET /ranking
│   └── perfilService.ts         # PUT /usuarios/perfil, DELETE /usuarios/conta
├── game/
│   └── perguntas.ts             # gera perguntas por tipoOperacao + dificuldade, com variação de frase
│                                 # (ALVO PRINCIPAL DA FASE 3 — ver checklist no fim do arquivo)
├── screens/
│   ├── LoginScreen, CadastroScreen, HomeScreen
│   ├── EsqueciSenhaScreen, RedefinirSenhaScreen   # recuperação de senha por código
│   ├── VerificarEmailScreen                        # confirmação de email por código
│   ├── PerfilScreen, EditarPerfilScreen, ExcluirContaScreen
│   ├── HistoricoScreen, EvolucaoScreen             # histórico de partidas + gráficos + insight
│   ├── JogoScreen.tsx           # tela ÚNICA reutilizável p/ todos os jogos (recebe tipoOperacao)
│   └── RankingScreen.tsx
├── components/
│   ├── BotaoGrande.tsx, CampoTexto.tsx
└── theme/
    └── colors.ts
```

### Navegação (`App.tsx`)

Stack completo: `Login`, `Cadastro`, `EsqueciSenha`, `RedefinirSenha`, `Home`,
`Perfil`, `EditarPerfil`, `ExcluirConta`, `VerificarEmail`, `Historico`,
`Evolucao`, `Jogo` (com params), `Ranking`. Tela inicial decidida
dinamicamente: se já tem sessão salva no AsyncStorage (`estaLogado`), abre
direto na `Home`; senão, `Login`. Enquanto checa, mostra um loading
(`AppNavigator` em `App.tsx`). Um banner flutuante global (`AvisoSemConexao`,
dentro do próprio `App.tsx`) aparece por cima de qualquer tela quando o
celular perde internet — não precisa de lógica em cada tela.

### Context (`UsuarioContext.tsx`)

Fonte única da verdade pro usuário logado — evita passar dados via
`route.params` de tela em tela. Expõe: `usuario`, `token`, `refreshToken`,
`estaLogado`, `carregando`, `logar(usuario, token, refreshToken)`,
`deslogar()`, `atualizarUsuario(parcial)`, `atualizarTokens(token, refreshToken)`.
Persiste tudo no AsyncStorage (`@matemagicos:sessao`). `deslogar()` já chama
`logoutApi()` (revoga o refresh token no back) antes de limpar localmente.

### Hooks de rede

- **`useApiAutenticada()`**: expõe `chamarApiAutenticada(fazerChamada)`. Qualquer
  chamada autenticada deve passar por aqui em vez de usar o token direto — se
  a chamada tomar 401 (token expirado), ele renova sozinho via `/auth/refresh`
  e repete, sem o usuário perceber. Se a renovação falhar por **falta de
  conexão** (`erro.semConexao`), NÃO desloga (pode ser só rede instável, não a
  sessão de fato expirada) — só desloga se o refresh token for realmente
  inválido/expirado.
- **`useConectividade()`**: hook simples baseado em `NetInfo.addEventListener`,
  usado só pelo banner global hoje.
- **`comRetry()`** (`utils/fetchComRetry.ts`): repete automaticamente uma
  chamada que falhou com `erro.semConexao === true` (nunca erro de negócio,
  tipo senha errada). **Só é usado em leituras** (buscar ranking, histórico) —
  nunca em ações que criam/alteram dado no servidor (registrar partida,
  editar perfil etc.), pra não arriscar duplicar caso a resposta se perca
  depois do servidor já ter processado.

### `JogoScreen.tsx` — como funciona

- Recebe via params: `idJogo`, `titulo`, `tipoOperacao`, `dificuldade`,
  `icone`, `cor` (definidos em `HomeScreen.tsx`, no array `JOGOS` — os
  `id` batem com a ordem de inserção do `data.sql` no back).
- Gera `TOTAL_PERGUNTAS` (10) perguntas de múltipla escolha (`game/perguntas.ts`)
  uma única vez no mount. **Esse número (10) é assumido em outros lugares do
  app** (ex: cálculo de percentual de acerto em `EvolucaoScreen.tsx`, via
  `PERGUNTAS_POR_PARTIDA`) — se mudar aqui, ajustar lá também.
- Toca som de acerto/erro (`expo-audio`) + anima (fade entre perguntas,
  shake no erro, bounce no resultado final).
- Ao terminar, chama `POST /desempenho` (via `useApiAutenticada`, **sem**
  `comRetry` — ver nota acima) e atualiza o Context com os novos totais.
- "Jogar de novo" usa `navigation.replace()` (recarrega a tela do zero, sem
  precisar resetar cada state manualmente).
- Se der erro (inclusive sem conexão), mostra botão manual de "Tentar salvar
  de novo" — de propósito manual, não automático, pelo motivo do parágrafo acima.

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
   - `MAIL_USERNAME` — email Gmail dedicado ao projeto (ex: `matemagicos.app@gmail.com`), usado pra enviar os códigos de recuperação de senha e verificação de email
   - `MAIL_PASSWORD` — **senha de app** do Gmail (não é a senha normal da conta; gera em myaccount.google.com/apppasswords, precisa de verificação em 2 etapas ativada na conta). Pode reaproveitar o mesmo valor entre computadores — a senha de app em si só precisa ser criada UMA VEZ; o que se repete por computador é só criar a variável de ambiente local com o mesmo valor.
   - Depois de criar/mudar qualquer uma, **fechar TODAS as janelas do VSCode e abrir de novo** (obrigatório — variável nova só vale pra processos abertos depois da criação)
2. **Banco de dados**: rodar `database/01_create_database.sql` no MySQL Workbench (cria as tabelas vazias com `IF NOT EXISTS`; `data.sql` popula os jogos sozinho quando o back sobe). Colunas novas em tabelas já existentes (ex: `email_verificado`) são adicionadas sozinhas pelo Hibernate (`spring.jpa.hibernate.ddl-auto=update`) — não precisa de `ALTER TABLE` manual.
3. **`api.ts`**: ajustar o IP conforme a seção acima
4. **Maven**: `.\mvnw.cmd` deve funcionar sozinho (o `.mvn/wrapper/maven-wrapper.properties` já está no repositório — se não estiver, é porque não foi commitado; ver "Pegadinhas" abaixo)
5. **npm/Expo**: pacotes como `@react-native-community/netinfo` já estão no
   `package.json` — um `npm install` normal depois do `git pull` já traz tudo.
   **Isso é diferente das variáveis de ambiente**: não precisa reinstalar nada
   manualmente em cada computador além do `npm install` de sempre.

---

## Pegadinhas já resolvidas (não repetir)

- **`mvnw` falhando**: precisa do arquivo `.mvn/wrapper/maven-wrapper.properties` commitado no repo. Se sumir, `mvn` (instalado manualmente) funciona como alternativa.
- **PowerShell bloqueando scripts** (`foi desabilitada neste sistema`): usar `npm.cmd`/`npx.cmd` em vez de `npm`/`npx`, ou rodar `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` uma vez.
- **403 em vez de 401** em rotas protegidas: Spring Security, sem um `AuthenticationEntryPoint` customizado, devolve 403 pra qualquer falha de autenticação (não só 401). Corrigido com `JwtAuthenticationEntryPoint`.
- **Som mudo na primeira resposta** (`expo-audio`): o player precisa de um "aquecimento" real — tocar o som uma vez (baixinho, `volume = 0.01`, sem pausar no meio) assim que `useAudioPlayerStatus(...).isLoaded` vira `true`. Interromper com `pause()` cedo demais NÃO resolve. `preloadAudioSource` não existe na versão instalada (1.1.1) — não usar.
- **Firewall do Windows**: pode bloquear o celular físico de acessar a API mesmo com tudo configurado certo. Testar primeiro pelo navegador do PC usando o IP (não `localhost`) pra isolar o problema.
- **MySQL com senha diferente por computador**: é normal e esperado — cada `DB_PASSWORD` é local.
- **`Could not resolve placeholder 'MAIL_USERNAME'` ao rodar `.\mvnw.cmd clean install`**: variável de ambiente criada mas o terminal/VSCode ainda não foi reaberto (variáveis novas só valem pra processos abertos depois da criação). Fechar TODAS as janelas do VSCode, reabrir, conferir com `echo $env:MAIL_USERNAME` no PowerShell. Dica: no dia a dia, `.\mvnw.cmd spring-boot:run` sobe o back sem rodar os testes (mais rápido que `clean install`).
- **App sem som/travando ao desligar o Wi-Fi durante teste no Expo Go**: isso é um efeito colateral do **modo de desenvolvimento**, não um bug de código. No Expo Go, o JS e os assets (sons via `require()`) são baixados em tempo real do Metro (`npx expo start`) pela mesma rede Wi-Fi — desligar o Wi-Fi corta essa conexão também, não só "a internet" no sentido do backend. Num build de produção de verdade (`EAS Build`), tudo isso já vem empacotado no app e funcionaria offline sem problema. **Pra testar cenário de "sem conexão com o backend" direito**: deixe o Wi-Fi ligado (mantém o Metro conectado) e pare só o back-end (Ctrl+C no terminal do Spring Boot) — isso simula exatamente o que o app precisa tratar, sem esse efeito colateral.
- **Rate limiting bloqueando até senha certa**: comportamento intencional de qualquer rate limiter de verdade (ver seção "Autenticação" abaixo) — não é bug, não tentar "corrigir" de novo permitindo que acerto sempre fure bloqueio ativo (isso anularia a proteção). Se incomodar demais no dia a dia, o ajuste correto é aumentar os números em `RateLimitFilter`.
- **Arquivo sumiu do outro computador** (ex: `RankingScreen.tsx` dando "Unable to resolve module"): quase sempre é commit/push esquecido no computador onde o arquivo foi criado/editado. Rodar `git status` nos dois computadores pra achar onde ficou só local, sem commit.

---

## Decisões de arquitetura (e por quê)

- **Ranking é geral, não só "de amigos"**: não existe sistema de amizades no modelo de dados; implementar isso seria um projeto à parte. Ranking mostra todos os usuários cadastrados, ordenados por pontos.
- **Lista de jogos é fixa no front** (`HomeScreen.tsx`), não vem do back via `GET /jogos`: mais simples, e os `id`/`tipoOperacao`/`dificuldade` já espelham o que está no `data.sql`. Migrar pra buscar do back só faria sentido se um dia existir um painel de admin pra criar jogos dinamicamente.
- **Cadastro sem responsável/adulto**: aceitável pro estágio atual (projeto de estudo). Se um dia for publicado de verdade nas lojas, precisa revisar por causa da LGPD e das políticas de apps infantis — **não é bloqueante agora**.
- **`idUsuario` sempre vem do token, nunca do body**: decisão de segurança deliberada em todos os controllers protegidos (`(Integer) authentication.getDetails()`).
- **Access token curto (30min) + refresh token longo (30 dias)**: antes era um token único de 24h. Ver seção "Autenticação" pra detalhes completos.
- **Verificação de email não bloqueia o login**: criança cadastra e já entra
  no app normal — só aparece um lembrete (Home e Perfil) até confirmar.
  Bloquear login por email não verificado seria mais frustrante que útil
  nesse tipo de app.
- **Rate limiting só conta ERROS nas rotas de senha/código** (`contarSoFalhas`
  em `RateLimitFilter`): uma tentativa certa nunca deve pesar contra o
  usuário. Mesmo assim, uma vez que o limite já estourou por erros
  acumulados, a próxima tentativa (mesmo certa) ainda fica bloqueada até a
  janela passar — isso é intencional e inerente a qualquer rate limiter de
  verdade (senão a proteção contra força bruta não protegeria nada).
- **Avatar personalizável NÃO faz parte da tela de perfil atual**: decisão
  deliberada de adiar pra quando a Fase 4 (gamificação/loja de moedas
  mágicas) for feita — fazer o avatar pela metade agora seria retrabalho.
  `EditarPerfilScreen.tsx` hoje só edita nome e idade.
- **Exclusão de conta apaga tudo, na ordem certa**: `desempenho_jogo` →
  `avaliacao_final` → `pontuacao_historico` → `refresh_tokens` /
  `password_reset_tokens` / `email_verification_tokens` → só por último o
  `usuario`. Tudo dentro de uma transação (`@Transactional`) — se uma tabela
  nova passar a referenciar `id_usuario` no futuro, adicionar a exclusão dela
  nessa mesma ordem (antes do `repository.delete(u)`), senão vai falhar por
  violação de chave estrangeira.
- **Histórico e gráficos de evolução reaproveitam o mesmo endpoint**
  (`GET /desempenho/historico`) — `EvolucaoScreen.tsx` faz toda a agregação
  (pontos por dia, percentual por tipo) no front, sem endpoint dedicado.
- **Gráficos são `View`s puras, sem biblioteca de gráfico**: decisão
  deliberada de não trazer dependência nova (SVG, Victory, etc.) pra um
  gráfico de barras simples — mantém o projeto mais leve.
- **`AvaliacaoFinalRepository`/tabela `avaliacao_final` existem mas sem
  service/controller de verdade** — só são tocadas hoje na exclusão de conta
  (limpeza). Reservadas pra uma futura funcionalidade de feedback consolidado
  (ex: feedback por IA), ainda não implementada.

---

## Convenções do projeto

- Nomes de variáveis, funções e comentários **em português** (o dev é brasileiro e prefere assim).
- Mensagens de erro voltadas pra usuário final, tom amigável (ex: "Não rolou 😕", "Quase lá!"). Nunca tom crítico/negativo com a criança, mesmo em telas de erro ou de desempenho fraco (ver `EvolucaoScreen.tsx`, que propositalmente nunca diz "você é ruim em X").
- DTOs de resposta sempre incluem `"ok": boolean` + `"erro"` ou `"mensagem"`.
- Back-end usa `HashMap` em vez de `Map.of()` quando algum valor pode ser `null` (`Map.of` lança exceção com null).
- Erros de rede no front sempre marcados com `erro.semConexao = true` (falha de verdade — timeout/sem internet) vs `erro.status` (erro HTTP normal, tipo senha errada ou validação) — essa distinção é usada por `useApiAutenticada` e `comRetry` pra decidir o que fazer.
- Evitar duplicação também no front: mapeamentos compartilhados (tipo ícone/cor por jogo) ficam em `theme/`, não repetidos tela por tela.

---

## Combinados de como trabalhar juntos

1. **Se um arquivo sumir do ambiente da IA** (acontece por limpeza automática entre sessões/mensagens), **pedir pro usuário reenviar antes de editar** — nunca reconstruir de memória sem avisar.
2. **Qualquer mudança que envolva o Postman**: sempre entregar a coleção `.json` **completa e atualizada**, pronta pra importar — nunca pedir pra adicionar campo/requisição manualmente.
3. **Qualquer mudança que envolva o banco de dados**: sempre entregar o `01_create_database.sql` **completo e atualizado** (com `IF NOT EXISTS`, nunca apagando dados existentes), pronto pra rodar no MySQL Workbench — nunca pedir pra criar tabela/coluna manualmente.
4. **Qualquer mudança que exija algo fora do editor** (variável de ambiente, conta externa tipo Gmail, configuração do sistema): sempre avisar explicitamente o que precisa ser feito, e separar claramente o que é "faça uma vez só, vale pra sempre" (ex: gerar uma senha de app) do que é "precisa repetir em cada computador" (ex: criar a variável de ambiente local) — o usuário alterna entre dois computadores.
5. O usuário tem pouca experiência prévia com o ecossistema (Maven, Git, variáveis de ambiente) — explicações passo a passo, sem pular etapas, funcionam melhor que respostas condensadas.

---

## Autenticação (completo)

- Cadastro e login retornam `{ usuario, token, refreshToken }`.
- **Access token** (`token`): JWT, dura só 30min (`jwt.expiration-ms` em
  `application.properties`). É o que viaja em toda requisição autenticada.
- **Refresh token** (`refreshToken`): não é JWT, é um UUID aleatório salvo na
  tabela `refresh_tokens` (dura 30 dias — `jwt.refresh-expiration-ms`). Usado só
  pra pedir um access token novo em `POST /auth/refresh`, sem precisar relogar.
  **Rotacionado a cada uso** (o antigo é revogado, um novo é devolvido — se um
  refresh token vazar e for usado por outra pessoa, o próximo uso do dono
  original já invalida a sessão do invasor). `POST /auth/logout` revoga o
  refresh token de propósito (logout de verdade, não só limpar o app).
- No front, `useApiAutenticada` (`src/hooks/useApiAutenticada.ts`) cuida de
  tudo isso sozinho: se uma chamada autenticada tomar 401 (access token
  expirado), ele renova automaticamente com o refresh token e repete a chamada
  — a tela nem percebe. Só desloga de verdade se o refresh token também tiver
  expirado/for inválido — **nunca** desloga se a renovação falhar por falta de
  conexão (ver `erro.semConexao`), pra não derrubar sessão só porque o celular
  ficou sem internet num momento ruim.
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
- **Verificação de email**: cadastro já dispara um código de 6 dígitos
  automaticamente (tabela `email_verification_tokens`, válido 24h, uso único),
  mas **não bloqueia o login** — o usuário entra normal e só vê um aviso
  discreto na Home e no Perfil (`usuario.emailVerificado === false`) até
  confirmar. Rotas: `POST /auth/verificar-email` (email + código) e
  `POST /auth/reenviar-verificacao` (só email, reaproveita o
  `EsqueciSenhaRequestDTO` já que o formato é igual). Envio de email nunca
  quebra o cadastro (try/catch silencioso) — se o servidor de email falhar, o
  usuário só reenvia depois.
- **Rate limiting**: `RateLimitFilter` (janela fixa, em memória, por IP + rota)
  protege as rotas de `/auth/**` e `/usuarios/conta` contra spam/força bruta —
  ex: 8 tentativas erradas de login por minuto, 3 pedidos de "esqueci senha"
  por 15min, 5 senhas erradas por 15min pra excluir conta. Reseta quando o
  back reinicia. Devolve 429 com `{ok:false, erro:"Muitas tentativas..."}`
  quando estoura o limite. **Isso pode atrapalhar testes manuais repetidos no
  Postman** — se aparecer 429 testando, é o limite, não bug; espere a janela
  passar ou reinicie o back. Login/redefinir-senha/verificar-email/excluir-conta
  só contam ERROS pro limite (`contarSoFalhas`) — um acerto zera o contador na
  hora. **Importante entender**: uma vez que o limite já estourou, a PRÓXIMA
  tentativa fica bloqueada mesmo que seja a senha certa, até a janela passar —
  isso é intencional (é assim que rate limiting protege contra força bruta de
  verdade em qualquer sistema sério). Não é bug pra "consertar" de novo — se a
  criança estiver travando demais no dia a dia, a solução certa é aumentar os
  números em `RateLimitFilter`, não tentar deixar acerto ignorar bloqueio já ativo.
- **Filtro de nome** (`FiltroDeNomeService`): protege o ranking público contra
  nomes impróprios. Duas camadas, aplicadas no cadastro E na edição de perfil:
  (1) `@Pattern` nos DTOs só aceita letras/espaço/hífen/apóstrofo (barra
  número, símbolo, emoji); (2) `contemPalavraProibida()` normaliza o texto
  (sem acento, minúsculo, tenta desfazer espaçamento e leetspeak básico tipo
  "p0rra") e compara com uma lista de termos ofensivos em português. Não é
  moderação de conteúdo completa, só uma primeira barreira.

---

## Tratamento de sem internet (front)

`useConectividade()` (usa `@react-native-community/netinfo`) alimenta um
banner flutuante global em `App.tsx` que aparece em qualquer tela quando o
celular perde conexão — não precisa mexer tela por tela. Erros de rede de
verdade (não erros de negócio tipo senha errada) vêm marcados com
`erro.semConexao = true` nos services (`authService`, `jogoService`,
`rankingService`, `historicoService`, `perfilService`). `utils/fetchComRetry.ts`
(`comRetry`) repete automaticamente só chamadas de LEITURA marcadas assim (ex:
buscar ranking, buscar histórico) — **nunca** envolver uma ação que cria ou
altera dado no servidor (registrar desempenho, editar perfil, excluir conta)
nisso, pra não arriscar duplicar/repetir em caso da resposta se perder depois
do servidor já ter processado; essas mantêm botão de "tentar de novo" manual.

---

## Perfil e progresso do usuário

### `PerfilScreen.tsx`

Acessada tocando no avatar da Home. Mostra nome, email (com o mesmo aviso de
"confirme seu email" da Home se `emailVerificado === false`), idade, nível
escolar (se preenchido), total de pontos e moedas mágicas, link pro ranking,
link pro histórico de partidas, link pra evolução, link "✏️ Editar perfil", e
botão de sair. Link discreto "Excluir minha conta" no fim (texto pequeno,
de propósito — ação irreversível não deveria ser fácil de tocar sem querer).
Não faz chamada nova pros dados do próprio usuário — usa o `usuario` que já
vem do `UsuarioContext`.

### `HistoricoScreen.tsx` / `GET /desempenho/historico`

Últimas 50 partidas do usuário, mais recente primeiro. Ver nota sobre
`PONTOS_POR_ACERTO` na seção do back-end acima (pontos recalculados, não
salvos direto na partida).

### `EvolucaoScreen.tsx`

Dois gráficos simples (`View`s puras, sem dependência nova) — pontos por dia
(últimos 7 dias com atividade) e percentual de acerto por tipo de jogo. Não
usa endpoint novo (reaproveita o histórico). Assume 10 perguntas por partida
(`PERGUNTAS_POR_PARTIDA`, mesmo valor de `TOTAL_PERGUNTAS` em `JogoScreen.tsx`
— ajustar os dois juntos se mudar). Ícone/cor/nome por tipo em
`theme/jogosVisual.ts`, compartilhado com `HistoricoScreen.tsx`.

**Cartão de destaques** (ponto forte / a melhorar): no topo da tela, calculado
a partir do mesmo dado agregado por tipo — sem chamada nova. Só considera um
tipo se já foi jogado pelo menos 2 vezes (`LIMIAR_PARTIDAS_PARA_INSIGHT`), e só
destaca "ponto forte vs. praticar mais" se a diferença for de pelo menos 10
pontos percentuais (`DIFERENCA_MINIMA_PARA_DESTACAR`) — caso contrário mostra
mensagem neutra. Tom sempre encorajador, nunca "você é ruim em X".

### `EditarPerfilScreen.tsx` / `PUT /usuarios/perfil`

Editar só **nome e idade** por enquanto (avatar fica pra Fase 4 — ver
"Decisões de arquitetura"). Nome passa pelas mesmas validações do cadastro.

### `ExcluirContaScreen.tsx` / `DELETE /usuarios/conta`

Exige a senha atual (dupla confirmação: campo de senha + `Alert.alert` nativo
antes de executar). Ver ordem de exclusão em "Decisões de arquitetura".

---

## Referência rápida de endpoints

Lista completa pra consulta rápida (a coleção do Postman tem todos, com
descrição de cada um — ver `Matemagicos_postman_collection.json`).

| Método | Rota | Autenticação | Body |
| --- | --- | --- | --- |
| POST | `/auth/cadastro` | Pública | `{ nome, idade, email, senha, nivelEscolar? }` |
| POST | `/auth/login` | Pública | `{ email, senha }` |
| POST | `/auth/refresh` | Pública (usa refreshToken) | `{ refreshToken }` |
| POST | `/auth/logout` | Pública (usa refreshToken) | `{ refreshToken }` |
| POST | `/auth/esqueci-senha` | Pública | `{ email }` |
| POST | `/auth/redefinir-senha` | Pública | `{ email, codigo, novaSenha }` |
| POST | `/auth/reenviar-verificacao` | Pública | `{ email }` |
| POST | `/auth/verificar-email` | Pública | `{ email, codigo }` |
| GET | `/usuarios` | JWT | — |
| PUT | `/usuarios/perfil` | JWT | `{ nome, idade }` |
| DELETE | `/usuarios/conta` | JWT | `{ senha }` |
| POST | `/desempenho` | JWT | `{ idJogo, acertosPartida, tempoGasto }` |
| GET | `/desempenho/historico` | JWT | — |
| GET | `/ranking` | JWT | — |
| GET | `/actuator/health` | Pública | — |

Rotas de `/auth/**` e `/usuarios/conta` têm rate limiting (ver seção
"Autenticação" acima) — repetir uma chamada rápido demais pode devolver 429
de propósito.

---

## O que já foi implementado (Fases 1 e 2 — completas)

**Fundação técnica:**

1. ✅ Segurança: rotas protegidas por JWT
2. ✅ JWT completo com refresh token de sessão longa (access 30min + refresh 30 dias, rotação, revogação)
3. ✅ Segredos fora do código (variáveis de ambiente)
4. ✅ Script SQL completo (9 tabelas) + `data.sql` (seed dos jogos, idempotente)
5. ✅ Código back-end sem duplicação (DTO mapping centralizado)
6. ✅ Erro 500 não vaza detalhe interno
7. ✅ Mensagens de erro por campo no front
8. ✅ Recuperação de senha por código (email)
9. ✅ Verificação de email por código (não bloqueia login)
10. ✅ Rate limiting (login, cadastro, esqueci-senha, redefinir-senha, verificar-email, reenviar-verificação, excluir conta)
11. ✅ Filtro de nome impróprio (cadastro e edição de perfil)
12. ✅ Tratamento de sem-internet (banner global) + retry automático seguro (só leitura)

**Perfil e progresso:**
13. ✅ Home mostra dados reais do usuário (via Context)
14. ✅ Context API (estado global do usuário)
15. ✅ Endpoints de resultado de jogo (`POST /desempenho`)
16. ✅ AsyncStorage (sessão persiste entre aberturas do app)
17. ✅ Estrutura de navegação dos jogos (tela única reutilizável)
18. ✅ Lista de jogos sincronizada com `data.sql`
19. ✅ Molde de jogo completo: perguntas, múltipla escolha, dificuldade, pontuação
20. ✅ Sons e animações
21. ✅ Sistema de ranking
22. ✅ Tela de perfil
23. ✅ Histórico de partidas (`GET /desempenho/historico`)
24. ✅ Gráficos de evolução (pontos por dia + acerto por tipo)
25. ✅ Indicador de ponto forte / a melhorar
26. ✅ Editar perfil (nome, idade)
27. ✅ Excluir conta (com exclusão em cascata correta + confirmação de senha)

---

## Checklist de melhorias (roadmap completo)

Lista maior de tudo que pode ser adicionado/melhorado, organizada por fase.
**Fases 1 e 2 estão prontas** (ver checklist acima). As fases seguintes são
possíveis próximos passos, nenhuma é bloqueante.

### 🥉 Fase 3 — Conteúdo dos jogos (**TAREFA ATUAL — só isso por enquanto**)

14. Dificuldade "difícil" de verdade (hoje só fácil/médio existem em `game/perguntas.ts`)
15. Mais variações de pergunta (formato de problema/texto: "Maria tinha 5 maçãs...")
16. Repetir só as perguntas que errou no fim de uma partida
17. Modo "sem pressão" sem timer
18. Dificuldade adaptativa (sobe/desce sozinha conforme os acertos)
19. Jogo de sequência numérica (completar padrões: 2, 4, 6, __)
20. Jogo de comparação (maior/menor/igual com símbolos < > =)
21. Jogo de relógio/horas
22. Jogo de dinheiro (reconhecer cédulas/moedas, somar valores)
23. Jogo de frações (introdução simples, visual, pra 8-10 anos)

**Antes de começar a Fase 3:** o arquivo-chave é `src/game/perguntas.ts`
(gera perguntas por `tipoOperacao` + `dificuldade`) — leia ele primeiro, não
foi revisado neste handoff. Novos jogos (sequência, comparação, relógio,
dinheiro, frações) provavelmente precisam de: novo `tipoOperacao` em
`perguntas.ts`, nova entrada no array `JOGOS` de `HomeScreen.tsx`, nova linha
correspondente em `data.sql` (**lembrar do combinado #3**: entregar o `.sql`
completo, nunca pedir pra rodar `INSERT` manual), e possivelmente um ícone
novo em `theme/jogosVisual.ts` se o tipo aparecer em histórico/evolução.
`JogoScreen.tsx` já é genérica o bastante pra não precisar de mudança
estrutural pra tipos de jogo novos, contanto que `perguntas.ts` devolva o
mesmo formato de `Pergunta` (múltipla escolha) — se um jogo novo precisar de
UI diferente (ex: relógio visual, cédulas de dinheiro), aí sim pode exigir
mudança na tela ou uma tela nova.

### Fases seguintes (NÃO fazer agora, só se o usuário pedir explicitamente)

**Fase 4 — Gamificação:** conquistas/medalhas, streak diário, barra de
progresso por jogo, níveis/títulos, avatar customizável, loja de recompensas
com moedas mágicas.

**Fase 5 — Experiência infantil (UX):** onboarding/tutorial inicial,
boas-vindas por jogo, feedback sonoro/visual mais rico, mascote do app,
leitura em voz alta das perguntas, tamanho de fonte ajustável, modo escuro,
teste com criança real.

**Fase 6 — Feedback inteligente:** implementar `AvaliacaoFinalRepository`
(service + controller, hoje só usado na exclusão de conta), feedback
automático de desempenho, sugestão de próximo jogo.

**Fase 7 — Painel de administrador:** usar a entidade `Administrador`, CRUD
de jogos via painel, gerenciar usuários, moderar ranking.

**Fase 8 — Painel dos pais:** cadastro com email de responsável, relatório de
desempenho, limite de tempo de uso, aviso de pausa.

**Fase 9 — Engajamento:** notificações push, mensagem de "sentimos sua falta".

**Fase 10 — Robustez de produção:** testes automatizados (back e front), logs
estruturados, monitoramento, backup automático do banco.

**Fase 11 — Legal e conformidade:** política de privacidade, termos de uso,
revisão LGPD séria, classificação indicativa (**só relevante se for
publicar de verdade nas lojas**).

**Fase 12 — Publicação:** hospedagem do backend em produção, banco em
produção, HTTPS + domínio fixo, ícone/splash finalizados, EAS Build,
screenshots, descrição da loja, conta de desenvolvedor, assinatura do app.
