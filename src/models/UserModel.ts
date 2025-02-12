import { Pool } from 'pg';
import pool from '../database/connection';

interface User {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: string;
}

class UserModel {
  async addUser(
    email: string,
    nome: string,
    hashedSenha: string,
    role: string
  ): Promise<User> {
    const queryText = `INSERT INTO users (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING *`;
    const queryValues = [nome, email, hashedSenha, role];
    const novoUsuario = await pool.query(queryText, queryValues);
    return novoUsuario.rows[0];
  }

  async userExists(email: string): Promise<boolean> {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows.length > 0;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}

export default UserModel;