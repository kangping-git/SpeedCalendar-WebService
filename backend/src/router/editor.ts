import { readFile, stat, writeFile } from "node:fs/promises";
import { responses } from "../types/server.module";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mime from "mime-types";
import { createWriteStream } from "node:fs";
import * as cheerio from "cheerio";
import axios from "axios";

async function getPageInfo(url: string): Promise<{
    title: string;
    description: string;
    image: string;
}> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const title = $("title").text();
    let _ = $('meta[name="description"]').attr("content");
    const description = _ ? _ : "";

    _ = $('meta[property="og:image"]').attr("content");
    const image = _ ? _ : "";

    return { title, description, image };
}

let $module: responses = {
    basePath: "/editor/",
    isAdminPages: true,
    route: [
        {
            method: "GET",
            path: "/edit",
            callback: async (req, res) => {
                res.render("ejs/blogs/editor.ejs", {});
            },
        },
        {
            method: "GET",
            path: "/main.js",
            callback: async (req, res) => {
                res.sendFile("../editor/dist/main.js");
            },
        },
        {
            method: "GET",
            path: "/get",
            callback: async (req, res) => {
                res.json({
                    saveData: {
                        time: Date.now(),
                        blocks: [
                            {
                                data: { text: "title", level: 1 },
                                id: "jWsy8FSBRk",
                                type: "header",
                            },
                        ],
                        version: "2.29.1",
                    },
                    isNew: true,
                });
            },
        },
        {
            method: "POST",
            path: "/save",
            callback: async (req, res) => {},
        },
        {
            method: "GET",
            path: "/fetch",
            callback: async (req, res) => {
                let url = req.URLObj.searchParams.get("url");
                if (url) {
                    try {
                        url = decodeURIComponent(url);
                        let pageInfo = await getPageInfo(url);
                        res.end(
                            JSON.stringify({
                                success: 1,
                                link: url,
                                meta: {
                                    title: pageInfo.title,
                                    description: pageInfo.description,
                                    image: {
                                        url: pageInfo.image,
                                    },
                                },
                            })
                        );
                    } catch (e) {
                        res.errorPage(500);
                    }
                } else {
                    res.errorPage(400);
                }
            },
        },
        {
            method: "POST",
            path: "/upload",
            callback: (req, res) => {
                let mimeType = req.URLObj.searchParams.get("mimeType");
                if (!mimeType) {
                    res.end(
                        JSON.stringify({
                            success: 0,
                        })
                    );
                    return;
                }
                let ext = mime.extension(mimeType);
                if (!ext) {
                    res.end(
                        JSON.stringify({
                            success: 0,
                        })
                    );
                    return;
                }
                let fileName = randomUUID();
                let stream = createWriteStream(
                    path.join(
                        __dirname,
                        "../../../frontend/other/",
                        fileName + "." + ext
                    )
                );
                req.on("data", (chunk) => {
                    stream.write(chunk);
                });
                req.on("end", () => {
                    stream.end();
                    res.end(
                        JSON.stringify({
                            success: 1,
                            file: {
                                url: "/assets/other/" + fileName + "." + ext,
                            },
                        })
                    );
                });
            },
        },
    ],
};

module.exports = $module;
