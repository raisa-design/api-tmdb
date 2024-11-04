const cheerio = require("cheerio");
const request = require("request");

class ScrapperController {
  async scrapperNews(req, res) {
    try {
      const url = "https://www.adorocinema.com/noticias/filmes/";
      request(url, (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);

          const noticias = [];
          $(".news-card")
            .slice(0, 10)
            .each((index, element) => {
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
