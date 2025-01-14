const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const server = express();
const UserController = require("./src/controllers/UserController");
const MovieController = require("./src/controllers/MovieController");
const ScrapperController = require("./src/controllers/ScrapperController");

module.exports = function (server) {
  const JWT_SECRET = process.env.JWT_SECRET;
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
  server.post("/register", async (req, res) =>
    // #swagger.tags = ['User']
    // #swagger.description = 'Endpoint para criar um usuário.'
    UserController.register(req, res)
  );

  // Rota de login para gerar o token JWT
  server.post(
    "/login",
    async (req, res) =>
      // #swagger.tags = ['User']
      // #swagger.description = 'Endpoint para logar um usuário.'
      UserController.login(req, res)
    /* #swagger.responses[200] = { 
               schema: { $ref: "#/definitions/User" },
               description: 'Usuário encontrado.' 
        } */
  );

  // Middleware para verificar permissões
  const authorize = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ mensagem: "Permissão negada" });
      }
      next();
    };
  };

  // Rota protegida

  server.post(
    "/filmes",
    authenticateToken,
    authorize(["admin"]),
    async (req, res) =>
      // #swagger.tags = ['Movie']
      // #swagger.description = 'Endpoint para cadastrar filme.'
      MovieController.createFilme(req, res)
  );

  // Rota protegida para obter detalhes de um filme
  server.get(
    "/filmes/:id",
    authenticateToken,
    authorize(["admin", "editor", "cliente"]),
    async (req, res) =>
      // #swagger.tags = ['Movie']
      // #swagger.description = 'Endpoint para obter filme específico.'
      {
        MovieController.getMovieId(req, res);
      }
  );

  // Rota protegida para editar um filme (admin e editor podem editar)
  server.put(
    "/filmes/:id",
    authenticateToken,
    authorize(["admin", "editor"]),
    async (req, res) =>
      // #swagger.tags = ['Movie']
      // #swagger.description = 'Endpoint para editar filme específico.'
      {
        MovieController.updateMovie(req, res);
      }
  );

  // Rota protegida para obter filmes com paginação
  server.get(
    "/filmes",
    authenticateToken,
    authorize(["admin", "editor", "cliente"]),
    async (req, res) =>
      // #swagger.tags = ['Movie']
      // #swagger.description = 'Endpoint para obter todos os filmes.'
      {
        MovieController.getMovieAll(req, res);
      }
  );
  // Rota para scrapping
  server.post("/scrapper", async (req, res) =>
    // #swagger.tags = ['News']
    // #swagger.description = 'Endpoint para obter filme específico.'
    {
      ScrapperController.scrapperNews(req, res);
    }
  );
};
