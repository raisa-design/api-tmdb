export class Movie {
  private filme: string;
  private tmdbLink: string;
  private diretores: string[];
  private roteiristas: string[];
  private artistas: string[];

  constructor(
    filme: string,
    tmdbLink: string,
    diretores: string[],
    roteiristas: string[],
    artistas: string[]
  ) {
    if (!filme || !tmdbLink || !diretores || !roteiristas || !artistas) {
      throw new Error("All movie fields are required.");
    }

    this.filme = filme;
    this.tmdbLink = tmdbLink;
    this.diretores = diretores;
    this.roteiristas = roteiristas;
    this.artistas = artistas;
  }

  // Getters para acessar as propriedades privadas
  public getFilme(): string {
    return this.filme;
  }

  public getTmdbLink(): string {
    return this.tmdbLink;
  }

  public getDiretores(): string[] {
    return this.diretores;
  }

  public getRoteiristas(): string[] {
    return this.roteiristas;
  }

  public getArtistas(): string[] {
    return this.artistas;
  }
}