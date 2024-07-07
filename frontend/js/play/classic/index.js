"use strict";
String.prototype.bytes = function () {
    return encodeURIComponent(this.toString()).replace(/%../g, "x").length;
};
document.addEventListener("DOMContentLoaded", () => {
    window.submit_twitter = () => {
        window.key_down(9);
        window.open("https://twitter.com/intent/tweet?text=" +
            "My latest SpeedCalendar record is: " +
            time_to_string(time) +
            " (" +
            document.getElementById("weeksta").value ===
            "startmon"
            ? "Week start on Monday"
            : "Week start on Sunday" +
                ")  " +
                document.getElementById("name_id").value +
                " " +
                document.getElementById("icon_telephone").value +
                " https://speed-calendar.com " +
                "&hashtags=SpeedCalendar");
    };
    window.submit_result = () => {
        if (document.getElementById("icon_telephone").value.bytes() < 200) {
            fetch("/play/games/classic/submit", {
                method: "POST",
                body: JSON.stringify({
                    type: ["long", "mid", "short", "longlong", "era", "era2"].indexOf(document.getElementById("targetmode").value),
                    time: time,
                    score: score,
                    comment: document.getElementById("icon_telephone").value,
                }),
            });
            window.key_down(9);
        }
        else {
            alert("コメントが長すぎます。");
        }
    };
    let html = "";
    let start_bool = false;
    let start_time = new Date();
    let fps = 0;
    let fps_time = new Date();
    let mon = 0;
    let mondai;
    const keys = [0, 1, 2, 3, 4, 5, 6];
    let time = 0;
    let correct = "CORRECT!";
    let yobis = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    let yobis2;
    updateDayString();
    function time_to_string(ms) {
        return `${("00" + Math.floor(ms / (60 * 1000))).slice(-2)}:${("00" + (Math.floor(ms / 1000) % 60)).slice(-2)}.${("000" + (ms % 1000)).slice(-3)}`;
    }
    function date_to_string(ms) {
        if (document.getElementById("targetmode").value === "era" ||
            document.getElementById("targetmode").value === "era2") {
            return new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }).format(ms);
        }
        else {
            return `${("0000" + ms.getFullYear()).slice(-4)}/${("00" + (ms.getMonth() + 1)).slice(-2)}/${("00" + ms.getDate()).slice(-2)}`;
        }
    }
    tick();
    function new_question() {
        ++mon;
        if (mon === 6) {
            start_bool = null;
            time = new Date().getTime() - start_time.getTime();
            if (score !== 5) {
                document.getElementById("timer").innerHTML =
                    "fail <span style='font-size: 20px;'>" + time_to_string(new Date().getTime() - start_time.getTime()) + "</span>";
            }
            return;
        }
        const targetMode = document.getElementById("targetmode").value;
        const now = new Date();
        let mondai1 = targetMode === "long"
            ? new Date(2582, 9, 15)
            : targetMode === "short"
                ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
                : targetMode === "mid"
                    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    : targetMode === "longlong"
                        ? new Date(9999, 11, 31)
                        : new Date(2049, 4, 1);
        let mondai2 = targetMode === "long"
            ? new Date(1582, 9, 15)
            : targetMode === "short"
                ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                : targetMode === "mid"
                    ? new Date(now.getFullYear() - 60, now.getMonth(), now.getDate())
                    : targetMode === "era"
                        ? new Date(1868, 0, 25)
                        : targetMode === "longlong"
                            ? new Date(1582, 9, 15)
                            : new Date(645, 6, 29);
        mondai = new Date((mondai1.getTime() - mondai2.getTime()) * Math.random() + mondai2.getTime());
        html = `<a class='Q_1'>${date_to_string(mondai)}</a><a id="answer-${mon}" class='Q_2'></a><a id="answer-${mon}-2" class='Q_3'></a><br>`;
        document.getElementById("Q").innerHTML += html;
    }
    function tick() {
        requestAnimationFrame(tick);
        if (start_bool === true) {
            document.getElementById("timer").innerText = time_to_string(new Date().getTime() - start_time.getTime());
            document.getElementById("hit-any-key").style.display = "none";
            document.getElementById("ggl_place").style.display = "none";
            document.getElementById("links").style.display = "none";
            if (document.getElementById("displaymode").value === "concentration") {
                document.getElementById("timer").style.color = "rgba(0,0,0,0)";
            }
        }
        else if (start_bool === false) {
            document.getElementById("timer").innerText = "00:00.000";
            document.getElementById("hit-any-key").style.display = "block";
            document.getElementById("ggl_place").style.display = "none";
            document.getElementById("tw_place").style.display = "none";
            document.getElementById("next_place").style.display = "none";
            document.getElementById("links").style.display = "none";
            document.getElementById("timer").style.color = "rgb(0,0,0)";
        }
        else if (start_bool === null) {
            document.getElementById("links").style.display = "";
            if (score === 5) {
                document.getElementById("ggl_place").style.display = "";
                document.getElementById("tw_place").style.display = "";
            }
            document.getElementById("next_place").style.display = "";
            document.getElementById("timer").style.color = "rgb(0,0,0)";
        }
        fps += 1;
        if (new Date().getTime() - fps_time.getTime() >= 1000) {
            fps_time = new Date();
            fps = 0;
        }
    }
    let score = 0;
    window.key_down = (key) => {
        if (start_bool === true) {
            if (keys.includes(key)) {
                document.getElementById("answer-" + mon).innerText = yobis[key];
                if (document.getElementById("weeksta").value === "startsun") {
                    key = (key - 1 + 7) % 7;
                }
                if (key === mondai.getDay()) {
                    document.getElementById("answer-" + mon + "-2").innerText = correct;
                    document.getElementById("answer-" + mon + "-2").style.color = "blue";
                    ++score;
                }
                else {
                    document.getElementById("answer-" + mon + "-2").innerText = yobis2[mondai.getDay()];
                    document.getElementById("answer-" + mon + "-2").style.color = "red";
                }
                new_question();
            }
        }
        else if (start_bool === null) {
            if (key === 9) {
                start_bool = false;
                document.getElementById("Q").innerHTML = "";
            }
        }
        else {
            start_bool = true;
            mon = 0;
            score = 0;
            new_question();
            start_time = new Date();
            updateDayString();
        }
    };
    window.addEventListener("keydown", (e) => {
        if (e.target.tagName != "BODY") {
            return;
        }
        window.key_down(Number(e.key));
    });
    function updateDayString() {
        const targetLang = document.getElementById("targetLang").value;
        if (targetLang == "en") {
            correct = "CORRECT!";
            yobis = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        }
        else if (targetLang == "jp") {
            correct = "正解!";
            yobis = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
        }
        else if (targetLang == "cn") {
            correct = "正确!";
            yobis = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
        }
        else if (targetLang == "kr") {
            correct = "정답!";
            yobis = ["일욜", "월욜", "화욜", "수욜", "목욜", "금욜", "토욜"];
        }
        else if (targetLang == "sp") {
            correct = "Correcta!";
            yobis = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
        }
        else if (targetLang == "la") {
            correct = "Accuratus!";
            yobis = ["So", "Lu", "Ma", "Me", "Jo", "Ve", "Sa"];
        }
        else if (targetLang == "it") {
            correct = "Accuratus!";
            yobis = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
        }
        else {
            correct = "Richtig!";
            yobis = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
        }
        yobis2 = Array.from(yobis);
        if (document.getElementById("weeksta").value == "startsun") {
            yobis.unshift(yobis[6]);
            yobis.pop();
        }
        document.getElementById("button-0").innerText = yobis[0];
        document.getElementById("button-1").innerText = yobis[1];
        document.getElementById("button-2").innerText = yobis[2];
        document.getElementById("button-3").innerText = yobis[3];
        document.getElementById("button-4").innerText = yobis[4];
        document.getElementById("button-5").innerText = yobis[5];
        document.getElementById("button-6").innerText = yobis[6];
        yobis2 = yobis.map((y) => `${y}`);
    }
});
