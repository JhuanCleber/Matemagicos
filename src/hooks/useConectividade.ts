import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Fica escutando o estado da conexão o tempo todo (wifi cair, dados móveis
// acabar etc.) e atualiza sozinho — qualquer tela que usar esse hook reage
// em tempo real, sem precisar checar manualmente antes de cada ação.
export function useConectividade() {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    const cancelarInscricao = NetInfo.addEventListener((estado) => {
      // isConnected pode vir null bem no início, antes do NetInfo descobrir o
      // estado real — nesse caso assumimos conectado pra não mostrar aviso à toa
      setConectado(estado.isConnected !== false);
    });

    return () => cancelarInscricao();
  }, []);

  return conectado;
}