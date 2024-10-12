const pool = require("../database/connection");

class MovieModel {
  async save(filme, tmdbLink, diretores, roteiristas, artistas) {
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
    const savedFilm = result.rows[0];
    return savedFilm;
  }

  async findById(id) {
    const result = await pool.query("SELECT * FROM filmes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const filme = result.rows[0];
    return filme;
  }

  async updateById(id, titulo) {
    const result = await pool.query(
      "UPDATE filmes SET titulo = $1 WHERE id = $2",
      [titulo, id]
    );
    const resultMovie = result.rows.length === 0;
    return resultMovie;
  }

  // async findByAll() {}
}

module.exports = MovieModel;
