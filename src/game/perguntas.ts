

export type Dificuldade = 'facil' | 'medio';

export interface Pergunta {
  enunciado: string;
  opcoes: string[];
  respostaCorreta: string;
}

const QUANTIDADE_OPCOES = 4;

function numeroAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function itemAleatorio<T>(array: T[]): T {
  return array[numeroAleatorio(0, array.length - 1)];
}

function embaralhar<T>(array: T[]): T[] {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}


function gerarOpcoesNumericas(respostaCorreta: number, quantidadeOpcoes: number = QUANTIDADE_OPCOES): string[] {
  const opcoes = new Set<number>([respostaCorreta]);
  const candidatosOffset = embaralhar([-10, -8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 10]);

  for (const offset of candidatosOffset) {
    if (opcoes.size >= quantidadeOpcoes) break;
    const candidato = respostaCorreta + offset;
    if (candidato >= 0) {
      opcoes.add(candidato);
    }
  }


  let extra = respostaCorreta + quantidadeOpcoes + 1;
  while (opcoes.size < quantidadeOpcoes) {
    opcoes.add(extra);
    extra += 1;
  }

  return embaralhar(Array.from(opcoes)).map((n) => String(n));
}


function gerarPerguntaSoma(dificuldade: Dificuldade): Pergunta {
  const max = dificuldade === 'facil' ? 10 : 20;
  const a = numeroAleatorio(1, max);
  const b = numeroAleatorio(1, max);
  const respostaCorreta = a + b;

  const enunciado = itemAleatorio([
    `${a} + ${b} = ?`,
    `Quanto é ${a} mais ${b}?`,
  ]);

  return {
    enunciado,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}


function gerarPerguntaSubtracao(dificuldade: Dificuldade): Pergunta {
  const max = dificuldade === 'facil' ? 10 : 20;
  let a = numeroAleatorio(1, max);
  let b = numeroAleatorio(1, max);
  if (b > a) [a, b] = [b, a];
  const respostaCorreta = a - b;

  const enunciado = itemAleatorio([
    `${a} - ${b} = ?`,
    `Quanto é ${a} menos ${b}?`,
  ]);

  return {
    enunciado,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}


function gerarPerguntaMultiplicacao(dificuldade: Dificuldade): Pergunta {
  const max = dificuldade === 'facil' ? 5 : 10;
  const a = numeroAleatorio(1, max);
  const b = numeroAleatorio(1, max);
  const respostaCorreta = a * b;

  const enunciado = itemAleatorio([
    `${a} × ${b} = ?`,
    `Quanto é ${a} vezes ${b}?`,
  ]);

  return {
    enunciado,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}


function gerarPerguntaDivisao(dificuldade: Dificuldade): Pergunta {
  const max = dificuldade === 'facil' ? 5 : 10;
  const divisor = numeroAleatorio(2, max);
  const quociente = numeroAleatorio(1, max);
  const dividendo = divisor * quociente;

  const enunciado = itemAleatorio([
    `${dividendo} ÷ ${divisor} = ?`,
    `Quanto é ${dividendo} dividido por ${divisor}?`,
  ]);

  return {
    enunciado,
    opcoes: gerarOpcoesNumericas(quociente),
    respostaCorreta: String(quociente),
  };
}


const FORMAS = [
  { emoji: '⬛', nome: 'Quadrado' },
  { emoji: '🔺', nome: 'Triângulo' },
  { emoji: '🔵', nome: 'Círculo' },
  { emoji: '🔶', nome: 'Losango' },
  { emoji: '⭐', nome: 'Estrela' },
];

function gerarPerguntaGeometria(_dificuldade: Dificuldade): Pergunta {
  const formasEmbaralhadas = embaralhar(FORMAS);
  const formaCorreta = formasEmbaralhadas[0];
  const opcoes = formasEmbaralhadas.slice(0, QUANTIDADE_OPCOES).map((f) => f.nome);

  const enunciado = itemAleatorio([
    `Que forma é essa?\n${formaCorreta.emoji}`,
    `Como se chama essa forma?\n${formaCorreta.emoji}`,
  ]);

  return {
    enunciado,
    opcoes: embaralhar(opcoes),
    respostaCorreta: formaCorreta.nome,
  };
}


const EMOJI_CONTAGEM = ['🍎', '⭐', '🎈', '🐰', '🌸', '🍪'];

function gerarPerguntaContagem(dificuldade: Dificuldade): Pergunta {
  const [min, max] = dificuldade === 'facil' ? [1, 10] : [10, 20];
  const quantidade = numeroAleatorio(min, max);
  const emoji = itemAleatorio(EMOJI_CONTAGEM);
  const linha = new Array(quantidade).fill(emoji).join(' ');

  const enunciado = itemAleatorio([
    `Quantos há aqui?\n${linha}`,
    `Conte quantos tem:\n${linha}`,
  ]);

  return {
    enunciado,
    opcoes: gerarOpcoesNumericas(quantidade),
    respostaCorreta: String(quantidade),
  };
}

const GERADORES: Record<string, (dificuldade: Dificuldade) => Pergunta> = {
  soma: gerarPerguntaSoma,
  subtracao: gerarPerguntaSubtracao,
  multiplicacao: gerarPerguntaMultiplicacao,
  divisao: gerarPerguntaDivisao,
  geometria: gerarPerguntaGeometria,
  contagem: gerarPerguntaContagem,
};

export function gerarPerguntas(
  tipoOperacao: string,
  quantidade: number,
  dificuldade: Dificuldade = 'facil'
): Pergunta[] {

  const gerador = GERADORES[tipoOperacao] ?? gerarPerguntaSoma;
  return Array.from({ length: quantidade }, () => gerador(dificuldade));
}