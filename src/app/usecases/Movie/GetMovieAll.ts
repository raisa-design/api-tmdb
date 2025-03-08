import { Movie } from "../../../domain/entities/Movie";
import { IMovieRepository } from "../../../domain/respositories/MovieRespository";
import { UseCase } from "../contracts/UseCase";
import { PaginationResult } from "../contracts/PaginationResult";

export class GetAllMovieUseCase implements UseCase<PaginationResult> {
  constructor(private movieRepository: IMovieRepository) {}

  async execute(page: number, limit: number): Promise<PaginationResult> {
    const total = await this.movieRepository.count();
    if (total === 0) {
      throw new Error("No movies found");
    }
    const lastPage = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const filmes = await this.movieRepository.getPaginated(limit, offset);

    return {
      filmes,
      total,
      limit,
      page,
      lastPage,
    };
  }
}
