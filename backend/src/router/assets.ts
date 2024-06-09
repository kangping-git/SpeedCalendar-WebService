import path from "path";
import { responses } from "../types/server.module";
import fs, { stat } from "fs/promises";
import { contentType, lookup } from "mime-types";
import { createReadStream } from "fs";

let $module: responses = {
    basePath: "/assets/",
    route: [
        {
            method: "GET",
            path: /^\/assets\/(css|js|other)\//,
            callback: async (req, res) => {
                if (
                    process.env.cache == void 0 ||
                    process.env.cache == "true"
                ) {
                    res.setHeader("Cache-Control", "max-age=65400");
                }
                const assetsPath = path.join(
                    __dirname,
                    "../../../frontend/",
                    req.url.slice(7)
                );
                const assetsBase = path.join(__dirname, "../../../frontend/");
                if (
                    path.basename(assetsPath).startsWith("$") &&
                    !(await res.auth.permission()).has("admin")
                ) {
                    res.errorPage(404);
                    return;
                }
                if (assetsPath.startsWith(path.join(assetsBase, "js"))) {
                    res.setHeader(
                        "content-type",
                        "text/javascript; charset=utf-8"
                    );
                } else if (
                    assetsPath.startsWith(path.join(assetsBase, "css"))
                ) {
                    res.setHeader("content-type", "text/css; charset=utf-8");
                } else if (
                    assetsPath.startsWith(path.join(assetsBase, "other"))
                ) {
                    res.setHeader(
                        "content-type",
                        contentType(path.basename(assetsPath)).toString()
                    );
                } else {
                    res.errorPage(404);
                    return;
                }
                if (lookup(path.basename(assetsPath)) == "video/mp4") {
                    const range = req.headers.range;
                    if (!range) {
                        res.statusCode = 400;
                        res.statusMessage = "Bad Request";
                        res.end("400 Bad Request");
                        return;
                    }
                    const videoSize = (await stat(assetsPath)).size;
                    const CHUNK_SIZE = 10 ** 6;
                    const start = Number(range.replace(/\D/g, ""));
                    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
                    const contentLength = end - start + 1;
                    const headers = {
                        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Length": contentLength,
                        "Content-Type": "video/mp4",
                    };
                    res.writeHead(206, headers);
                    const videoStream = createReadStream(assetsPath, {
                        start,
                        end,
                    });
                    videoStream.pipe(res);
                } else {
                    let stream = createReadStream(assetsPath);
                    stream.on("error", () => {
                        res.errorPage(404);
                        return;
                    });
                    stream.pipe(res);
                }
            },
        },
        {
            method: "GET",
            path: "/list/",
            callback: async (req, res) => {
                if ((await res.auth.permission()).has("admin")) {
                    res.end(
                        JSON.stringify(
                            await fs.readdir(
                                path.join(__dirname, "../../../frontend/other/")
                            )
                        )
                    );
                } else {
                    res.errorPage(403);
                }
            },
        },
    ],
};

module.exports = $module;
