export interface AvatarVisual {
  emoji: string;
  cor: string;
}

const AVATARES: Record<string, AvatarVisual> = {
  avatar_explorador: { emoji: '🧒', cor: '#F1C40F' },
  avatar_robo: { emoji: '🤖', cor: '#5DADE2' },
  avatar_fada: { emoji: '🧚', cor: '#AF7AC5' },
  avatar_leao: { emoji: '🦁', cor: '#E67E22' },
};

const MOLDURAS: Record<string, string> = {
  moldura_estrelas: '#F1C40F',
  moldura_arco_iris: '#E056FD',
};

export function obterAvatar(avatarId?: string, molduraId?: string): AvatarVisual {
  const avatar = AVATARES[avatarId ?? 'avatar_explorador'] ?? AVATARES.avatar_explorador;
  return { ...avatar, cor: MOLDURAS[molduraId ?? ''] ?? avatar.cor };
}
