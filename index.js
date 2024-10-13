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
    MovieController.getMovieAll(req, res);
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
