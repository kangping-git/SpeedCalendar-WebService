Game.scene.add("home", (c) => {
    const w = Game.windowWidth + 2.5;
    const h = Game.windowHeight + 2.5;
    c.innerHTML = `<path d="M-2.5 -2.5 L${w} -2.5 L${w} ${
        Game.windowHeight * 0.4 - 2.5
    } L-2.5 ${
        Game.windowHeight * 0.6 - 2.5
    } L-2.5 -2.5" fill="darkred" stroke="red" stroke-width="5" />
<path d="M-2.5 ${h} L${w} ${h} L${w} ${Game.windowHeight * 0.4 + 2.5} L-2.5 ${
        Game.windowHeight * 0.6 + 2.5
    } L-2.5 ${h}" fill="darkblue" stroke="blue" stroke-width="5" />
    <text x="50" y="100" font-size="100" fill="${
        Game.login ? "white" : "gray"
    }">online</text>
    <text x="${Game.windowWidth - 50}" y="${
        Game.windowHeight - 120
    }" font-size="100" text-anchor="end" alignment-baseline="hanging" fill="white">local</text>`;
});
Game.scene.goto("home");
