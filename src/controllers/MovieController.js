const { z } = require("zod");
const axios = require("axios");
const MovieModel = require("../models/MovieModel");

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";

class MovieController {
  async createFilme(req, res) {
    const dataSchema = z.object({
      titulo: z.string().min(1, "Título é obrigatório"),
    });
    const validation = dataSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        mensagem: "Dados inválidos, forneça o titulo",
        erros: validation.error.errors,
      });
    }

    const { titulo } = validation.data;

    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie`,
        {
          params: {
            api_key: TMDB_API_KEY,
            query: titulo,
          },
        }
      );

      const filmes = response.data.results;

      if (filmes.length === 0) {
        return res.status(404).json({ mensagem: "Filme não encontrado" });
      }

      const filme = filmes[0];

      const detalhes = await axios.get(
        `https://api.themoviedb.org/3/movie/${filme.id}`,
        {
          params: {
            api_key: TMDB_API_KEY,
            append_to_response: "credits",
          },
        }
      );

      const diretores = detalhes.data.credits.crew.filter(
        (member) => member.job === "Director"
      );
      const roteiristas = detalhes.data.credits.crew.filter(
        (member) => member.job === "Screenplay" || member.job === "Writer"
      );
      const artistas = detalhes.data.credits.cast.slice(0, 5);

      const tmdbLink = `https://www.themoviedb.org/movie/${filme.id}`;

      const movieModel = new MovieModel();
      const savedFilm = await movieModel.save(
        filme,
        tmdbLink,
        diretores,
        roteiristas,
        artistas
      );

      return res.json(savedFilm);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ mensagem: "Erro ao buscar filme" });
    }
  }

  async getMovieId(req, res) {
    const { id } = req.params;

    try {
      const movieModel = new MovieModel();
      const filme = await movieModel.findById(id);
      if (!filme) {
        return res.status(404).json({ mensagem: "Filme não encontrado" });
      }
      return res.json(filme);
    } catch (error) {
      console.error("Erro ao buscar filme:", error);
      return res
        .status(500)
        .json({ mensagem: "Erro ao buscar filme", erro: error.message });
    }
  }

  async updateMovie(req, res) {
    const { id } = req.params;
    const { titulo } = req.body;

    try {
      const movieModel = new MovieModel();
      const filme = await movieModel.updateById(id, titulo);
      if (!filme) {
        return res.status(404).json({ mensagem: "Filme não encontrado" });
      }

      return res.json({ mensagem: "Filme atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao editar filme:", error);
      return res.status(500).json({ mensagem: "Erro ao editar filme" });
    }
  }
  async getMovieAll(req, res) {}
}

module.exports = new MovieController();
