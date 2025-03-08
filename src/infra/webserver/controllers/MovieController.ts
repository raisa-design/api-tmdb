import { Request, Response } from "express";
import { z } from "zod";
import { UseCase } from "../../../app/usecases/contracts/UseCase";
import { CreateMovieUseCase } from "../../../app/usecases/Movie/CreateMovie";
import { MovieRepository } from "../../database/MovieRepository";
import { GetByIdMovieUseCase } from "../../../app/usecases/Movie/GetByIdMovie";
import { Movie } from "../../../domain/entities/Movie";
import { UpdateByIdMovieUseCase } from "../../../app/usecases/Movie/UpdateByIdMovie";
import { GetAllMovieUseCase } from "../../../app/usecases/Movie/GetMovieAll";
import { PaginationResult } from "../../../app/usecases/contracts/PaginationResult";


class MovieController {
  movieModel: any;

  constructor(
    private readonly createMovieUseCase: UseCase<void>,
    private readonly getIdMovieUseCase: UseCase<Movie | null>,
    private readonly updateIdMovieUseCase: UseCase<Movie | null>,
    private readonly getAllMovieUseCase: UseCase<PaginationResult>

  ) {
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

  async getMovieById(req: Request, res: Response): Promise<Response> {
    console.log("chegou aqui", req.params.id);
    const id = Number(req.params.id);

    try {
      const filme = await this.getIdMovieUseCase.execute(id);
      return res.json(filme);
    } catch (error: any) {
      if (error.message === "Filme não encontrado") {
        return res.status(404).json({ mensagem: error.message });
      }
      console.error("Erro ao buscar filme:", error);
      return res.status(500).json({ 
        mensagem: "Erro ao buscar filme", 
        erro: error.message 
      });
    }
  }


  async updateMovie(req: Request, res: Response): Promise<Response> {
    const id = Number(req.params.id);
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
      await this.updateIdMovieUseCase.execute(id, validation.data.titulo);
      return res.json({ mensagem: "Filme atualizado com sucesso" });
    } catch (error: any) {
      if (error.message === "Filme não encontrado") {
        return res.status(404).json({ mensagem: error.message });
      }
      console.error("Erro ao editar filme:", error);
      return res.status(500).json({ mensagem: "Erro ao editar filme" });
    }
  }

  async getMovieAll(req: Request, res: Response): Promise<Response> {

    const page = Number(req.query.page) || 1;
    const limit = 10;
    try {
      const result = await this.getAllMovieUseCase.execute(page, limit);
      
      const pagination = {
        path: "/filmes",
        page: result.page,
        prev_page_url: result.page - 1 >= 1 ? result.page - 1 : false,
        next_page_url: result.page + 1 > result.lastPage ? false : result.page + 1
      };

      return res.json({
        filmes: result.filmes,
        pagination,
        lastPage: result.lastPage,
        total: result.total
      });
    } catch (error: any) {
      if (error.message === "Nenhum filme encontrado") {
        return res.status(400).json({ mensagem: error.message });
      }
      console.error("Erro ao buscar filmes:", error);
      return res.status(500).json({ 
        mensagem: "Erro ao buscar filmes",
        erro: error.message 
      });
    }
  }

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
export = new MovieController(new CreateMovieUseCase(new MovieRepository()),
 new GetByIdMovieUseCase(new MovieRepository()),
 new UpdateByIdMovieUseCase(new MovieRepository()),
 new GetAllMovieUseCase(new MovieRepository())
);
