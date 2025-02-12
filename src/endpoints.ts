import express, { Express,RequestHandler } from "express";
const jwt = require("jsonwebtoken");
import { JwtPayload } from 'jsonwebtoken';
require("dotenv").config();

const UserController = require("./controllers/UserController");
const ScrapperController = require("./controllers/ScrapperController");
import authorize from "./middlewares/authorize";
import MovieController from "./infra/webserver/controllers/MovieController";

interface UserPayload extends JwtPayload {
  id: string;
  role: string;
  email: string;
}
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
module.exports = function (server: Express) {
  const JWT_SECRET = process.env.JWT_SECRET;
  server.use(express.json());
  

  // Middleware para verificar o token JWT
    const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ mensagem: "Token não fornecido" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: Error | null, user: UserPayload | undefined) => {
    if (err || !user) {
      res.status(403).json({ mensagem: "Token inválido" });
      return;
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

  // Rota protegida
  server.post(
    "/filmes",
    authenticateToken,
    authorize(["admin"]),
    async (req, res) =>
      // #swagger.tags = ['Movie']
      // #swagger.description = 'Endpoint para cadastrar filme.'
      {
        MovieController.createFilme(req, res);
      }
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
        //MovieController.getMovieId(req, res);
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
        //MovieController.updateMovie(req, res);
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
        //MovieController.getMovieAll(req, res);
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
