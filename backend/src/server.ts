import fs from "node:fs/promises";
import path from "node:path";
import path_posix from "node:path/posix";
import http from "http";
import https from "https";
import ejs from "ejs";
import {
    req_extends,
    res_extends,
    responses,
    routingData,
} from "./types/server.module";
import mysql from "mysql2/promise";
import { createReadStream } from "node:fs";
import { initMailer, mailer } from "./utils/mail";
import { getRole, sessionGet, sessionSet } from "./utils/IPC";
import { createSalt } from "./utils/createSalt";

let server;
let connection: mysql.Connection;

let count = 0;
let uptime = Date.now();
let roles = ["admin"];

function updateInfo() {
    fs.writeFile(
        path.join(__dirname, "../info/cores/", process.env.core + ".info"),
        JSON.stringify({
            count: count,
            uptime: Date.now() - uptime,
            updateDate: Date.now(),
            core_respawn_time: process.env.respawn_time,
            restart_count: process.env.restart_count,
        })
    );
}

export async function init() {
    const routers = await fs.readdir(path.join(__dirname, "./router/"), {
        recursive: true,
        withFileTypes: true,
    });
    connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "node",
        password: process.env.MySQL_Pass,
        database: "speedCalendar",
        stringifyObjects: true,
    });
    initMailer();
    const routingData: routingData = {
        TextBase: {},
        callbackBase: [],
        RegExpBase: [],
    };
    for (let i of routers) {
        if (i.isFile()) {
            const $module: responses = require(path.join(i.path, i.name));
            let base = $module.basePath;
            $module.route.forEach((value) => {
                if (typeof value.path == "string") {
                    routingData.TextBase[
                        value.method + "#" + path_posix.join(base, value.path)
                    ] = {
                        callback: value.callback,
                        isAdminPage: $module.isAdminPages ? true : false,
                    };
                } else if (typeof value.path == "function") {
                    routingData.callbackBase.push({
                        checker: value.path,
                        callback: value.callback,
                        isAdminPage: $module.isAdminPages ? true : false,
                    });
                } else {
                    routingData.RegExpBase.push({
                        checker: value.path,
                        callback: value.callback,
                        isAdminPage: $module.isAdminPages ? true : false,
                    });
                }
            });
        }
    }
    const options = {
        key: await fs.readFile(path.join(__dirname, "../keys/server.key")),
        cert: await fs.readFile(path.join(__dirname, "../keys/server.crt")),
    };
    let serverHandle = async (
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage>
    ) => {
        count += 1;
        let start = performance.now();
        let cookieRaw = req.headers.cookie as string;
        if (!cookieRaw) {
            cookieRaw = "";
        }
        let cookie = new URLSearchParams(cookieRaw);
        let session = cookie.get("session") as string;
        if (!session) {
            session = createSalt();
            res.setHeader(
                "set-cookie",
                "session=" +
                    encodeURIComponent(session) +
                    "; Max-Age:" +
                    60 * 60 * 24 * 365 +
                    " ; Path=/; HttpOnly"
            );
            sessionSet(session, "");
        }

        let user = (await sessionGet(session)).data;

        res.on("finish", () => {
            console.log(
                "http access",
                "method",
                req.method,
                "url",
                extends_req.url,
                "pid",
                process.pid,
                "time",
                (performance.now() - start).toFixed(5),
                "core",
                process.env.core,
                "session",
                session
            );
        });
        let ip = "0.0.0.0";
        if (req.connection && req.connection.remoteAddress) {
            ip = req.connection.remoteAddress;
        }
        if (req.socket && req.socket.remoteAddress) {
            ip = req.socket.remoteAddress;
        }
        let extends_req: req_extends = Object.assign(req, {
            URLObj: new URL("http://" + req.headers.host + req.url),
            url: "",
            method: String(req.method),
            session: session,
            user: user,
            ip: ip,
        });
        extends_req.url = extends_req.URLObj.pathname;
        const renderOptions = {
            user: user,
        };
        let extends_res: res_extends = Object.assign(res, {
            render: (file: string, context: object) => {
                ejs.renderFile(
                    path.join(__dirname, "../../frontend/", file),
                    Object.assign(renderOptions, context)
                ).then((result) => {
                    res.setHeader("content-type", "text/html; charset=utf-8");
                    res.end(result);
                });
            },
            renderText: (text: string, context: object) => {
                res.setHeader("content-type", "text/html; charset=utf-8");
                res.end(
                    ejs.render(text, Object.assign(renderOptions, context))
                );
            },
            json: (object: object) => {
                res.end(JSON.stringify(object));
            },
            sendFile: (file: string) => {
                const readStream = createReadStream(
                    path.join(__dirname, "../../frontend/", file)
                );
                readStream.pipe(res);
            },
            auth: {
                permission: async () => {
                    if (extends_res.auth.cache) {
                        return extends_res.auth.cache;
                    }
                    let role = new Set<string>();
                    if (user) {
                        let roleData = BigInt((await getRole(user)).role);
                        let i = 1n;
                        for (let _ in roles) {
                            if ((roleData & i) == 1n) {
                                role.add(roles[_]);
                            }
                        }
                    }
                    extends_res.auth.cache = role;
                    return role;
                },
                cache: undefined,
            },
            mysqlConnection: connection,
            errorPage: (statusCode: number) => {
                res.statusCode = statusCode;
                res.statusMessage = http.STATUS_CODES[statusCode] as string;
                extends_res.render("ejs/error.ejs", {
                    statusCode: statusCode,
                    statusMsg: http.STATUS_CODES[statusCode],
                });
            },
        });
        if (
            `${extends_req.method}#${extends_req.url}` in routingData.TextBase
        ) {
            if (
                !routingData.TextBase[
                    `${extends_req.method}#${extends_req.url}`
                ].isAdminPage ||
                (await extends_res.auth.permission()).has("admin")
            ) {
                routingData.TextBase[
                    `${extends_req.method}#${extends_req.url}`
                ].callback(extends_req, extends_res);
                return;
            }
        }

        let filter = routingData.callbackBase.filter((value) => {
            return value.checker(extends_req.url as string);
        });
        if (filter.length) {
            if (
                !filter[0].isAdminPage ||
                (await extends_res.auth.permission()).has("admin")
            ) {
                filter[0].callback(extends_req, extends_res);
                return;
            }
        }
        let filter2 = routingData.RegExpBase.filter((value) => {
            return value.checker.exec(extends_req.url as string);
        });
        if (filter2.length) {
            if (
                !filter2[0].isAdminPage ||
                (await extends_res.auth.permission()).has("admin")
            ) {
                filter2[0].callback(extends_req, extends_res);
                return;
            }
        }
        extends_res.errorPage(404);
    };
    server = https.createServer(options, serverHandle);
    server.listen(443);
    server.on("listening", () => {
        uptime = Date.now();
        updateInfo();
        setInterval(updateInfo, 1000);
    });

    let server_redirect = http.createServer((req, res) => {
        if (process.env.needSSL == void 0 || process.env.needSSL == "true") {
            res.statusCode = 308;
            res.statusMessage = "Permanent Redirect";
            res.setHeader("Location", "https://" + req.headers.host + req.url);
            res.end("");
        } else {
            serverHandle(req, res);
        }
    });
    server_redirect.listen(80);
}
