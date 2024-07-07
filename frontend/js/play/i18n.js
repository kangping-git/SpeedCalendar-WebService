"use strict";
["일욜", "월욜", "화욜", "수욜", "목욜", "금욜", "토욜"];
const i18nData = {
    Sun: ["SUN", "日", "Dim", "So", "Do", "Do", "So", "周日", "일욜"],
    Mon: ["MON", "月", "Lun", "Mo", "Lu", "Lu", "Lu", "周一", "월욜"],
    Tue: ["TUE", "火", "Mar", "Di", "Ma", "Ma", "Ma", "周二", "화욜"],
    Wed: ["WED", "水", "Mer", "Mi", "Mi", "Me", "Me", "周三", "수욜"],
    Thu: ["THU", "木", "Jeu", "Do", "Ju", "Gi", "Jo", "周四", "목욜"],
    Fri: ["FRI", "金", "Ven", "Fr", "Vi", "Ve", "Ve", "周五", "금욜"],
    Sat: ["SAT", "土", "Sam", "Sa", "Sa", "Sa", "Sa", "周六", "토욜"],
    Correct: [
        "CORRECT!",
        "正解!",
        "Correct!",
        "Richtig!",
        "Correcta!",
        "Accuratus!",
        "Accuratus!",
        "正确!",
        "정답!",
    ],
};
const languages = [
    "en",
    "ja",
    "fr",
    "de",
    "es",
    "it",
    "la",
    "zh",
    "ko",
];
function get_i18n_data(lang, text) {
    return i18nData[text][languages.indexOf(lang)];
}
