const express = require("express");
const axios = require("axios");
const { Pool } = require("pg");
const { z } = require("zod");
const server = express();

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "movies",
  password: "123456",
  port: 5432,
});

server.use(express.json());

const dataSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
});

server.get("/", (req, res) => {
  return res.json({ mensagem: "Hello World" });
});

server.post("/filmes", async (req, res) => {
  // validação zod

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

    return res.json(savedFilm);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensagem: "Erro ao buscar filme" });
  }
});

server.get("/filmes/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM filmes WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: "Filme não encontrado" });
    }

    const filme = result.rows[0];
    return res.json(filme);
  } catch (error) {
    console.error("Erro ao buscar filme:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao buscar filme", erro: error.message });
  }
});

server.get("/filmes", async (req, res) => {
  //Receber o número da página, quando não é enviado o número da página é atribuido página 1
  const { page = 1 } = req.query;

  //limite de registros em cada página
  const limit = 10;

  //variável com o numero da última página
  var lastPage = 1;

  //contar a quantidade de registro no banco de dados
  const countResult = await pool.query("SELECT COUNT(*) FROM filmes");
  const countFilmes = parseInt(countResult.rows[0].count, 10);

  // Acessa o IF quando encontrar registro no banco de dados

  if (countFilmes !== 0) {
    //calcular a última página
    lastPage = Math.ceil(countFilmes / limit);
  } else {
    //Pausar o processamento e retornar a mensagem de erro
    return res.status(400).json({ mensagem: "Erro: Nenhum filme encontrado" });
  }

  //Indicar quais colunas recuperar
  attributes: [
    ["id", "titulo", "tmdb_link", "direcao", "roteirista", "artistas"],
  ];

  //ordenar os registros pela coluna ida na forma crescente
  order: [["id", "ASC"]];

  //Calcular a partir de qual registro deve retornar   e o limite de registros
  offset: Number(page * limit - limit);
  limit: limit;

  try {
    // Contar a quantidade de registros no banco de dados
    const countResult = await pool.query("SELECT COUNT(*) FROM filmes");
    const countFilmes = parseInt(countResult.rows[0].count, 10);

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
    const result = await pool.query(
      "SELECT * FROM filmes ORDER BY id ASC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const filmes = result.rows;

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
});

server.listen(3000, () => {
  console.log("Servidor está funcionando...");
});
