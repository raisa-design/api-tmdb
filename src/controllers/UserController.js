const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const JWT_SECRET = "your_jwt_secret_key";

class UserController {
  async register(req, res) {
    const { nome, email, senha, role } = req.body;

  if (!nome || !email || !senha || !role) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios" });
  }

  // Verifica se o role é válido
  if (!["admin", "editor", "cliente"].includes(role)) {
    return res.status(400).json({ mensagem: "Função inválida" });
  }

  try {
    const userModel = new UserModel();
    // Verificar se o email já está em uso
    if(await userModel.userExists(email)){
      return res.status(400).json({ mensagem: "Email já cadastrado" });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedSenha = await bcrypt.hash(senha, saltRounds);

    // Inserir o novo usuário no banco de dados
    const novoUsuario = await userModel.addUser(email, nome, hashedSenha, role);

    // Gerar token JWT para o novo usuário
    const user = {
      id: novoUsuario.id,
      email: novoUsuario.email,
      role: novoUsuario.role,
    };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({ accessToken });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao registrar usuário" });
  }
  }
}
module.exports = new UserController();