const express = require("express");
const axios = require("axios");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./src/database/connection");
const server = express();
const cheerio = require("cheerio");
const request = require("request");
const UserController = require("./src/controllers/UserController");
const MovieController = require("./src/controllers/MovieController");
const ScrapperController = require("./src/controllers/ScrapperController");

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";
const JWT_SECRET = "your_jwt_secret_key"; // Substitua por uma chave secreta forte

server.use(express.json());

// Middleware para verificar o token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ mensagem: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ mensagem: "Token inválido" });
    }

    req.user = user;
    next();
  });
};

// Rota para registrar um novo usuário
server.post("/register", async (req, res) => UserController.register(req, res));

// Rota de login para gerar o token JWT
server.post("/login", async (req, res) => UserController.login(req, res));

// Middleware para verificar permissões
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ mensagem: "Permissão negada" });
    }
    next();
  };
};

server.get("/", (req, res) => {
  return res.json({ mensagem: "Hello World" });
});

// Rota protegida

server.post(
  "/filmes",
  authenticateToken,
  authorize(["admin"]),
  async (req, res) => MovieController.createFilme(req, res)
);

// Rota protegida para obter detalhes de um filme
server.get(
  "/filmes/:id",
  authenticateToken,
  authorize(["admin", "editor", "cliente"]),
  async (req, res) => {
    MovieController.getMovieId(req, res);
  }
);

// Rota protegida para editar um filme (admin e editor podem editar)
server.put(
  "/filmes/:id",
  authenticateToken,
  authorize(["admin", "editor"]),
  async (req, res) => {
    MovieController.updateMovie(req, res);
  }
);

// Rota protegida para obter filmes com paginação
server.get(
  "/filmes",
  authenticateToken,
  authorize(["admin", "editor", "cliente"]),
  async (req, res) => {
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
      return res
        .status(400)
        .json({ mensagem: "Erro: Nenhum filme encontrado" });
    }

    //Indicar quais colunas recuperar
    attributes: [
      ["id", "titulo", "tmdb_link", "direcao", "roteirista", "artistas"],
    ];

    //ordenar os registros pela coluna ida na forma crescente
    order: [["id", "ASC"]];

    //Calcular a partir de qual registro deve retornar e o limite de registros
    offset: Number(page * limit - limit);
    limit: limit;

    try {
      // Contar a quantidade de registros no banco de dados
      const countResult = await pool.query("SELECT COUNT(*) FROM filmes");
      console.log(countResult);
      const countFilmes = parseInt(countResult.rows[0].count, 10);
      console.log(countFilmes);

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
  }
);
// Rota para scrapping
server.post("/scrapper", async (req, res) => {
  ScrapperController.scrapperNews(req, res);
});

server.listen(3000, () => {
  console.log("Servidor está funcionando...");
});

module.exports = server;
