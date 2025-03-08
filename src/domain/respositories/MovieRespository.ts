import { Movie } from "../entities/Movie";

export interface IMovieRepository {
  save(movie: Movie): Promise<void>;
  findById(id: number): Promise<Movie | null>;
  count(): Promise<number>;
  getPaginated(limit: number, offset: number): Promise<Movie[]>;
}
