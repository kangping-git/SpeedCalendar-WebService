import { responses } from "../../types/server.module";

let $module: responses = {
    basePath: "/play/",
    route: [
        {
            method: "GET",
            path: "/",
            callback: (req, res) => {
                res.render("ejs/play/play.ejs", {
                    already_login: req.user != void 0 && req.user != "",
                    user: req.user,
                });
            },
        },
        {
            method: "GET",
            path: "/games/i18n.js",
            callback: (req, res) => {
                res.sendFile("/js/play/i18n.js");
            },
        },
    ],
};

module.exports = $module;
