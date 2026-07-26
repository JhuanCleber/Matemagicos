// Configuração de URL do backend.
//
// Como o app vai rodar:
//   - Emulador Android        -> 10.0.2.2  (o localhost do emulador aponta pra máquina host)
//   - Emulador iOS / Web      -> localhost
//   - Dispositivo físico      -> IP da máquina na rede (ex: 192.168.0.10)
//
// Troque o valor de API_URL abaixo conforme o caso. Para descobrir seu IP
// local, rode `ipconfig` no Windows e procure por "Endereço IPv4".
//
// Para um único ambiente, descomente apenas UMA das opções abaixo.

export const API_URL = 'http://10.0.2.2:8080';            // Emulador Android (mais comum)
// export const API_URL = 'http://localhost:8080';         // iOS simulator / Web
// export const API_URL = 'http://192.168.0.10:8080';      // Dispositivo físico na rede

export const API_TIMEOUT_MS = 10000;
