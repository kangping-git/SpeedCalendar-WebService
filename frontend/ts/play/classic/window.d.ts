interface Window {
    submit_twitter: () => void;
    submit_result: () => void;
    key_down: (key: number) => void;
}

declare var window: Window;

interface String extends String {
    bytes: () => number;
}

declare var String: String;
