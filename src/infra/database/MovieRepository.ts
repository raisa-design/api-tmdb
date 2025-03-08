import pool from "../../database/connection";
import { Movie } from "../../domain/entities/Movie";
import { IMovieRepository } from "../../domain/respositories/MovieRespository";

export class MovieRepository implements IMovieRepository {
  async save(movie: Movie): Promise<void> {
   const queryText = `
      INSERT INTO filmes (titulo, tmdb_link, direcao, roteirista, artistas)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const queryValues = [
      movie.getFilme(),
      movie.getTmdbLink(),
      movie.getDiretores(),
      movie.getRoteiristas(),
      movie.getArtistas(),
    ];

    const result = await pool.query(queryText, queryValues);
    return result.rows[0];
  }
  async findById(id: number): Promise<Movie | null> {
    const queryText = "SELECT * FROM filmes WHERE id = $1";
    const result = await pool.query(queryText, [id]);
    return result.rows.length ? result.rows[0] : null;
  }
  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM filmes');
    return parseInt(result.rows[0].count);
  }

  async getPaginated(limit: number, offset: number): Promise<Movie[]> {
    const result = await pool.query(
      'SELECT * FROM filmes ORDER BY id ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
  
  
}