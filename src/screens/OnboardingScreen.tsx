import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useExperiencia } from '../context/ExperienciaContext';
import BotaoGrande from '../components/BotaoGrande';

const PASSOS = [
  { icone: '🧙‍♂️', titulo: 'Olá, Matemágico!', texto: 'Aqui você aprende brincando, no seu próprio ritmo.' },
  { icone: '🎮', titulo: 'Escolha uma aventura', texto: 'Cada jogo tem desafios de matemática e muita magia.' },
  { icone: '⭐', titulo: 'Celebre cada conquista', texto: 'Ganhe pontos, moedas e medalhas sempre que praticar.' },
];

export default function OnboardingScreen() {
  const [passo, setPasso] = useState(0);
  const { concluirOnboarding, paleta, escalaFonte } = useExperiencia();
  const atual = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: paleta.primary }]}>
      <TouchableOpacity style={styles.pular} onPress={concluirOnboarding}>
        <Text style={[styles.pularTexto, { color: paleta.white, fontSize: 14 * escalaFonte }]}>Pular</Text>
      </TouchableOpacity>
      <View style={[styles.card, { backgroundColor: paleta.card }]}>
        <Text style={styles.icone}>{atual.icone}</Text>
        <Text style={[styles.titulo, { color: paleta.text, fontSize: 29 * escalaFonte }]}>{atual.titulo}</Text>
        <Text style={[styles.texto, { color: paleta.textLight, fontSize: 17 * escalaFonte }]}>{atual.texto}</Text>
        <View style={styles.pontos}>{PASSOS.map((_, indice) => <View key={indice} style={[styles.ponto, { backgroundColor: indice === passo ? paleta.secondary : paleta.purpleLight }]} />)}</View>
        <BotaoGrande titulo={ultimo ? 'Começar a aventura' : 'Próximo'} icone={ultimo ? '🚀' : '➡️'} onPress={() => ultimo ? concluirOnboarding() : setPasso(passo + 1)} cor={paleta.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  pular: { position: 'absolute', right: 24, top: 58, padding: 10 },
  pularTexto: { fontWeight: '700' },
  card: { borderRadius: 30, padding: 28, alignItems: 'center' },
  icone: { fontSize: 80, marginBottom: 18 },
  titulo: { fontWeight: 'bold', textAlign: 'center', marginBottom: 14 },
  texto: { lineHeight: 26, textAlign: 'center', marginBottom: 26 },
  pontos: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
});
