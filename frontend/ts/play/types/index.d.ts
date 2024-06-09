declare var Game: {
    scene: {
        add: (name: string, func: (c: SVGSVGElement) => any) => void;
        goto: (sceneName: string) => void;
        sceneMap: Map<string, (c: SVGSVGElement) => any>;
        now: string;
    };
    content: SVGSVGElement | null;
    windowWidth: number;
    windowHeight: number;
    login: boolean;
    loginUser: string;
};
