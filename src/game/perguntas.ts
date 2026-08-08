

export interface Pergunta {
  enunciado: string;
  opcoes: string[];
  respostaCorreta: string;
}

const QUANTIDADE_OPCOES = 4;

function numeroAleatorio(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function gerarPerguntaSoma(): Pergunta {
  const a = numeroAleatorio(1, 20);
  const b = numeroAleatorio(1, 20);
  const respostaCorreta = a + b;
  return {
    enunciado: `${a} + ${b} = ?`,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaSubtracao(): Pergunta {
  let a = numeroAleatorio(1, 20);
  let b = numeroAleatorio(1, 20);
  if (b > a) [a, b] = [b, a];
  const respostaCorreta = a - b;
  return {
    enunciado: `${a} - ${b} = ?`,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaMultiplicacao(): Pergunta {
  const a = numeroAleatorio(1, 10);
  const b = numeroAleatorio(1, 10);
  const respostaCorreta = a * b;
  return {
    enunciado: `${a} × ${b} = ?`,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaDivisao(): Pergunta {
  const divisor = numeroAleatorio(2, 10);
  const quociente = numeroAleatorio(1, 10);
  const dividendo = divisor * quociente;
  return {
    enunciado: `${dividendo} ÷ ${divisor} = ?`,
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

function gerarPerguntaGeometria(): Pergunta {
  const formasEmbaralhadas = embaralhar(FORMAS);
  const formaCorreta = formasEmbaralhadas[0];
  const opcoes = formasEmbaralhadas.slice(0, QUANTIDADE_OPCOES).map((f) => f.nome);
  return {
    enunciado: `Que forma é essa?\n${formaCorreta.emoji}`,
    opcoes: embaralhar(opcoes),
    respostaCorreta: formaCorreta.nome,
  };
}

const EMOJI_CONTAGEM = ['🍎', '⭐', '🎈', '🐰', '🌸', '🍪'];

function gerarPerguntaContagem(): Pergunta {
  const quantidade = numeroAleatorio(1, 15);
  const emoji = EMOJI_CONTAGEM[numeroAleatorio(0, EMOJI_CONTAGEM.length - 1)];
  const linha = new Array(quantidade).fill(emoji).join(' ');
  return {
    enunciado: `Quantos há aqui?\n${linha}`,
    opcoes: gerarOpcoesNumericas(quantidade),
    respostaCorreta: String(quantidade),
  };
}

const GERADORES: Record<string, () => Pergunta> = {
  soma: gerarPerguntaSoma,
  subtracao: gerarPerguntaSubtracao,
  multiplicacao: gerarPerguntaMultiplicacao,
  divisao: gerarPerguntaDivisao,
  geometria: gerarPerguntaGeometria,
  contagem: gerarPerguntaContagem,
};

export function gerarPerguntas(tipoOperacao: string, quantidade: number): Pergunta[] {

  const gerador = GERADORES[tipoOperacao] ?? gerarPerguntaSoma;
  return Array.from({ length: quantidade }, () => gerador());
}