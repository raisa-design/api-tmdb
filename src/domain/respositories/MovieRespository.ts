import { Movie } from "../entities/Movie";

export interface IMovieRepository {
  save(movie: Movie): Promise<void>;
}
