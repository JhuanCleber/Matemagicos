# 🧙‍♂️ Matemágicos

App educativo de matemática para crianças de 5 a 10 anos, com jogos que estimulam o raciocínio lógico e o prazer pela matemática.

## ✨ Telas implementadas

1. **Login** — entrada do usuário com email e senha, com link para cadastro.
2. **Cadastro** — criação de conta com nome, idade (5–10), email, senha e confirmação.
3. **Home (tela principal)** — lista de jogos matemáticos + card de progresso do aluno.

## 🚀 Como rodar o projeto

```bash
# 1. Instale o Expo CLI (caso não tenha)
npm install -g expo-cli

# 2. Entre na pasta do projeto
cd C:\Users\Kauan\Documents\Matemagicos

# 3. Instale as dependências
npm install

# 4. Inicie o projeto
npx expo start
```

Depois, escaneie o QR code com o app **Expo Go** (Android/iOS) ou aperte `a` para abrir no emulador Android, `i` para iOS, ou `w` para web.

## 📁 Estrutura de pastas

```
Matemagicos/
├── App.js                       # Navegação entre as 3 telas
├── package.json
└── src/
    ├── components/
    │   ├── BotaoGrande.js       # Botão grande e arredondado
    │   └── CampoTexto.js        # Input com label
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── CadastroScreen.js
    │   └── HomeScreen.js
    └── theme/
        └── colors.js            # Paleta de cores do app
```

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

## 🔮 Próximos passos

- Persistir cadastro/login (AsyncStorage ou Firebase).
- Implementar a lógica de cada jogo.
- Adicionar sons e animações.
- Ranking entre amigos.
- Controle parental.
