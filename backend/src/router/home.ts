import { responses } from "../types/server.module";

let $module: responses = {
    basePath: "/",
    route: [
        {
            method: "GET",
            path: "/",
            callback: (req, res) => {
                res.render("ejs/index.ejs", {
                    already_login: req.user != void 0 && req.user != "",
                });
            },
        },
        {
            method: "GET",
            path: "/printer/",
            callback: (req, res) => {
                res.sendFile("html/printer.html");
            },
        },
    ],
};

module.exports = $module;
