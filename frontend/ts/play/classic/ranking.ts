function ordinal(n: number) {
    var result;
    var s1 = +("" + n).slice(-1);
    var s2 = +("" + n).slice(-2);
    if (s2 >= 11 && s2 <= 13) {
        result = n + "th";
    } else if (s1 === 1) {
        result = n + "st";
    } else if (s1 === 2) {
        result = n + "nd";
    } else if (s1 === 3) {
        result = n + "rd";
    } else {
        result = n + "th";
    }
    return result;
}

function time_to_string(ms: number): string {
    return `${("00" + Math.floor(ms / (60 * 1000))).slice(-2)}:${("00" + (Math.floor(ms / 1000) % 60)).slice(-2)}.${("000" + (ms % 1000)).slice(-3)}`;
}

window.addEventListener("load", () => {
    const tbody = document.getElementById("data") as HTMLTableElement;
    const typeSelect = document.getElementById("typeSelect") as HTMLSelectElement;
    typeSelect.addEventListener("change", () => {
        page = 0;
        last = false;
        mode = Number(typeSelect.value);
        tbody.innerHTML = "";
    });

    async function loadData(mode: number, page: number) {
        const value = await (await fetch(`/play/games/classic/ranking/api?mode=${mode}&page=${page}`)).json();
        for (let i in value) {
            let element = document.createElement("tr");
            element.innerHTML = `<td>${ordinal(page * 50 + Number(i) + 1)}</td>`;
            element.innerHTML += `<td>${value[i].username}</td>`;
            element.innerHTML += `<td>${time_to_string(value[i].scoreTime)}</td>`;
            element.innerHTML += `<td>${new Date(value[i].scoreDate).toLocaleString()}</td>`;
            element.innerHTML += `<td>${value[i].comment}</td>`;
            tbody.appendChild(element);
        }
        if (value.length < 50) {
            last = true;
        }
    }

    let page = 0;
    let last = false;
    let mode = 0;

    async function tick() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );

        if (scrollTop >= scrollHeight - window.innerHeight && !last) {
            await loadData(mode, page);
            ++page;
            requestAnimationFrame(tick);
        } else {
            requestAnimationFrame(tick);
        }
    }
    tick();
});
