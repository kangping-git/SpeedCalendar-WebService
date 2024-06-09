import http from "http";
import { Connection } from "mysql2/promise";

export interface req_extends extends http.IncomingMessage {
    URLObj: URL;
    url: string;
    method: string;
    session: string;
    user: string;
    ip: string;
}
export interface res_extends extends http.ServerResponse<http.IncomingMessage> {
    req: http.IncomingMessage;
    render: (file: string, context: object) => void;
    renderText: (text: string, context: object) => void;
    sendFile: (file: string) => void;
    json: (object: object) => void;
    auth: {
        permission: () => Promise<Set<string>>;
        cache?: Set<string>;
    };
    mysqlConnection: Connection;
    errorPage: (statusCode: number) => void;
}

export type responses = {
    basePath: string;
    isAdminPages?: boolean;
    route: {
        method: string;
        path: string | ((path: string) => boolean) | RegExp;
        callback: (req: req_extends, res: res_extends) => any;
    }[];
};

export type routingData = {
    TextBase: {
        [keys: string]: {
            callback: (req: req_extends, res: res_extends) => any;
            isAdminPage: boolean;
        };
    };
    callbackBase: {
        checker: (path: string) => boolean;
        callback: (req: req_extends, res: res_extends) => any;
        isAdminPage: boolean;
    }[];
    RegExpBase: {
        checker: RegExp;
        callback: (req: req_extends, res: res_extends) => any;
        isAdminPage: boolean;
    }[];
};
