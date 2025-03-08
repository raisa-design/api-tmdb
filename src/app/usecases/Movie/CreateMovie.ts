import axios from "axios";
import { Movie } from "../../../domain/entities/Movie";
import { IMovieRepository } from "../../../domain/respositories/MovieRespository";
import { UseCase } from "../contracts/UseCase";
import { TMDBResource } from "../../../types/TMDBResource";

const TMDB_API_KEY = "79b3ceee03442ea90980fe372e0b8fdc";

export class CreateMovieUseCase implements UseCase<void> {
  constructor(private movieRepository: IMovieRepository) {}

  async execute(title: string) { 
    const response = await axios.get("https://api.themoviedb.org/3/search/movie", {
        params: {
            api_key: TMDB_API_KEY,
            query: title,
        },
    });

    const filmes = response.data.results;

    if (filmes.length === 0) {
        throw new Error("Filme não encontrado");
    }

    const filme = filmes[0];

    const detalhes = await axios.get(`https://api.themoviedb.org/3/movie/${filme.id}`, {
        params: {
            api_key: TMDB_API_KEY,
            append_to_response: "credits",
        },
    });

    const tmdbLinkParsed = `https://www.themoviedb.org/movie/${filme.id}`;
    const diretoresParsed = detalhes.data.credits.crew.filter((member: any) => member.job === "Director").map((d: TMDBResource) => d.name).join(", ");
    const roteiristasParsed = detalhes.data.credits.crew.filter((member: any) => member.job === "Screenplay" || member.job === "Writer").map((d: TMDBResource) => d.name).join(", ");
    const artistasParsed = detalhes.data.credits.cast.slice(0, 5).map((d: TMDBResource) => d.name).join(", ");

    const movie = new Movie(title, tmdbLinkParsed,  diretoresParsed, roteiristasParsed, artistasParsed);
    const savedMovie = await this.movieRepository.save(movie);

    return savedMovie;
  }
}