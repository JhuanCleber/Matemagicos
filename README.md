# Matemágicos — Setup completo (Banco + Back + Front)

Este guia conecta as três pontas: **MySQL**, **Spring Boot** e **React Native
(Expo)**. Pra contexto completo do projeto (decisões, pegadinhas já
resolvidas, roadmap), ver `CLAUDE.md` na raiz do repositório do back-end.

## 0. Pré-requisitos (instalar antes de tudo)

- **JDK 17**
- **Maven** (o `mvnw`/`mvnw.cmd` do projeto depende da pasta `.mvn/wrapper`, que
  às vezes não é copiada corretamente entre computadores — se der erro ao
  rodar `mvnw`, instale o Maven manualmente e use `mvn` direto, é mais confiável)
- **MySQL Server + MySQL Workbench**
- **Node.js** (para o front-end)
- **Postman** (para testar a API)
- **Um Gmail dedicado ao projeto** (ex: `matemagicos.app@gmail.com`), usado
  pra enviar os códigos de recuperação de senha e verificação de email — ver
  seção 1 abaixo

---

## 1. Variáveis de ambiente (fazer uma vez por computador)

O projeto **não tem senha nem chave secreta no código** — tudo vem de
variáveis de ambiente do Windows. Crie estas quatro (Painel de Controle >
Variáveis de Ambiente > Variáveis de usuário > Novo):

| Variável | Valor |
| --- | --- |
| `DB_PASSWORD` | a senha do MySQL **desse** computador (pode ser diferente em cada máquina) |
| `JWT_SECRET` | uma chave secreta para assinar os tokens (pode reaproveitar a mesma de outro computador) |
| `MAIL_USERNAME` | o email Gmail completo dedicado ao projeto (ex: `matemagicos.app@gmail.com`) |
| `MAIL_PASSWORD` | uma **senha de app** do Gmail (não é a senha normal da conta) — gerar em `myaccount.google.com/apppasswords` (precisa da verificação em 2 etapas ativada na conta primeiro). Pode reaproveitar o mesmo valor entre computadores: a senha de app só precisa ser **criada uma vez**; o que se repete em cada computador novo é só criar a variável de ambiente local com esse mesmo valor. |

Depois de criar/mudar qualquer uma, **feche TODAS as janelas do VSCode e abra
de novo** — ele só enxerga variáveis de ambiente criadas antes de ser aberto.
Confira no PowerShell se pegou certo: `echo $env:MAIL_USERNAME`.

---

## 2. Banco de Dados (MySQL Workbench)

1. Abra o MySQL Workbench e conecte em `localhost:3306` (usuário `root`, senha = a que você configurou nesse MySQL — a mesma do `DB_PASSWORD` acima).
2. Vá em **File > Open SQL Script** e abra:

   ```
   database\01_create_database.sql
   ```

3. Execute o script (raio / Ctrl+Shift+Enter). Ele cria o banco `app_biblioteca` e **todas as 9 tabelas**:
   - `usuario`, `administrador`, `jogo`, `desempenho_jogo`, `avaliacao_final`, `pontuacao_historico` (fundação)
   - `refresh_tokens` (sessões de login longa duração)
   - `password_reset_tokens` (códigos de recuperação de senha)
   - `email_verification_tokens` (códigos de verificação de email)
4. Confirme em `Schemas > app_biblioteca > Tables`.

> O script usa `CREATE TABLE IF NOT EXISTS`, então é seguro rodar de novo — nunca apaga dados existentes. O Hibernate (`ddl-auto=update`) também cria/ajusta tabelas e colunas novas sozinho quando o Spring Boot sobe, mesmo sem rodar o script manualmente.

---

## 3. Back-end (Spring Boot)

```powershell
cd C:\Users\Kauan\Documents\Biblioteca
.\mvnw.cmd spring-boot:run
```

> No dia a dia, prefira `spring-boot:run` a `clean install` — o segundo roda
> os testes toda vez (mais lento) e falha se as variáveis de ambiente
> (`MAIL_USERNAME` etc.) não estiverem visíveis nesse terminal.

