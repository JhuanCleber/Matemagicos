import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  KeyboardTypeOptions,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';

interface CampoTextoProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;

  mostrarBotaoSenha?: boolean;
}

export default function CampoTexto({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  mostrarBotaoSenha = false,
}: CampoTextoProps) {

  const [senhaVisivel, setSenhaVisivel] = useState(false);


  const ocultarSenha = mostrarBotaoSenha ? !senhaVisivel : secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, mostrarBotaoSenha && styles.inputComBotao]}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={ocultarSenha}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {mostrarBotaoSenha && (
          <TouchableOpacity
            style={styles.botaoOlho}
            onPress={() => setSenhaVisivel((v) => !v)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.olhoTexto}>{senhaVisivel ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.purpleLight,
  },
  inputComBotao: {
    paddingRight: 54,
  },
  botaoOlho: {
    position: 'absolute',
    right: 8,
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  olhoTexto: {
    fontSize: 22,
  },
});
