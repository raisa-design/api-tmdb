import { Request, Response } from "express";
import { z } from "zod";
import { UseCase } from "../../../app/usecases/contracts/UseCase";
import { CreateMovieUseCase } from "../../../app/usecases/Movie/CreateMovie";
import { MovieRepository } from "../../database/MovieRepository";

class MovieController {

  constructor(private readonly createMovieUseCase: UseCase) {
  }

  async createFilme(req: Request, res: Response): Promise<Response> {
    const dataSchema = z.object({
      titulo: z.string().min(1, "Título é obrigatório"),
    });
    const validation = dataSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        mensagem: "Dados inválidos, forneça o título",
        erros: validation.error.errors,
      });
    }
    try {
      const savedMovie = await this.createMovieUseCase.execute(validation.data.titulo);
      return res.json(savedMovie);
    } catch (error) {
      return res.status(500).json({ mensagem: (error as Error).message });
    }
  }

  // async getMovieId(req: Request, res: Response): Promise<Response> {
  //    const id = Number(req.params.id);

  //   try {
  //     const filme = await this.movieModel.findById(id);
  //     if (!filme) {
  //       return res.status(404).json({ mensagem: "Filme não encontrado" });
  //     }
  //     return res.json(filme);
  //   } catch (error: any) {
  //     console.error("Erro ao buscar filme:", error);
  //     return res.status(500).json({ mensagem: "Erro ao buscar filme", erro: error.message });
  //   }
  // }

  // async updateMovie(req: Request, res: Response): Promise<Response> {
  //    const id = Number(req.params.id);
  //   const { titulo } = req.body;

  //   try {
  //     const filme = await this.movieModel.updateById(id, titulo);
  //     if (!filme) {
  //       return res.status(404).json({ mensagem: "Filme não encontrado" });
  //     }

  //     return res.json({ mensagem: "Filme atualizado com sucesso" });
  //   } catch (error) {
  //     console.error("Erro ao editar filme:", error);
  //     return res.status(500).json({ mensagem: "Erro ao editar filme" });
  //   }
  // }

  // async getMovieAll(req: Request, res: Response): Promise<Response> {
  //   const page = Number(req.query.page) || 1;
  //   const limit = 10;
  //   let lastPage = 1;

  //   try {
  //     const countFilmes = await this.movieModel.countMovies();
  //     if (countFilmes === 0) {
  //       return res.status(400).json({ mensagem: "Erro: Nenhum filme encontrado" });
  //     }

  //     lastPage = Math.ceil(countFilmes / limit);
  //     const offset = (page - 1) * limit;
  //     const filmes = await this.movieModel.getMoviesPagination(limit, offset);

  //     if (filmes.length > 0) {
  //       const pagination = {
  //         path: "/filmes",
  //         page,
  //         prev_page_url: page - 1 >= 1 ? page - 1 : false,
  //         next_page_url: page + 1 > lastPage ? false : page + 1,
  //       };

  //       return res.json({ filmes, pagination, lastPage, total: countFilmes });
  //     } else {
  //       return res.status(400).json({ mensagem: "Erro: Nenhum filme encontrado" });
  //     }
  //   } catch (error: any) {
  //     console.error("Erro ao buscar filmes:", error);
  //     return res.status(500).json({ mensagem: "Erro ao buscar filmes", erro: error.message });
  //   }
  // }
}

export = new MovieController(new CreateMovieUseCase(new MovieRepository()));
