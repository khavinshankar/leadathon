const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();


const getDocument = async () => {
    const raw_html = (await axios.get("https://www.chessgames.com/chessecohelp.html")).data;
    return cheerio.load(raw_html);
}

const scrapeAll = async () => {
    const $ = await getDocument();

    const results = [];
    $("table tbody tr").each((_, row) => {
        const data = $(row).find("td");
        
        results.push({
            code: $(data[0]).text(),
            name: $(data[1]).find("font b").text(), 
            moves: $(data[1]).find("font font").text(),
        });
    });

    return results;
}


const scrapeByCode = async (code) => {
    const index = codeToIndex(code);
    const $ = await getDocument();

    const data = $($("table tbody tr")[index]).find("td");
    return {
        code: $(data[0]).text(),
        name: $(data[1]).find("font b").text(), 
        moves: $(data[1]).find("font font").text(),
    }
}

const codeToIndex = (code) => {
    return (code.charCodeAt(0) - 65) * 100 + parseInt(code.slice(1));
}

module.exports = { scrapeAll, scrapeByCode };