import path from "path";
import { responses } from "../types/server.module";
import fs from "fs/promises";

let $module: responses = {
    basePath: "/status/",
    isAdminPages: true,
    route: [
        {
            method: "GET",
            path: "/",
            callback: async (req, res) => {
                res.sendFile("html/status.html");
            },
        },
        {
            method: "GET",
            path: "/cores",
            callback: async (req, res) => {
                let data = [];
                for (let i = 0; i < Number(process.env.cores); ++i) {
                    try {
                        data.push(
                            JSON.parse(
                                await fs.readFile(
                                    path.join(
                                        __dirname,
                                        "../../info/cores",
                                        i + ".info"
                                    ),
                                    "utf-8"
                                )
                            )
                        );
                    } catch {
                        i -= 1;
                        continue;
                    }
                }
                res.end(JSON.stringify(data));
            },
        },
    ],
};

module.exports = $module;
