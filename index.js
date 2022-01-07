const { query } = require("express");
const express = require("express");
const redis = require("redis");
require("dotenv").config();

const scraper = require("./scraper");

const app = express();
const client = redis.createClient({
    host: "cache",
})

const port = process.env.PORT || 3000;


const renderOpening = (opening) => {
    if(!opening) return "Opening Not Found";
    return `
    <div id="${opening.code}">
        <h4>${opening.name}</h4>
        <p>${opening.moves}</p>
    </div>
    <br /> <br />
    `;
}

const renderOpenings = (openings) => {
    if(Array.isArray(openings)) return openings.map(opening => renderOpening(opening)).join("");
    return renderOpening(openings);
}

const renderNextMove = (move) => {
    if(move) return `<h4> Next Move: <h2>${move}</h2> </h4>`;
    return "<h4> Move Not Found!! </h4>";
}

const getNextMove = (path, moves) => {
    const routes = path.replace(/^\/|\/$/g, "").split("/");
    moves = moves.replace(/^\d*\s|\s\d*\s|,/g, " ").replace(/\s{2,}/g, " ").trim().split(" ");

    for(let i = 0; i < routes.length; i++) if(moves[i] !== routes[i]) return;

    return moves[routes.length];
}

const getFromCache = (req, res, next) => {
    const { code, 0: path } = req.params;

    client.get(code || "ALL", (error, data) => {
        if(error) throw error;

        data = JSON.parse(data);
        if(data) {
            if(path) res.send(renderNextMove(getNextMove(path, data.moves)));
            else res.send(renderOpenings(data));
        } else next();
    }); 
}


app.get("/", getFromCache, async (req, res) => {
    const results = await scraper.scrapeAll();
    client.setex("ALL", 180, JSON.stringify(results));
    
    res.send(renderOpenings(results));
});


app.get("/:code", getFromCache, async (req, res) => {
    const { code } = req.params;

    const result = await scraper.scrapeByCode(code);
    client.setex(code, 180, JSON.stringify(result));
    
    res.send(renderOpening(result));
});


app.get("/:code/*", getFromCache, async (req, res) => {
    const { code, 0: path } = req.params;

    const result = await scraper.scrapeByCode(code);
    client.setex(code, 180, JSON.stringify(result));
    
    res.send(renderNextMove(getNextMove(path, result.moves)));
});


app.listen(port, () => {
  console.log(`Listening at PORT ${port}`);
});