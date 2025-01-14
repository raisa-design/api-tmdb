const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const UserModel = require("../models/UserModel");

const JWT_SECRET = process.env.JWT_SECRET;
const userModel = new UserModel();

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
      if (await userModel.userExists(email)) {
        return res.status(400).json({ mensagem: "Email já cadastrado" });
      }

      // Hash da senha
      const saltRounds = 10;
      const hashedSenha = await bcrypt.hash(senha, saltRounds);

      // Inserir o novo usuário no banco de dados
      const novoUsuario = await userModel.addUser(
        email,
        nome,
        hashedSenha,
        role
      );

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

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        // TODO: Validar os campos com ZOD
        return res
          .status(400)
          .json({ mensagem: "Email e senha são obrigatórios" });
      }

      // Verificar se o email e senha estão corretos
      const usuario = await userModel.findUserByEmail(email);
      const senhaValida = await bcrypt.compare(senha, usuario?.senha || "");
      if (!usuario || !senhaValida) {
        return res.status(401).json({ mensagem: "Email ou senha incorretos" });
      }

      // Gerar token JWT
      const user = {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
      };

      const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
      return res.json({ accessToken });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return res.status(500).json({ mensagem: "Erro ao fazer login" });
    }
  }
}
module.exports = new UserController();
