import { Movie } from "../../../domain/entities/Movie";
import { IMovieRepository } from "../../../domain/respositories/MovieRespository";
import { UseCase } from "../contracts/UseCase";

export class UpdateByIdMovieUseCase implements UseCase<Movie | null> {
  constructor(private movieRepository: IMovieRepository) {}

  async execute(id: number): Promise<Movie | null> {
    const movie = await this.movieRepository.findById(id);
    if (!movie) {
      throw new Error("Filme não encontrado");
    }
    return movie;
    
  }
}
