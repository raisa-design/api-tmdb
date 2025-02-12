import { Request, Response } from "express";
const cheerio = require("cheerio");
const request = require("request");

interface Noticia {
  titulo: string;
  linkDaImagem: string;
  linkDoConteudo: string;
}

interface RequestCallback {
  error: Error | null;
  response: {
    statusCode: number;
  };
  html: string;
}

class ScrapperController {
  async scrapperNews(req: Request, res: Response){
    try {
      const url = "https://www.adorocinema.com/noticias/filmes/";
      request(url, (error: Error | null, response: RequestCallback['response'], html: string) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);

          const noticias: Noticia[] = [];
          $(".news-card")
            .slice(0, 10)
            .each((index: number, element: cheerio.Element) => {
              const titulo = $(element).find(".meta-title-link").text().trim();
              const linkDaImagem = $(element)
                .find(".thumbnail-img")
                .attr("src");
              const linkDoConteudo = $(element)
                .find(".meta-title-link")
                .attr("href");
              noticias.push({
                titulo,
                linkDaImagem,
                linkDoConteudo: `https://www.adorocinema.com${linkDoConteudo}`,
              });
            });
          return res.json({
            noticias,
          });
        }
      });
    } catch (error) {
      console.error("Erro ao fazer scrapping:", error);
      return res.status(500).json({ mensagem: "Erro ao fazer scrapping" });
    }
  }
}

module.exports = new ScrapperController();