// ============================
//      ТЕМА
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
    themeSwitch.onclick = () => {
        document.body.classList.toggle("light");
        themeSwitch.textContent =
            document.body.classList.contains("light") ? "☀️" : "🌙";
    };
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
        const page = btn.dataset.page;
        if (!page) return;

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.getElementById("page-" + page)?.classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    };
});

// ============================
//      КОРМ — НЕ ЛАМАЄМО
// ============================
const feedComponents = [
    ["Кукурудза", 10],
    ["Пшениця", 5],
    ["Ячмінь", 1.5],
    ["Соева макуха", 3],
    ["Соняшникова макуха", 2.5],
    ["Рибне борошно", 1],
    ["Дріжджі", 0.7],
    ["Трикальційфосфат", 0.5],
    ["Dolfos D", 0.7],
    ["Сіль", 0.05]
];

function loadFeedTable() {
    const tbody = document.getElementById("feedTable");
    if (!tbody) return;

    tbody.innerHTML = feedComponents.map((c, i) => `
        <tr>
            <td>${c[0]}</td>
            <td><input class="qty" data-i="${i}" type="number" value="${localStorage.getItem("qty_"+i) ?? c[1]}"></td>
            <td><input class="price" data-i="${i}" type="number" value="${localStorage.getItem("price_"+i) ?? 0}"></td>
            <td id="sum_${i}">0</td>
        </tr>
    `).join("");

    document.querySelectorAll(".qty,.price,#feedVolume")
        .forEach(el => el.oninput = calculateFeed);

    calculateFeed();
}

function calculateFeed() {
    let total = 0, totalKg = 0;

    feedComponents.forEach((_, i) => {
        const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
        const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

        localStorage.setItem("qty_"+i, qty);
        localStorage.setItem("price_"+i, price);

        const sum = qty * price;
        total += sum;
        totalKg += qty;

        document.getElementById("sum_"+i).textContent = sum.toFixed(2);
    });

    const perKg = totalKg ? total / totalKg : 0;
    const vol = Number(document.getElementById("feedVolume")?.value) || 0;

    feedTotal.textContent = total.toFixed(2);
    feedPerKg.textContent = perKg.toFixed(2);
    feedVolumeTotal.textContent = (perKg * vol).toFixed(2);
}

loadFeedTable();

// ============================
//      ЯЙЦЯ — ПРАВИЛЬНО
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function recomputeEggs() {
    let carry = 0;

    Object.keys(eggs).sort().forEach(d => {
        const e = eggs[d];
        const commercial = Math.max(e.good - e.bad - e.home, 0);
        const sum = carry + commercial;

        e.sum = sum;
        e.trays = Math.floor(sum / 20);
        e.remainder = sum % 20;

        carry = e.remainder;
    });

    localStorage.setItem("eggs", JSON.stringify(eggs));
}

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0,10);

    eggs[date] = {
        good: Number(eggsGood.value) || 0,
        bad: Number(eggsBad.value) || 0,
        home: Number(eggsHome.value) || 0
    };

    recomputeEggs();
    renderEggs();
}
window.saveEggRecord = saveEggRecord;

function renderEggs() {
    const box = document.getElementById("eggsList");
    if (!box) return;

    box.innerHTML = Object.keys(eggs).sort().reverse().map(d => {
        const e = eggs[d];
        return `
            <div class="egg-entry">
                <b>${d}</b><br>
                Яєць: ${e.good} | Брак: ${e.bad} | Дім: ${e.home}<br>
                Лотки: ${e.trays} | Залишок: ${e.remainder}
            </div>
        `;
    }).join("");
}

function clearAllEggs() {
    if (!confirm("Видалити ВЕСЬ звіт?")) return;
    eggs = {};
    localStorage.removeItem("eggs");
    renderEggs();
}
window.clearAllEggs = clearAllEggs;

renderEggs();