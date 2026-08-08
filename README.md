# 🧙‍♂️ Matemágicos

git add .
git commit -m "Matemágicos"
git push origin main
git pull origin main
npx expo start

App educativo de matemática para crianças de 5 a 10 anos, com jogos que estimulam o raciocínio lógico e o prazer pela matemática.

Este é o **front-end** (React Native + Expo). Ele se conecta a um back-end
próprio em Spring Boot (autenticação com JWT, MySQL) — veja o repositório do
back-end para instruções completas de configuração do banco e da API.

## ✨ Telas implementadas

1. **Login** — entrada do usuário com email e senha, com link para cadastro. Conectado à API (`POST /auth/login`).
2. **Cadastro** — criação de conta com nome, idade (5–10), email, senha e confirmação. Conectado à API (`POST /auth/cadastro`).
3. **Home (tela principal)** — lista de jogos matemáticos + card de progresso real do aluno (nome, pontos e moedas vindos do back-end).

## 🚀 Como rodar o projeto

```bash
# 1. Entre na pasta do projeto
cd C:\Users\Kauan\Documents\Matemagicos

# 2. Instale as dependências
npm install

# 3. Inicie o projeto
npx expo start
```

Depois, escaneie o QR code com o app **Expo Go** (Android/iOS) ou aperte `a` para abrir no emulador Android, `i` para iOS, ou `w` para web.

> ⚠️ O back-end (Spring Boot) precisa estar rodando para login/cadastro
> funcionarem. Configure a URL dele em `src/config/api.ts` — o padrão já vem
> ajustado para emulador Android (`10.0.2.2`).

## 📁 Estrutura de pastas

``
Matemagicos/
├── App.tsx                      # Navegação entre as telas
├── index.ts                     # Ponto de entrada do Expo
├── package.json
└── src/
    ├── components/
    │   ├── BotaoGrande.tsx      # Botão grande e arredondado
    │   └── CampoTexto.tsx       # Input com label (e opção de mostrar senha)
    ├── config/
    │   └── api.ts               # URL do back-end
    ├── services/
    │   └── authService.ts       # Chamadas à API (cadastro/login)
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── CadastroScreen.tsx
    │   └── HomeScreen.tsx
    └── theme/
        └── colors.ts            # Paleta de cores do app
``

## 🎨 Paleta de cores

- 🟣 Roxo principal: `#6C63FF`
- 🟠 Laranja: `#FFB347`
- 🟢 Verde-água: `#4ECDC4`
- 🟡 Amarelo: `#FFD93D`
- 🔴 Vermelho suave: `#FF6B6B`
- ⚪ Fundo: `#F7F8FC`

## 🎮 Jogos disponíveis (home)

1. ➕ Soma Mágica
2. ➖ Subtração Espacial
3. ✖️ Multiplicação Maluca
4. ➗ Divisão Divertida
5. 🔷 Formas Geométricas
6. 🔢 Contando até 100

> Por enquanto essa lista é só ilustrativa (dados fixos na tela) — a lógica de
> cada jogo ainda não foi implementada.

## 🔮 Próximos passos

- Persistir o usuário logado com **AsyncStorage** (hoje, ao fechar o app, sempre volta pro Login).
- Implementar a lógica de cada jogo.
- Adicionar sons e animações.
- Ranking entre amigos.
- 📌 Se o app for publicado de verdade nas lojas: revisar o fluxo de cadastro para envolver um responsável/adulto (LGPD e políticas de apps infantis).
