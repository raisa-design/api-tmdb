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

server.get("/filmes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM filmes");
    const filmes = result.rows;
    return res.json(filmes);
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