Saída esperada (resumida):

```
Tomcat started on port 8080
Started MatemagicosApplication in X.XX seconds
```

### Endpoints disponíveis

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
| GET | `/usuarios` | **JWT** | — |
| PUT | `/usuarios/perfil` | **JWT** | `{ nome, idade }` |
| DELETE | `/usuarios/conta` | **JWT** | `{ senha }` |
| POST | `/desempenho` | **JWT** | `{ idJogo, acertosPartida, tempoGasto }` |
| GET | `/desempenho/historico` | **JWT** | — |
| GET | `/ranking` | **JWT** | — |
| GET | `/actuator/health` | Pública | — |

> Rotas com **JWT** exigem `Authorization: Bearer <token>` no header. O
> `token` (access token) vem do login/cadastro e vale só **30 minutos** — o
> app renova ele sozinho usando o `refreshToken` (que vale 30 dias), sem
> precisar relogar. Rotas de `/auth/**` e `/usuarios/conta` têm rate limiting
> — bater na mesma rota rápido demais devolve `429` de propósito.

### Testar pelo Postman (recomendado)

Importe a coleção `Matemagicos_postman_collection.json` (Postman > Import).
Ela vem com **14 requisições numeradas na ordem certa** — cadastro, login,
listar usuários, editar perfil, excluir conta, registrar desempenho, ranking,
histórico, refresh, logout, esqueci senha, redefinir senha, reenviar
verificação, verificar email — e **captura o token e o refreshToken
automaticamente** depois do login/cadastro/refresh, sem precisar copiar/colar
nada.

> Os códigos de recuperação de senha e verificação de email chegam por email
> de verdade — não tem como automatizar essa parte no Postman. Use um email
> seu real como conta de teste (não dá pra testar esse fluxo completo com um
> email fictício tipo `teste@teste.com`).

---

## 4. Front-end (React Native + Expo)

```powershell
cd C:\Users\Kauan\Documents\Matemagicos
npm install
npx expo start
```

O `npm install` já traz todas as dependências do projeto, incluindo
`@react-native-community/netinfo` (detecção de conexão com a internet) — não
precisa instalar nada manualmente além disso.

### URL do backend

Está em `src/config/api.ts`:

```typescript
export const API_URL = 'http://SEU_IP_AQUI:8080';
```

- **Emulador Android**: `http://10.0.2.2:8080`
- **iOS simulator** ou **web** (`npx expo start` → `w`): `http://localhost:8080`
- **Dispositivo físico**: descubra o IP da máquina (`ipconfig` no Windows) e use `http://SEU_IP:8080`. O celular precisa estar no **mesmo Wi-Fi** — e esse IP muda toda vez que troca de rede/computador.

---

## 5. Fluxo de teste ponta a ponta

1. Suba o back: `.\mvnw.cmd spring-boot:run` (aguarde `Started MatemagicosApplication`).
2. Suba o front: `npx expo start` → abra com `a` (Android) ou `w` (web).
3. No app, toque em **"Criar minha conta"**.
4. Preencha nome, idade, um **email seu de verdade** (pra receber o código de verificação) e senha.
5. Toque em **"Criar minha conta"**. Deve aparecer "🎉 Conta criada!" e ir para a Home — já mostrando nome, pontos e moedas reais vindos do back.
6. Confira sua caixa de entrada (e spam) — deve ter chegado um código de verificação de email. Vá em **Perfil > (aviso "Confirme seu email")** e digite o código.
7. Jogue uma partida qualquer e confira se o resultado aparece na Home/Perfil/Histórico.
8. Toque no avatar pra ver o **Perfil** — histórico de partidas, evolução (gráficos), editar perfil.
9. Volte pro Login, saia, e tente entrar de novo com o mesmo email/senha.
10. Pra confirmar que está no banco, abra o MySQL Workbench:

    ```sql
    SELECT * FROM app_biblioteca.usuario;
    ```

    A senha aparece como hash `$2a$10$...` (BCrypt), nunca em texto puro.

---

## 6. Estrutura atual do projeto

### Back (Spring Boot)

