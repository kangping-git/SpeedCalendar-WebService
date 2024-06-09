class random_xorShift64 {
    state: bigint;
    modulo: bigint;
    constructor(seed: bigint) {
        this.modulo = 2n ** 64n;
        this.state = seed % this.modulo;
    }
    rand() {
        let x = this.state;
        x ^= (x << 13n) % this.modulo;
        x ^= (x >> 7n) % this.modulo;
        x ^= (x << 17n) % this.modulo;
        this.state = x;
        return x;
    }
}

function createSeed() {
    let base = 1n;
    let sum = 0n;
    for (let i = 0; i < 16; ++i) {
        sum += BigInt(Math.floor(Math.random() * 16)) * base;
        base *= 16n;
    }
    return sum;
}
function toSeedString(seed: bigint) {
    return ("0".repeat(15) + seed.toString(16)).slice(-16);
}
async function loadSeedString(seed: string) {
    if (seed.match(/^[0-9a-fA-F]{0,16}$/)) {
        return BigInt(parseInt(seed, 16)) % 2n ** 64n;
    }
    return await hash(seed);
}

async function hash(text: string) {
    const uint8 = new TextEncoder().encode(text);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", uint8));
    let num = 0n;
    let pow = 1n;
    for (let i = 0; i < 32; ++i) {
        num += pow * BigInt(digest[i]);
        pow *= 16n;
        if (i % 16 == 15) {
            pow = 1n;
        }
    }

    num %= 2n ** 64n;
    return num;
}

function dayString(day: number) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
}

interface printsData {
    seed: bigint;
}

window.addEventListener("load", () => {
    const printsDataElm = document.getElementById("prints_data") as HTMLElement;
    const generateBtn = document.getElementById(
        "generate"
    ) as HTMLButtonElement;
    const printBtn = document.getElementById("print") as HTMLButtonElement;
    generateBtn.addEventListener("click", () => {
        generate();
    });
    printBtn.addEventListener("click", async () => {
        await generate();
        print();
    });

    printsDataElm.innerHTML = `
        <tr class="seed_input">
            <td><input
                class="seed_input_elm"
                type="text"
                value="${toSeedString(createSeed())}"
            ></td>
            <td width="20">
                <button class="close_button">+</button>
            </td>
        </tr>
        <tr id="new_page_btn_row">
            <td colspan="2">
                <button id="create_new_page">+</button>
            </td>
        </tr>`;
    let elm = printsDataElm.getElementsByClassName("seed_input")[0];
    elm.getElementsByClassName("close_button")[0].addEventListener(
        "click",
        () => {
            elm.remove();
        }
    );

    const createNewPageBtn = document.getElementById(
        "create_new_page"
    ) as HTMLButtonElement;
    const newPageBtnRow = document.getElementById(
        "new_page_btn_row"
    ) as HTMLTableRowElement;
    createNewPageBtn.addEventListener("click", () => {
        let seed = createSeed();
        let element = document.createElement("tr");
        element.innerHTML = `
            <td><input
                class="seed_input_elm"
                type="text"
                value="${toSeedString(seed)}"
            ></td>
            <td width="20">
                <button class="close_button">+</button>
            </td>`;
        element.className = "seed_input";
        element
            .getElementsByClassName("close_button")[0]
            .addEventListener("click", () => {
                element.remove();
            });
        newPageBtnRow.before(element);
    });

    let startDate = new Date("1582/10/15");
    let endDate = new Date("2582/10/15");

    async function generate() {
        let newPageCheckElm = document.getElementById(
            "repage_flg"
        ) as HTMLInputElement;
        let newPageFlg = false;
        if ("checked" in newPageCheckElm) {
            newPageFlg = newPageCheckElm.checked;
        }

        let seedsElm = Array.from(
            document.getElementsByClassName("seed_input_elm")
        ) as HTMLInputElement[];

        let html = "";
        for (let i of seedsElm) {
            let seed = await loadSeedString(i.value);
            let rand = new random_xorShift64(seed);
            let firstRand = rand.rand() % 256n;
            for (let i = -120n; i < firstRand; ++i) {
                rand.rand();
            }

            let problems: Date[] = [];

            for (let i = 0; i < 10; ++i) {
                let randVal = Number(rand.rand()) / 2 ** 64;
                problems.push(
                    new Date(
                        (endDate.getTime() - startDate.getTime()) * randVal +
                            startDate.getTime()
                    )
                );
            }

            html += `
                <h1>SpeedCalendar Print v2.0</h1>
                <table class="dataTable">
                    <tr>
                        <td>test date</td>
                        <td class="text_input"></td>
                    </tr>
                    <tr>
                        <td>name</td>
                        <td class="text_input"></td>
                    </tr>
                    <tr>
                        <td>score</td>
                        <td class="text_input"></td>
                    </tr>
                    <tr>
                        <td>seed</td>
                        <td class="text_input">${toSeedString(seed)}</td>
                    </tr>
                </table>
                <table class="answerTable">
                    ${problems
                        .map((value, index) => {
                            return `
                            <tr>
                                <td class="num">${index + 1}</td>
                                <td class="date">${value.getFullYear()}/${(
                                "0" + value.getMonth()
                            ).slice(-2)}/${("0" + value.getDate()).slice(
                                -2
                            )}</td>
                                <td>Sun</td>
                                <td>Mon</td>
                                <td>Tue</td>
                                <td>Wed</td>
                                <td>Thu</td>
                                <td>Fri</td>
                                <td>Sat</td>
                            </tr>`;
                        })
                        .join("")}
                </table>
                START DATE 1582/10/15<br />
                END DATE 2582/10/15
                ${
                    newPageFlg
                        ? `<h1 class="new_page">SpeedCalendar Print Answer</h1>
                <table class="dataTable">
                    <tr>
                        <td>seed</td>
                        <td class="text_input">${toSeedString(seed)}</td>
                    </tr>
                </table>`
                        : ""
                }
                <table class="trustAnswerTable">
                    <tr>
                        <td>1</td>
                        <td>2</td>
                        <td>3</td>
                        <td>4</td>
                        <td>5</td>
                    </tr>
                    <tr>
                        <td>${dayString(problems[0].getDay())}</td>
                        <td>${dayString(problems[1].getDay())}</td>
                        <td>${dayString(problems[2].getDay())}</td>
                        <td>${dayString(problems[3].getDay())}</td>
                        <td>${dayString(problems[4].getDay())}</td>
                    </tr>
                    <tr>
                        <td>6</td>
                        <td>7</td>
                        <td>8</td>
                        <td>9</td>
                        <td>10</td>
                    </tr>
                    <tr>
                        <td>${dayString(problems[5].getDay())}</td>
                        <td>${dayString(problems[6].getDay())}</td>
                        <td>${dayString(problems[7].getDay())}</td>
                        <td>${dayString(problems[8].getDay())}</td>
                        <td>${dayString(problems[9].getDay())}</td>
                    </tr>
                </table>`;
        }
        (document.getElementById("content") as HTMLElement).innerHTML = html;
    }

    generate();
});
