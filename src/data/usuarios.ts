

interface Usuario {
  nome: string;
  idade: number;
  email: string;
  senha: string;
}

let usuarios: Usuario[] = [];

export const cadastrarUsuario = (usuario: Usuario): { ok: boolean; erro?: string } => {
  const emailExiste = usuarios.some((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
  if (emailExiste) {
    return { ok: false, erro: 'Este email já está cadastrado. Tente fazer login.' };
  }
  usuarios.push(usuario);
  return { ok: true };
};

export const fazerLogin = (email: string, senha: string): { ok: boolean; erro?: string; usuario?: Usuario } => {
  const usuario = usuarios.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
  );
  if (!usuario) {
    return { ok: false, erro: 'Email ou senha incorretos. Verifique ou cadastre-se primeiro.' };
  }
  return { ok: true, usuario };
};

export const emailJaCadastrado = (email: string): boolean => {
  return usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase());
};
