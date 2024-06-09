import { randomUUID } from "crypto";

let eventMap: Map<string, (resolve: (value: unknown) => any) => any> =
    new Map();

process.on("message", (message: any) => {
    let handler = eventMap.get(message.UUID);
    if (handler) {
        handler(message);
    }
});

export function sessionGet(key: string) {
    let uuid = randomUUID();
    if (process.send) {
        process.send({
            UUID: uuid,
            eventType: "get",
            key: key,
        });
    }
    return new Promise<any>((resolve, reject) => {
        eventMap.set(uuid, resolve);
    });
}

export function sessionSet(key: string, value: string) {
    let uuid = randomUUID();
    if (process.send) {
        process.send({
            UUID: uuid,
            eventType: "set",
            key: key,
            value: value,
        });
    }
    return new Promise((resolve, reject) => {
        eventMap.set(uuid, resolve);
    });
}

export function getRole(userName: string) {
    let uuid = randomUUID();
    if (process.send) {
        process.send({
            UUID: uuid,
            eventType: "getRole",
            user: userName,
        });
    }
    return new Promise<any>((resolve, reject) => {
        eventMap.set(uuid, resolve);
    });
}
