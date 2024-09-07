// // filmes.test.js

// const request = require("supertest");
// const server = require("../index.js"); // Substitua pelo caminho correto para o arquivo do servidor
// const pool = require("../src/database/connection.js"); // Substitua pelo caminho correto para o arquivo de conexão do banco de dados

// jest.mock("../src/database/connection.js"); // Mock do pool do banco de dados

// describe("GET /filmes", () => {
//   // Mock do middleware de autenticação
//   const authenticateToken = jest.fn((req, res, next) => next());

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("deve retornar erro se nenhum filme for encontrado", async () => {
//     pool.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
//     const loginRes = await request(server).post("/login").send({
//       username: "admin",
//       password: "password",
//     });

//     const token = loginRes.body.accessToken;

//     const res = await request(server)
//       .get("/filmes")
//       .set("Authorization", `Bearer ${token}`);

//     expect(res.statusCode).toBe(400);
//     expect(res.body).toEqual({ mensagem: "Erro: Nenhum filme encontrado" });
//   });

//   it("deve retornar filmes com paginação", async () => {
//     pool.query.mockResolvedValueOnce({ rows: [{ count: "2" }] }); // Mock para a contagem de filmes

//     const loginRes = await request(server).post("/login").send({
//       username: "admin",
//       password: "password",
//     });

//     const token = loginRes.body.accessToken;
//     const res = await request(server)
//       .get("/filmes?page=1")
//       .set("Authorization", `Bearer ${token}`);

//     console.log(res.body);

//     expect(res.statusCode).toBe(200);
//     expect(res.body.filmes.length).toBe(2);
//     expect(res.body.pagination.page).toBe("1");
//     expect(res.body.pagination.prev_page_url).toBe(false);
//     expect(res.body.pagination.next_page_url).toBe(2);
//     expect(res.body.lastPage).toBe(2); // 15 filmes, 10 por página, então 2 páginas
//     expect(res.body.total).toBe(15);
//   });

//   it("deve retornar erro de servidor se houver problema ao buscar filmes", async () => {
//     pool.query.mockRejectedValueOnce(new Error("Erro ao buscar filmes"));

//     const res = await request(server)
//       .get("/filmes")
//       .set("Authorization", "Bearer fake-token");

//     expect(res.statusCode).toBe(403);
//     expect(res.body).toEqual({
//       mensagem: "Token inválido",
//     });
//   });
// });
