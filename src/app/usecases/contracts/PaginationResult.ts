import { Movie } from "../../../domain/entities/Movie";

export interface PaginationResult {
  filmes: Movie[];
  total: number;
  limit: number;
  page: number;
  lastPage: number;
}