```
src/main/java/com/matemagicos/biblioteca/
├── MatemagicosApplication.java
├── config/
│   ├── SecurityConfig.java            # só /auth/** e /actuator/health são públicos
│   └── RateLimitFilterConfig.java     # registra o rate limiting em /auth/* e /usuarios/conta
├── security/
│   ├── JwtService.java                # gera/valida access token (JWT, 30min)
│   ├── JwtAuthenticationFilter.java   # lê o header Authorization
│   ├── JwtAuthenticationEntryPoint.java
│   └── RateLimitFilter.java           # limita tentativas por IP+rota
├── controller/
│   ├── AuthController.java            # cadastro/login/refresh/logout/esqueci-senha/
│   │                                   # redefinir-senha/reenviar-verificacao/verificar-email
│   ├── UsuarioController.java         # listar/editar perfil/excluir conta
│   ├── DesempenhoJogoController.java  # registrar partida + histórico
│   └── RankingController.java
├── DTO/                                # um DTO por formato de request/response
├── exception/
│   └── GlobalExceptionHandler.java    # erros de validação em JSON; 500 não vaza detalhe interno
├── models/                             # Usuario, Administrador, Jogo, DesempenhoJogo,
│                                        # AvaliacaoFinal, PontuacaoHistorico, RefreshToken,
│                                        # PasswordResetToken, EmailVerificationToken
├── repository/                         # um por entidade
└── service/
    ├── UsuarioService.java             # toda a lógica de conta (cadastro até exclusão)
    ├── DesempenhoJogoService.java      # partidas + histórico
    ├── RankingService.java
    ├── RefreshTokenService.java
    ├── PasswordResetService.java
    ├── EmailVerificationService.java
    ├── EmailService.java               # envia os emails via JavaMailSender
    └── FiltroDeNomeService.java        # valida nome (caracteres + palavras impróprias)

src/main/resources/
├── application.properties              # tudo sensível vem de variável de ambiente
└── data.sql                            # popula os 6 jogos automaticamente (idempotente)

database/
└── 01_create_database.sql              # cria banco + 9 tabelas, com IF NOT EXISTS
```

### Front (React Native + Expo)

```
src/
├── config/
│   └── api.ts
├── context/
│   └── UsuarioContext.tsx              # usuário logado + token + refreshToken (AsyncStorage)
├── hooks/
│   ├── useApiAutenticada.ts            # renova o token sozinho quando expira
│   └── useConectividade.ts             # detecta se tem internet, em tempo real
├── utils/
│   └── fetchComRetry.ts                # retry automático (só leituras)
├── theme/
│   ├── colors.ts
│   └── jogosVisual.ts                  # ícone/cor/nome por tipo de jogo
├── services/                            # authService, jogoService, historicoService,
│                                         # rankingService, perfilService
├── game/
│   └── perguntas.ts                    # gera as perguntas (ALVO DA FASE 3 ATUAL)
├── screens/                             # Login, Cadastro, EsqueciSenha, RedefinirSenha, Home,
│                                         # VerificarEmail, Perfil, EditarPerfil, ExcluirConta,
│                                         # Historico, Evolucao, Jogo, Ranking
└── components/
    ├── BotaoGrande.tsx
    └── CampoTexto.tsx
```

---

## 7. Próximos passos (Fase 3 — em andamento)

O roadmap completo (Fases 1 a 12, com o que já está pronto e o que falta)
está detalhado no `CLAUDE.md`. Resumo da fase atual — **conteúdo dos jogos**:

- Dificuldade "difícil" de verdade
- Mais variações de pergunta (formato de problema/texto)
- Repetir só as perguntas erradas no fim de uma partida
- Modo "sem pressão" sem timer
- Dificuldade adaptativa
- Jogos novos: sequência numérica, comparação (`<` `>` `=`), relógio/horas, dinheiro, frações

📌 Se um dia o app for publicado de verdade (Play Store/App Store): revisar o
fluxo de cadastro para incluir um responsável/adulto, por causa da LGPD e das
políticas de apps infantis das lojas. Não é bloqueante para o projeto atual
(uso educacional/portfólio).
