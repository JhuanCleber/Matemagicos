import { colors } from './colors';

export interface VisualJogo {
  icone: string;
  cor: string;
  nome: string;
}

// Mesmo esquema visual usado na Home (HomeScreen.tsx), só que indexado por
// tipoOperacao em vez de id — não depende da ordem dos jogos no data.sql.
// Usado em HistoricoScreen e EvolucaoScreen; se aparecer em mais alguma tela,
// reaproveitar daqui em vez de duplicar de novo.
export const VISUAL_POR_TIPO: Record<string, VisualJogo> = {
  soma: { icone: '➕', cor: colors.success, nome: 'Soma' },
  subtracao: { icone: '➖', cor: colors.secondary, nome: 'Subtração' },
  multiplicacao: { icone: '✖️', cor: colors.primary, nome: 'Multiplicação' },
  divisao: { icone: '➗', cor: colors.danger, nome: 'Divisão' },
  geometria: { icone: '🔷', cor: '#9B59B6', nome: 'Formas Geométricas' },
  contagem: { icone: '🔢', cor: '#3498DB', nome: 'Contagem' },
  sequencia: { icone: '🔮', cor: '#16A085', nome: 'Sequência Numérica' },
  comparacao: { icone: '⚖️', cor: '#E67E22', nome: 'Comparação' },
  horas: { icone: '🕒', cor: '#2980B9', nome: 'Horas' },
  dinheiro: { icone: '💰', cor: '#D4AC0D', nome: 'Dinheiro' },
  fracoes: { icone: '🍕', cor: '#8E44AD', nome: 'Frações' },
};

export const VISUAL_PADRAO: VisualJogo = { icone: '🎮', cor: colors.textLight, nome: 'Jogo' };
