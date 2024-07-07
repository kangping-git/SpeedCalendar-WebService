import crypto from "crypto";

export function createSalt() {
    return new Array(64)
        .fill("0")
        .map(() => String.fromCharCode(crypto.randomInt(32, 127)))
        .join("");
}
