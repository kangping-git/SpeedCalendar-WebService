import { RowDataPacket } from "mysql2";
import { responses } from "../types/server.module";
import crypto, { randomUUID } from "crypto";
import { createSalt } from "../utils/createSalt";
import { mailer } from "../utils/mail";
import { sessionSet } from "../utils/IPC";

let $module: responses = {
    basePath: "/accounts/",
    route: [
        {
            method: "GET",
            path: (href) => ["/accounts/", "/accounts/login"].includes(href),
            callback: (req, res) => {
                res.render("ejs/accounts/login.ejs", {
                    msg: "",
                    siteKey: process.env.CAPTCHA_site_key,
                });
            },
        },
        {
            method: "GET",
            path: "/signup/",
            callback: (req, res) => {
                res.render("ejs/accounts/signup.ejs", {
                    msg: "",
                    siteKey: process.env.CAPTCHA_site_key,
                });
            },
        },
        {
            method: "POST",
            path: "/login",
            callback: (req, res) => {
                let chunks: Buffer[] = [];
                req.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                req.on("end", async () => {
                    try {
                        let data = new URLSearchParams(
                            Buffer.concat(chunks).toString()
                        );

                        let token = data.get("cf-turnstile-response");

                        let username = data.get("username");
                        let password = data.get("password");
                        if (
                            username &&
                            password &&
                            token &&
                            typeof username == "string"
                        ) {
                            let ip = req.ip;
                            let formData = new FormData();
                            formData.append(
                                "secret",
                                process.env.CAPTCHA_secret_key as string
                            );
                            formData.append("response", token);
                            formData.append("remoteip", ip);

                            const result = await fetch(
                                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                                {
                                    body: formData,
                                    method: "POST",
                                }
                            );
                            const outcome = await result.json();
                            if (!outcome.success) {
                                res.render("ejs/accounts/login.ejs", {
                                    msg: "The CAPTCHA is incorrect.",
                                    siteKey: process.env.CAPTCHA_site_key,
                                });
                                return;
                            }

                            res.mysqlConnection
                                .query(
                                    "select * from users where user_name=?",
                                    [username]
                                )
                                .then((value) => {
                                    let user = value[0] as RowDataPacket[];
                                    if (user[0]) {
                                        const hash = crypto
                                            .createHash("sha256")
                                            .update(
                                                password + user[0].password_salt
                                            )
                                            .digest("hex");
                                        if (hash == user[0].password_hash) {
                                            res.statusCode = 302;
                                            res.statusMessage = "Found";
                                            res.setHeader("location", "/");
                                            res.end();
                                            sessionSet(req.session, username);
                                        } else {
                                            res.render(
                                                "ejs/accounts/login.ejs",
                                                {
                                                    msg: "Incorrect username or password",
                                                    siteKey:
                                                        process.env
                                                            .CAPTCHA_site_key,
                                                }
                                            );
                                        }
                                    } else {
                                        res.render("ejs/accounts/login.ejs", {
                                            msg: "Incorrect username or password",
                                            siteKey:
                                                process.env.CAPTCHA_site_key,
                                        });
                                    }
                                })
                                .catch((err) => {
                                    console.log("mysqlError", "msg", err);
                                    res.errorPage(500);
                                });
                        } else {
                            res.render("ejs/accounts/login.ejs", {
                                msg: "Incorrect username or password",
                                siteKey: process.env.CAPTCHA_site_key,
                            });
                        }
                    } catch (e) {
                        res.errorPage(400);
                    }
                });
            },
        },
        {
            method: "POST",
            path: "/signup",
            callback: (req, res) => {
                let chunks: Buffer[] = [];
                req.on("data", (chunk) => {
                    chunks.push(chunk);
                });
                req.on("end", async () => {
                    try {
                        let data = new URLSearchParams(
                            Buffer.concat(chunks).toString()
                        );
                        let username = data.get("username");
                        let mailAddress = data.get("mail_address");
                        let password = data.get("password");
                        let passwordRetype = data.get("password_retype");
                        let token = data.get("cf-turnstile-response");
                        if (password != passwordRetype) {
                            res.render("ejs/accounts/signup.ejs", {
                                msg: "Password does not match",
                            });
                            return;
                        }
                        if (
                            typeof username == "string" &&
                            typeof mailAddress == "string" &&
                            typeof password == "string" &&
                            typeof passwordRetype == "string" &&
                            typeof token == "string"
                        ) {
                            let ip = req.ip;
                            let formData = new FormData();
                            formData.append(
                                "secret",
                                process.env.CAPTCHA_secret_key as string
                            );
                            formData.append("response", token);
                            formData.append("remoteip", ip);

                            const result = await fetch(
                                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                                {
                                    body: formData,
                                    method: "POST",
                                }
                            );
                            const outcome = await result.json();
                            if (!outcome.success) {
                                res.render("ejs/accounts/signup.ejs", {
                                    msg: "The CAPTCHA is incorrect.",
                                    siteKey: process.env.CAPTCHA_site_key,
                                });
                                return;
                            }
                            if (
                                mailAddress.length > 190 ||
                                password.length < 5 ||
                                password.length > 200 ||
                                !mailAddress.match(
                                    /^[a-zA-Z0-9_+-]+(.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/
                                ) ||
                                !username.match(/^[a-zA-Z0-9_]{3,50}$/)
                            ) {
                                res.render("ejs/accounts/signup.ejs", {
                                    msg: "Invalid data",
                                    siteKey: process.env.CAPTCHA_site_key,
                                });
                            }
                            res.mysqlConnection
                                .query(
                                    "select * from users where user_name=?",
                                    [username]
                                )
                                .then((value) => {
                                    let user = value[0] as RowDataPacket[];
                                    if (user.length > 0) {
                                        res.render("ejs/accounts/signup.ejs", {
                                            msg: "Username is already used",
                                            siteKey:
                                                process.env.CAPTCHA_site_key,
                                        });
                                        return;
                                    }
                                    let salt = createSalt();
                                    const hash = crypto
                                        .createHash("sha256")
                                        .update(password + salt)
                                        .digest("hex");
                                    res.mysqlConnection
                                        .query(
                                            "insert into users (user_name,mail_address,password_hash,password_salt,isMailValid,role) VALUES (?,?,?,?,?,0)",
                                            [
                                                username,
                                                mailAddress,
                                                hash,
                                                salt,
                                                0,
                                            ]
                                        )
                                        .then(() => {
                                            let validationId = randomUUID();
                                            res.mysqlConnection
                                                .query(
                                                    "insert into emailValidationIds (id,userId) VALUES (?,?)",
                                                    [validationId, username]
                                                )
                                                .then(() => {
                                                    mailer.sendMail({
                                                        from: process.env
                                                            .mailAddress,
                                                        to: mailAddress,
                                                        subject:
                                                            "Email Address Authentication",
                                                        text:
                                                            "Please access to https://" +
                                                            req.headers.host +
                                                            "/accounts/auth/" +
                                                            validationId,
                                                    });
                                                })
                                                .catch(() => {});
                                            res.statusCode = 302;
                                            res.statusMessage = "Found";
                                            res.setHeader("location", "/");
                                            sessionSet(req.session, username);
                                            res.end();
                                        })
                                        .catch(() => {
                                            res.errorPage(500);
                                        });
                                })
                                .catch((err) => {
                                    res.errorPage(500);
                                });
                        } else {
                            res.errorPage(400);
                        }
                    } catch (e) {
                        res.errorPage(400);
                    }
                });
            },
        },
        {
            method: "GET",
            path: /^\/accounts\/auth\/([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/,
            callback: (req, res) => {
                res.mysqlConnection
                    .query("select * from emailValidationIds where id=?", [
                        req.url.split("/")[3],
                    ])
                    .then((value) => {
                        let data = value[0] as RowDataPacket[];
                        if (data.length > 0) {
                            res.mysqlConnection.query(
                                "delete from emailValidationIds where userId=?",
                                [data[0].userId]
                            );
                            res.mysqlConnection.query(
                                "update users set isMailValid=1 where user_name=?",
                                [data[0].userId]
                            );
                            res.statusCode = 302;
                            res.statusMessage = "Found";
                            res.setHeader("location", "/");
                            res.end();
                        } else {
                            res.errorPage(404);
                        }
                    })
                    .catch(() => {
                        res.errorPage(404);
                    });
            },
        },
        {
            method: "GET",
            path: "/check/",
            callback: (req, res) => {
                res.end(req.user);
            },
        },
        {
            method: "GET",
            path: "/logout/",
            callback: (req, res) => {
                sessionSet(req.session, "");
                res.statusCode = 302;
                res.statusMessage = "Found";
                res.setHeader("Location", "/");
                res.end();
            },
        },
    ],
};

module.exports = $module;
