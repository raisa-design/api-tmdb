import { Pool } from "pg";
import pool from "../database/connection";

interface Filme {
  id?: number;
  title: string;
  tmdb_link: string;
  diretores: string;
  roteiristas: string;
  artistas: string;
}

class MovieModel {
  async save(
    filme: Filme,
    tmdbLink: string,
    diretores: { name: string }[],
    roteiristas: { name: string }[],
    artistas: { name: string }[]
  ): Promise<Filme> {
    const queryText = `
      INSERT INTO filmes (titulo, tmdb_link, direcao, roteirista, artistas)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const queryValues = [
      filme.title,
      tmdbLink,
      diretores.map((d) => d.name).join(", "),
      roteiristas.map((r) => r.name).join(", "),
      artistas.map((a) => a.name).join(", "),
    ];

    const result = await pool.query(queryText, queryValues);
    return result.rows[0];
  }

  async findById(id: number): Promise<Filme | null> {
    const result = await pool.query("SELECT * FROM filmes WHERE id = $1", [id]);
    return result.rows.length ? result.rows[0] : null;
  }

  async updateById(id: number, titulo: string): Promise<boolean> {
    const result = await pool.query(
      "UPDATE filmes SET titulo = $1 WHERE id = $2 RETURNING *",
      [titulo, id]
    );
    return result.rows.length > 0;
  }

  async countMovies(): Promise<number> {
    const countResult = await pool.query("SELECT COUNT(*) FROM filmes");
    return parseInt(countResult.rows[0].count, 10);
  }

  async getMoviesPagination(limit: number, offset: number): Promise<Filme[]> {
    const result = await pool.query(
      "SELECT * FROM filmes ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result.rows;
  }
}

export default MovieModel;
