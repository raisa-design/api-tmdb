const pool = require("../database/connection");

class UserModel {
  async addUser(email, nome, hashedSenha, role) {
    const queryText = `INSERT INTO users (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING *`;
    const queryValues = [nome, email, hashedSenha, role];
    const novoUsuario = await pool.query(queryText, queryValues);
    return novoUsuario.rows[0];
  }

  async userExists(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      return true;
    } else {
      return false;
    }
  }
  async findUserByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return null; // Retorna null se o usuário não for encontrado
    }

    const usuario = result.rows[0];

    return usuario;
  }
}
module.exports = UserModel;
