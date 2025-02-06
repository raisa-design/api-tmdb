const { z } = require("zod");
const axios = require("axios");
const MovieModel = require("../models/MovieModel");

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";

class MovieController {
  movieModel;

  constructor() {
    this.movieModel = new MovieModel();
  }

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

  async getMovieAll(req, res) {
    //Receber o número da página, quando não é enviado o número da página é atribuido página 1
    const { page = 1 } = req.query;

    //limite de registros em cada página
    const limit = 10;

    //variável com o numero da última página
    var lastPage = 1;

    const countFilmes = await this.movieModel.countMovies();

    try {
      // Calcular a última página
      if (countFilmes !== 0) {
        lastPage = Math.ceil(countFilmes / limit);
      } else {
        // Pausar o processamento e retornar a mensagem de erro
        return res
          .status(400)
          .json({ mensagem: "Erro: Nenhum filme encontrado" });
      }

      // Calcular o offset
      const offset = (page - 1) * limit;

      // Buscar os filmes com paginação e ordenação
      const filmes = await this.movieModel.getMoviesPagination(limit, offset);

      // Acessa o IF se encontrar o registro no banco de dados
      if (filmes.length > 0) {
        //Criar objeto com as informações para paginação
        const pagination = {
          //caminho
          path: "/filmes",
          //pagina atual
          page,
          //URL da página anterior
          prev_page_url: page - 1 >= 1 ? page - 1 : false,
          //URL da página posterior
          next_page_url:
            Number(page) + Number(1) > lastPage
              ? false
              : Number(page) + Number(1),
        };

        //Pausar o processamento e retornar os dados em formato de objeto
        return res.json({
          filmes,
          pagination,
          //ultima pagina
          lastPage,
          //quantidadede registros
          total: countFilmes,
        });
      } else {
        //Pausar o processamento e retornar a mensagem de erro
        return res
          .status(400)
          .json({ mensagem: "Erro: Nenhum filme encontrado" });
      }
    } catch (error) {
      console.error("Erro ao buscar filmes:", error);
      return res
        .status(500)
        .json({ mensagem: "Erro ao buscar filmes", erro: error.message });
    }
  }
}

module.exports = new MovieController();
