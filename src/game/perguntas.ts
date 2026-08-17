export type Dificuldade = 'facil' | 'medio' | 'dificil';

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
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = numeroAleatorio(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function valorPorDificuldade(dificuldade: Dificuldade, facil: number, medio: number, dificil: number): number {
  if (dificuldade === 'facil') return facil;
  if (dificuldade === 'medio') return medio;
  return dificil;
}

function gerarOpcoesNumericas(respostaCorreta: number, quantidadeOpcoes = QUANTIDADE_OPCOES): string[] {
  const opcoes = new Set<number>([respostaCorreta]);
  const candidatosOffset = embaralhar([-10, -8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 10]);

  for (const offset of candidatosOffset) {
    if (opcoes.size >= quantidadeOpcoes) break;
    const candidato = respostaCorreta + offset;
    if (candidato >= 0) opcoes.add(candidato);
  }

  let extra = respostaCorreta + quantidadeOpcoes + 1;
  while (opcoes.size < quantidadeOpcoes) {
    opcoes.add(extra);
    extra += 1;
  }

  return embaralhar([...opcoes]).map(String);
}

function gerarPerguntaSoma(dificuldade: Dificuldade): Pergunta {
  const max = valorPorDificuldade(dificuldade, 10, 20, 100);
  const min = dificuldade === 'dificil' ? 10 : 1;
  const a = numeroAleatorio(min, max);
  const b = numeroAleatorio(min, max);
  const respostaCorreta = a + b;

  return {
    enunciado: itemAleatorio([
      `${a} + ${b} = ?`,
      `Quanto é ${a} mais ${b}?`,
      `Lia tinha ${a} figurinhas e ganhou mais ${b}. Com quantas ficou?`,
    ]),
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaSubtracao(dificuldade: Dificuldade): Pergunta {
  const max = valorPorDificuldade(dificuldade, 10, 20, 100);
  const min = dificuldade === 'dificil' ? 10 : 1;
  let a = numeroAleatorio(min, max);
  let b = numeroAleatorio(min, max);
  if (b > a) [a, b] = [b, a];
  const respostaCorreta = a - b;

  return {
    enunciado: itemAleatorio([
      `${a} − ${b} = ?`,
      `Quanto é ${a} menos ${b}?`,
      `No parque havia ${a} balões. ${b} voaram. Quantos sobraram?`,
    ]),
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaMultiplicacao(dificuldade: Dificuldade): Pergunta {
  const max = valorPorDificuldade(dificuldade, 5, 10, 12);
  const a = numeroAleatorio(2, max);
  const b = numeroAleatorio(2, max);
  const respostaCorreta = a * b;

  return {
    enunciado: itemAleatorio([
      `${a} × ${b} = ?`,
      `Quanto é ${a} vezes ${b}?`,
      `Há ${a} caixas com ${b} lápis em cada uma. Quantos lápis há ao todo?`,
    ]),
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaDivisao(dificuldade: Dificuldade): Pergunta {
  const max = valorPorDificuldade(dificuldade, 5, 10, 12);
  const divisor = numeroAleatorio(2, max);
  const quociente = numeroAleatorio(1, max);
  const dividendo = divisor * quociente;

  return {
    enunciado: itemAleatorio([
      `${dividendo} ÷ ${divisor} = ?`,
      `Quanto é ${dividendo} dividido por ${divisor}?`,
      `${dividendo} biscoitos serão divididos igualmente entre ${divisor} crianças. Quantos cada uma recebe?`,
    ]),
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
  { emoji: '⬟', nome: 'Pentágono' },
  { emoji: '⬢', nome: 'Hexágono' },
  { emoji: '❤️', nome: 'Coração' },
];

function gerarPerguntaGeometria(dificuldade: Dificuldade): Pergunta {
  const formasDisponiveis = dificuldade === 'dificil' ? FORMAS : FORMAS.slice(0, 5);
  const formasEmbaralhadas = embaralhar(formasDisponiveis);
  const formaCorreta = formasEmbaralhadas[0];
  const opcoes = formasEmbaralhadas.slice(0, QUANTIDADE_OPCOES).map((forma) => forma.nome);

  return {
    enunciado: itemAleatorio([
      `Que forma é essa?\n${formaCorreta.emoji}`,
      `Como se chama essa forma?\n${formaCorreta.emoji}`,
    ]),
    opcoes: embaralhar(opcoes),
    respostaCorreta: formaCorreta.nome,
  };
}

const EMOJI_CONTAGEM = ['🍎', '⭐', '🎈', '🐰', '🌸', '🍪'];

function gerarPerguntaContagem(dificuldade: Dificuldade): Pergunta {
  const [min, max] = dificuldade === 'facil' ? [1, 10] : dificuldade === 'medio' ? [10, 20] : [20, 35];
  const quantidade = numeroAleatorio(min, max);
  const emoji = itemAleatorio(EMOJI_CONTAGEM);
  const linha = new Array(quantidade).fill(emoji).join(' ');

  return {
    enunciado: itemAleatorio([`Quantos há aqui?\n${linha}`, `Conte quantos tem:\n${linha}`]),
    opcoes: gerarOpcoesNumericas(quantidade),
    respostaCorreta: String(quantidade),
  };
}

function gerarPerguntaSequencia(dificuldade: Dificuldade): Pergunta {
  const passo = valorPorDificuldade(dificuldade, numeroAleatorio(1, 3), numeroAleatorio(2, 6), numeroAleatorio(5, 12));
  const inicio = dificuldade === 'dificil' ? numeroAleatorio(10, 50) : numeroAleatorio(1, 20);
  const numeros = [inicio, inicio + passo, inicio + passo * 2];
  const respostaCorreta = inicio + passo * 3;

  return {
    enunciado: `Complete a sequência:\n${numeros.join(', ')}, __`,
    opcoes: gerarOpcoesNumericas(respostaCorreta),
    respostaCorreta: String(respostaCorreta),
  };
}

function gerarPerguntaComparacao(dificuldade: Dificuldade): Pergunta {
  const max = valorPorDificuldade(dificuldade, 10, 50, 200);
  const a = numeroAleatorio(0, max);
  const b = numeroAleatorio(1, 4) === 1 ? a : numeroAleatorio(0, max);
  const respostaCorreta = a === b ? '=' : a > b ? '>' : '<';

  return {
    enunciado: `Qual símbolo completa?\n${a} __ ${b}`,
    opcoes: embaralhar(['<', '>', '=']),
    respostaCorreta,
  };
}

const RELOGIOS: Record<number, string> = {
  1: '🕐', 2: '🕑', 3: '🕒', 4: '🕓', 5: '🕔', 6: '🕕',
  7: '🕖', 8: '🕗', 9: '🕘', 10: '🕙', 11: '🕚', 12: '🕛',
};

function gerarPerguntaHoras(dificuldade: Dificuldade): Pergunta {
  const hora = numeroAleatorio(1, 12);
  const minutosDisponiveis = dificuldade === 'facil' ? [0] : dificuldade === 'medio' ? [0, 30] : [0, 15, 30, 45];
  const minuto = itemAleatorio(minutosDisponiveis);
  const respostaCorreta = `${hora}:${String(minuto).padStart(2, '0')}`;
  const candidatos = new Set<string>([respostaCorreta]);

  for (const deslocamento of [1, -1, 2, -2]) {
    if (candidatos.size >= QUANTIDADE_OPCOES) break;
    const horaOpcao = ((hora - 1 + deslocamento + 12) % 12) + 1;
    candidatos.add(`${horaOpcao}:${String(minuto).padStart(2, '0')}`);
  }

  return {
    enunciado: minuto === 0
      ? `Que horas o relógio mostra?\n${RELOGIOS[hora]}`
      : minuto === 15
        ? `O relógio marca ${hora} horas e quinze minutos. Que horas são?`
        : minuto === 30
          ? `O relógio marca ${hora} horas e meia. Que horas são?`
          : `O relógio marca ${hora} horas e quarenta e cinco minutos. Que horas são?`,
    opcoes: embaralhar([...candidatos]),
    respostaCorreta,
  };
}

function formatarReais(centavos: number): string {
  return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
}

function gerarPerguntaDinheiro(dificuldade: Dificuldade): Pergunta {
  const valores = dificuldade === 'facil' ? [50, 100, 200, 500] : [25, 50, 100, 200, 500, 1000];
  const quantidadeParcelas = dificuldade === 'dificil' ? 3 : 2;
  const parcelas = Array.from({ length: quantidadeParcelas }, () => itemAleatorio(valores));
  const respostaCentavos = parcelas.reduce((total, valor) => total + valor, 0);
  const opcoes = new Set<number>([respostaCentavos]);
  for (const ajuste of embaralhar([-100, -50, -25, 25, 50, 100, 200])) {
    const candidato = respostaCentavos + ajuste;
    if (candidato > 0 && opcoes.size < QUANTIDADE_OPCOES) opcoes.add(candidato);
  }

  return {
    enunciado: `Quanto dinheiro há ao todo?\n${parcelas.map(formatarReais).join(' + ')}`,
    opcoes: embaralhar([...opcoes]).map(formatarReais),
    respostaCorreta: formatarReais(respostaCentavos),
  };
}

function gerarPerguntaFracao(dificuldade: Dificuldade): Pergunta {
  const denominador = valorPorDificuldade(dificuldade, itemAleatorio([2, 3, 4]), itemAleatorio([3, 4, 5, 6]), itemAleatorio([5, 6, 7, 8]));
  const numerador = numeroAleatorio(1, denominador - 1);
  const respostaCorreta = `${numerador}/${denominador}`;
  const opcoes = new Set<string>([respostaCorreta]);
  const candidatos = [
    `${Math.min(denominador - 1, numerador + 1)}/${denominador}`,
    `${Math.max(1, numerador - 1)}/${denominador}`,
    `${numerador}/${denominador + 1}`,
    `${numerador + 1}/${denominador + 1}`,
  ];
  for (const candidato of candidatos) {
    if (candidato !== respostaCorreta && opcoes.size < QUANTIDADE_OPCOES) opcoes.add(candidato);
  }
  let extra = 2;
  while (opcoes.size < QUANTIDADE_OPCOES) {
    opcoes.add(`1/${denominador + extra}`);
    extra += 1;
  }
  const visual = `${'🟩'.repeat(numerador)}${'⬜'.repeat(denominador - numerador)}`;

  return {
    enunciado: `Que fração está pintada?\n${visual}`,
    opcoes: embaralhar([...opcoes]),
    respostaCorreta,
  };
}

const GERADORES: Record<string, (dificuldade: Dificuldade) => Pergunta> = {
  soma: gerarPerguntaSoma,
  subtracao: gerarPerguntaSubtracao,
  multiplicacao: gerarPerguntaMultiplicacao,
  divisao: gerarPerguntaDivisao,
  geometria: gerarPerguntaGeometria,
  contagem: gerarPerguntaContagem,
  sequencia: gerarPerguntaSequencia,
  comparacao: gerarPerguntaComparacao,
  horas: gerarPerguntaHoras,
  dinheiro: gerarPerguntaDinheiro,
  fracoes: gerarPerguntaFracao,
};

export function gerarPerguntas(tipoOperacao: string, quantidade: number, dificuldade: Dificuldade = 'facil'): Pergunta[] {
  const gerador = GERADORES[tipoOperacao] ?? gerarPerguntaSoma;
  return Array.from({ length: quantidade }, () => gerador(dificuldade));
}
