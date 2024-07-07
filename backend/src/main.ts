import cluster from "node:cluster";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import microtime from "microtime";
import mysql from "mysql2/promise";
import http from "http";
import { config } from "dotenv";
config();

let consoleLogTemp = console.log;
let writeStream = fs.createWriteStream(path.join(__dirname, "../logs/", "out.log"), { encoding: "utf-8", flags: "a" });

console.log = async (type: string, ...message) => {
    let time = new Date();
    let a: { [keys: string]: any } = {
        time: `${time.getFullYear()}/${time.getMonth()}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${(
            microtime.nowDouble() % 1
        )
            .toFixed(6)
            .slice(2)}`,
        type: type,
    };
    consoleLogTemp(
        `[${type}] [${time.getFullYear()}/${time.getMonth()}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${(
            microtime.nowDouble() % 1
        )
            .toFixed(6)
            .slice(2)}]${message
            .map((value, index) => {
                if (index % 2 == 0) {
                    a[value] = message[index + 1];
                    return " " + value + ":" + message[index + 1];
                } else {
                    return "";
                }
            })
            .join("")}`
    );
    writeStream.write(JSON.stringify(a) + "\n");
};

const cores = os.cpus().length;
let use_cores = Math.max(cores - 2, 1);
if (process.env.max_core) {
    use_cores = Number(process.env.max_core);
}

let sessionData: Map<string, string> = new Map();

let role: Map<string, { role: bigint; lastGet: number }> = new Map();

function fork(core: number, restart_count: number, websocketServer: boolean) {
    let core_respawn_time =
        (Math.random() * (Number(process.env.respawn_max_time) - Number(process.env.respawn_min_time)) + Number(process.env.respawn_min_time)) * 1000;
    const worker = cluster.fork({
        core: core,
        cores: use_cores,
        respawn_time: core_respawn_time,
        restart_count: restart_count,
    });
    worker.on("message", async (message) => {
        try {
            let UUID = message.UUID;
            let eventType = message.eventType;
            switch (eventType) {
                case "get":
                    worker.send({
                        UUID: UUID,
                        err: false,
                        data: sessionData.get(message.key),
                    });
                    break;
                case "set":
                    sessionData.set(message.key, message.value);
                    worker.send({
                        UUID: UUID,
                        err: false,
                    });
                    break;
                case "getRole":
                    let roleCache = role.get(message.user);
                    let returnRole: bigint = 0n;
                    if (roleCache && roleCache.lastGet + 1000 * 60 * 30 > Date.now()) {
                        returnRole = roleCache.role;
                    } else {
                        let ret = (await connection.query("select role from users where user_name=?", message.user)) as mysql.RowDataPacket[];
                        returnRole = BigInt(ret[0][0].role);
                        role.set(message.user, {
                            lastGet: Date.now(),
                            role: returnRole,
                        });
                    }
                    worker.send({
                        UUID: UUID,
                        err: false,
                        role: returnRole.toString(),
                    });
                    break;
            }
        } catch (e) {
            console.debug(e);
            worker.send({
                UUID: message.UUID,
                err: true,
            });
        }
    });
    let time = setTimeout(() => {
        worker.kill();
    }, core_respawn_time);
    worker.on("disconnect", () => {
        clearTimeout(time);
    });
    worker.on("exit", () => {
        console.log("process_restart");
        fork(core, restart_count + 1, websocketServer);
    });
}

let connection: mysql.Connection;
async function init() {
    connection = await mysql.createConnection({
        host: "localhost",
        port: 3306,
        user: "node",
        password: process.env.MySQL_Pass,
        database: "speedCalendar",
        stringifyObjects: true,
    });
}

init();

cluster.setupPrimary({
    exec: path.join(__dirname, "./index.js"),
});
cluster.schedulingPolicy = cluster.SCHED_NONE;
process.stdout.write("\x1bc");

fork(0, 0, true);
for (let i = 1; i < use_cores + 1; ++i) {
    fork(i, 0, false);
}

let last = Date.now() - 1000;

process.on("SIGINT", () => {
    if (Date.now() - 1000 > last) {
        if (cluster.workers) {
            for (const worker of Object.values(cluster.workers)) {
                worker?.kill();
            }
        }
        last = Date.now();
    } else {
        process.exit();
    }
});
