const express = require("express");
const axios = require("axios");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("./src/database/connection");
const server = express();
const cheerio = require("cheerio");
const request = require("request");

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";
const JWT_SECRET = "your_jwt_secret_key"; // Substitua por uma chave secreta forte

server.use(express.json());

const dataSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
});

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
server.post("/register", async (req, res) => {
  const { nome, email, senha, role } = req.body;

  if (!nome || !email || !senha || !role) {
    return res
      .status(400)
      .json({ mensagem: "Todos os campos são obrigatórios" });
  }

  // Verifica se o role é válido
  if (!["admin", "editor", "cliente"].includes(role)) {
    return res.status(400).json({ mensagem: "Função inválida" });
  }

  try {
    // Verificar se o email já está em uso
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      return res.status(400).json({ mensagem: "Email já está em uso" });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedSenha = await bcrypt.hash(senha, saltRounds);

    // Inserir o novo usuário no banco de dados
    const queryText = `INSERT INTO users (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING *`;
    const queryValues = [nome, email, hashedSenha, role];
    const novoUsuario = await pool.query(queryText, queryValues);

    // Gerar token JWT para o novo usuário
    const user = {
      id: novoUsuario.rows[0].id,
      email: novoUsuario.rows[0].email,
      role: novoUsuario.rows[0].role,
    };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({ accessToken });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao registrar usuário" });
  }
});

// Rota de login para gerar o token JWT
server.post("/login", async (req, res) => {
  // Em um cenário real, você deve verificar o usuário no banco de dados
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
  }

  try {
    //verificar se o usuário existe
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ mensagem: "Credenciais inválidas" });
    }

    const usuario = result.rows[0];

    // Verificar a senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ mensagem: "Credenciais inválidas" });
    }

    // Gerar token JWT
    const user = {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ accessToken });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ mensagem: "Erro ao fazer login" });
  }
});

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
  async (req, res) => {
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
  }
);

// Rota protegida para obter detalhes de um filme
server.get(
  "/filmes/:id",
  authenticateToken,
  authorize(["admin", "editor", "cliente"]),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("SELECT * FROM filmes WHERE id = $1", [
        id,
      ]);

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
  }
);

// Rota protegida para editar um filme (admin e editor podem editar)
server.put(
  "/filmes/:id",
  authenticateToken,
  authorize(["admin", "editor"]),
  async (req, res) => {
    const { id } = req.params;
    const { titulo } = req.body;

    try {
      const result = await pool.query(
        "UPDATE filmes SET titulo = $1 WHERE id = $2",
        [titulo, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ mensagem: "Filme não encontrado" });
      }

      return res.json({ mensagem: "Filme atualizado com sucesso" });
    } catch (error) {
      console.error("Erro ao editar filme:", error);
      return res.status(500).json({ mensagem: "Erro ao editar filme" });
    }
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
  try {
    const url = "https://www.adorocinema.com/noticias/filmes/";
    request(url, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        const noticias = [];
        $(".news-card")
          .slice(0, 10)
          .each((index, element) => {
            const titulo = $(element).find(".meta-title-link").text().trim();
            const linkDaImagem = $(element).find(".thumbnail-img").attr("src");
            const linkDoConteudo = $(element)
              .find(".meta-title-link")
              .attr("href");
            noticias.push({
              titulo,
              linkDaImagem,
              linkDoConteudo: `https://www.adorocinema.com${linkDoConteudo}`,
            });
          });
        return res.json({
          noticias,
        });
      }
    });
  } catch (error) {
    console.error("Erro ao fazer scrapping:", error);
    return res.status(500).json({ mensagem: "Erro ao fazer scrapping" });
  }
});

server.post("/scrapperOneNews", async (req, res) => {
  try {
    const url =
      "https://www.adorocinema.com/noticias/filmes/noticia-1000104374/";
    request(url, (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        const noticia = [];
        const titulo = $(".titlebar-title-lg").text().trim();
        const dataHora = $(".titlebar-subtile").find("time").attr("datetime");
        const autora = $(".author-name").text().trim();
        let texto = "";
        $(".bo-p").each((index, element) => {
          texto += $(element).text().trim() + "\n";
        });

        noticia.push({
          titulo,
          dataHora,
          autora,
          texto,
        });
        return res.json({
          noticia,
        });
      }
    });
  } catch (error) {
    console.error("Erro ao fazer scrapping:", error);
    return res.status(500).json({ mensagem: "Erro ao fazer scrapping" });
  }
});

server.listen(3000, () => {
  console.log("Servidor está funcionando...");
});

module.exports = server;
