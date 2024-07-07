import { init } from "./server";
import microtime from "microtime";
import fs from "node:fs";
import path from "node:path";

import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env"), override: true });

let consoleLogTemp = console.log;
let writeStream = fs.createWriteStream(
    path.join(__dirname, "../logs/", "out.log"),
    { encoding: "utf-8", flags: "a" }
);

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
                    if (value[0] != ".") {
                        return " " + value + ":" + message[index + 1];
                    }
                    return "";
                } else {
                    return "";
                }
            })
            .join("")}`
    );
    writeStream.write(JSON.stringify(a) + "\n");
};

console.log("start", "pid", process.pid);

init();
