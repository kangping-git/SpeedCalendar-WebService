import { responses } from "../../types/server.module";

let $module: responses = {
    basePath: "/play/",
    route: [
        {
            method: "GET",
            path: "/",
            callback: (req, res) => {
                console.log("loginUser", "user", req.user);
                res.render("ejs/play/play.ejs", {
                    already_login: req.user != void 0 && req.user != "",
                    user: req.user,
                });
            },
        },
    ],
};

module.exports = $module;
