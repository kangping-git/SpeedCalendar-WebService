interface String extends String {
    bytes: () => number;
}

declare var String: String;
