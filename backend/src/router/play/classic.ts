import { responses } from "../../types/server.module";

String.prototype.bytes = function () {
    return encodeURIComponent(this.toString()).replace(/%../g, "x").length;
};

let $module: responses = {
    basePath: "/play/games/classic/",
    route: [
        {
            method: "GET",
            path: "/",
            callback: (req, res) => {
                res.render("/ejs/play/games/classic/classic.ejs", {});
            },
        },
        {
            method: "POST",
            path: "/submit",
            callback: (req, res) => {
                if (!req.user) {
                    res.errorPage(403);
                    return;
                }
                let body: Buffer[] = [];
                req.on("data", (chunk) => {
                    body.push(chunk);
                });
                req.on("end", () => {
                    try {
                        let input = JSON.parse(Buffer.concat(body).toString());
                        if ("type" in input && "time" in input && "score" in input && "comment" in input) {
                            if (
                                typeof input.type == "number" &&
                                typeof input.time == "number" &&
                                typeof input.score == "number" &&
                                typeof input.comment == "string"
                            ) {
                                if (input.comment.bytes() < 200) {
                                    res.mysqlConnection.query("insert into classic (username,scoreTime,score,scoreDate,comment,mode) VALUES (?,?,?,?,?,?)", [
                                        req.user,
                                        input.time,
                                        input.score,
                                        new Date(),
                                        input.comment,
                                        input.type,
                                    ]);
                                    res.end("Complete");
                                    return;
                                }
                            }
                        }
                        res.errorPage(400);
                    } catch (e) {
                        res.errorPage(400);
                    }
                });
            },
        },
        {
            method: "GET",
            path: "/ranking/api",
            callback: (req, res) => {
                res.mysqlConnection
                    .query("SELECT * FROM classic where mode=? order by scoreTime limit ?,50", [
                        Number(req.URLObj.searchParams.get("mode")),
                        Number(req.URLObj.searchParams.get("page")) * 50,
                    ])
                    .then((value) => {
                        res.setHeader("content-type", "application/json");
                        res.end(JSON.stringify(value[0]));
                    });
            },
        },
        {
            method: "GET",
            path: "/ranking/",
            callback: (req, res) => {
                res.render("/ejs/play/games/classic/ranking.ejs", {});
            },
        },
    ],
};

module.exports = $module;
