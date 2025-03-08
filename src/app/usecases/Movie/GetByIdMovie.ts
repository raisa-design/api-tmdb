import { IMovieRepository } from "../../../domain/respositories/MovieRespository";
import { UseCase } from "../contracts/UseCase";
import { Movie } from "../../../domain/entities/Movie";

export class GetByIdMovieUseCase implements UseCase<Movie | null> {
  constructor(private movieRepository: IMovieRepository) {}

  async execute(id: number): Promise<Movie | null> {
    const movie = await this.movieRepository.findById(id);
     
    return movie;
  }
}
