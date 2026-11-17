import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useExperiencia } from '../context/ExperienciaContext';

interface Props {
  mensagem: string;
  humor?: 'alegre' | 'incentivo' | 'comemoracao';
  compacto?: boolean;
}

export default function Mascote({ mensagem, humor = 'alegre', compacto = false }: Props) {
  const { paleta, escalaFonte } = useExperiencia();
  const emoji = humor === 'comemoracao' ? '🧙‍♂️✨' : humor === 'incentivo' ? '🧙‍♂️💪' : '🧙‍♂️🌟';
  return (
    <View style={[styles.container, { backgroundColor: paleta.purpleLight, borderColor: paleta.border }, compacto && styles.compacto]}>
      <Text style={[styles.emoji, compacto && styles.emojiCompacto]}>{emoji}</Text>
      <Text style={[styles.mensagem, { color: paleta.text, fontSize: 14 * escalaFonte }]}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 14 },
  compacto: { paddingVertical: 9, borderRadius: 14 },
  emoji: { fontSize: 28, marginRight: 9 },
  emojiCompacto: { fontSize: 22 },
  mensagem: { flex: 1, fontWeight: '700', lineHeight: 20 },
});
