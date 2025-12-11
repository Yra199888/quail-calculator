// =======================================
// Навігація між вкладками
// =======================================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.getAttribute("data-page");
        if (!page) return;

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById("page-" + page).classList.add("active-page");
    });
});

// =======================================
// Темна / світла тема
// =======================================
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "🌞" : "🌙";
});

// =======================================
// ОБЛІК ЯЄЦЬ
// =======================================
function saveEggRecord() {
    const date = document.getElementById("eggsDate").value;
    const eggsGood = parseInt(document.getElementById("eggsGood").value) || 0;
    const eggsBad = parseInt(document.getElementById("eggsBad").value) || 0;
    const eggsHome = parseInt(document.getElementById("eggsHome").value) || 0;

    if (!date) {
        alert("Вкажіть дату!");
        return;
    }

    const total = eggsGood + eggsBad + eggsHome;
    const infoDiv = document.getElementById("eggsInfo");

    let msg = "";
    if (eggsGood < 20) {
        msg = `🥚 Зібрано ${eggsGood} яєць, до повного лотка не вистачає ${20 - eggsGood}.`;
    } else {
        const full = Math.floor(eggsGood / 20);
        const remain = eggsGood % 20;
        msg = `✅ Повних лотків: ${full}, залишок: ${remain} яєць.`;
    }

    infoDiv.innerHTML = `<p style="margin-top:12px;font-size:17px;">${msg}</p>`;

    // Збереження в localStorage
    const records = JSON.parse(localStorage.getItem("eggRecords") || "[]");
    records.push({ date, eggsGood, eggsBad, eggsHome });
    localStorage.setItem("eggRecords", JSON.stringify(records));

    showEggRecords();
}

function showEggRecords() {
    const listDiv = document.getElementById("eggsList");
    const records = JSON.parse(localStorage.getItem("eggRecords") || "[]");

    if (records.length === 0) {
        listDiv.innerHTML = "<p>Порожньо</p>";
        return;
    }

    let html = "<ul>";
    records.slice().reverse().forEach(r => {
        html += `<li><b>${r.date}</b>: ${r.eggsGood} яєць (брак: ${r.eggsBad}, дім: ${r.eggsHome})</li>`;
    });
    html += "</ul>";

    listDiv.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", showEggRecords);

// =======================================
// КАЛЬКУЛЯТОР КОРМУ (спрощена логіка)
// =======================================
const feedComponents = [
    "Кукурудза", "Пшениця", "Ячмінь", "Соєва макуха", "Соняшникова макуха",
    "Рибне борошно", "Дріжджі", "Трикальційфосфат", "Dolfos D", "Сіль"
];

const feedTable = document.getElementById("feedTable");
if (feedTable) {
    feedComponents.forEach(name => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td><input type="number" class="qty" value="0"></td>
            <td><input type="number" class="price" value="0"></td>
            <td class="sum">0.00</td>
        `;
        feedTable.appendChild(row);
    });
}

function updateFeedCalc() {
    let total = 0;
    document.querySelectorAll("#feedTable tr").forEach(row => {
        const qty = parseFloat(row.querySelector(".qty").value) || 0;
        const price = parseFloat(row.querySelector(".price").value) || 0;
        const sum = qty * price;
        row.querySelector(".sum").textContent = sum.toFixed(2);
        total += sum;
    });

    const volume = parseFloat(document.getElementById("feedVolume").value) || 1;
    document.getElementById("feedTotal").textContent = total.toFixed(2);
    document.getElementById("feedPerKg").textContent = (total / volume).toFixed(2);
    document.getElementById("feedVolumeTotal").textContent = total.toFixed(2);
}

document.addEventListener("input", e => {
    if (e.target.classList.contains("qty") || e.target.classList.contains("price") || e.target.id === "feedVolume") {
        updateFeedCalc();
    }
});

// =======================================
// СКЛАД (тільки візуальна частина)
// =======================================
const warehouseComponents = [
    "Кукурудза", "Пшениця", "Ячмінь", "Соєва макуха", "Соняшникова макуха",
    "Рибне борошно", "Дріжджі", "Трикальційфосфат", "Dolfos D", "Сіль"
];

const warehouseTable = document.getElementById("warehouseTable");
if (warehouseTable) {
    warehouseComponents.forEach(name => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td><input type="number" class="arrival" value="0"></td>
            <td><input type="number" class="use" value="0"></td>
            <td class="left">0.00</td>
        `;
        warehouseTable.appendChild(row);
    });
}