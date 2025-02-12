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
}