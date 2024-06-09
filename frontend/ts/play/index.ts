window.Game = {
    content: null,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    scene: {
        add: (name, func) => {
            Game.scene.sceneMap.set(name, func);
        },
        goto: (sceneName) => {
            Game.scene.now = sceneName;
        },
        sceneMap: new Map(),
        now: "",
    },
    login: false,
    loginUser: "",
};

window.addEventListener("load", () => {
    window.addEventListener("resize", () => {
        Game.windowWidth = window.innerWidth;
        Game.windowHeight = window.innerHeight;
        mainSVG.style.width = windowWidth + "px";
        mainSVG.style.height = windowHeight + "px";
        mainSVG.setAttribute(
            "viewBox",
            "0 0 " + windowWidth + " " + windowHeight
        );
        tick();
    });
    let mainSVG = document.getElementById(
        "main_svg"
    ) as unknown as SVGSVGElement;
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    Game.loginUser = (
        document.getElementById("user") as HTMLInputElement
    ).value;
    Game.login = Game.loginUser != "";
    mainSVG.style.width = windowWidth + "px";
    mainSVG.style.height = windowHeight + "px";
    Game.content = mainSVG;
    mainSVG.setAttribute("viewBox", "0 0 " + windowWidth + " " + windowHeight);

    function tick() {
        requestAnimationFrame(tick);
        let scene = Game.scene.sceneMap.get(Game.scene.now);
        if (scene) {
            scene(mainSVG);
        }
    }
    tick();
});
