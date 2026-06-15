import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface BotaoGrandeProps {
  titulo: string;
  onPress: () => void;
  cor?: string;
  icone?: string;
  desabilitado?: boolean;
}


export default function BotaoGrande({
  titulo,
  onPress,
  cor = colors.primary,
  icone,
  desabilitado = false,
}: BotaoGrandeProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
      style={({ pressed }) => [
        styles.botao,
        { backgroundColor: desabilitado ? colors.textLight : cor },
        pressed && styles.botaoPressionado,
      ]}
    >
      <View style={styles.conteudo}>
        {icone && <Text style={styles.icone}>{icone}</Text>}
        <Text style={styles.texto}>{titulo}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginVertical: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,

    elevation: 4,
    overflow: 'hidden',
  },
  botaoPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  conteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  icone: {
    fontSize: 26,
    marginRight: 10,
  },
});
