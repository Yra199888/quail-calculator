/* ============================================================
   MODULE: logs.js
   Щоденник витрат (Section 4)
   - Додавання записів
   - Видалення записів
   - Збереження у DATA.logs
   - Рендер таблиці
   - Автоматичний перерахунок фінансів
============================================================ */

/* ------------------------------------------------------------
   1. Додати запис у щоденник
------------------------------------------------------------ */

function addLog() {
    const date = document.getElementById("logDate").value;
    const category = document.getElementById("logCategory").value.trim();
    const amount = Number(document.getElementById("logAmount").value);
    const comment = document.getElementById("logComment").value.trim();

    if (!date || !category || !amount) {
        alert("Заповніть дату, категорію та суму");
        return;
    }

    const entry = {
        id: Date.now(),
        date,
        category,
        amount,
        comment
    };

    DATA.logs = DATA.logs || [];
    DATA.logs.push(entry);

    autosave();
    renderLogs();
    if (typeof financeAutoUpdate === "function") financeAutoUpdate();
}

/* ------------------------------------------------------------
   2. Видалити запис
------------------------------------------------------------ */

function deleteLog(id) {
    DATA.logs = DATA.logs.filter(l => l.id !== id);
    autosave();
    renderLogs();
    if (typeof financeAutoUpdate === "function") financeAutoUpdate();
}

/* ------------------------------------------------------------
   3. Рендер таблиці витрат
------------------------------------------------------------ */

function renderLogs() {
    const body = document.getElementById("logBody");
    if (!body) return;

    const list = DATA.logs || [];
    let html = "";

    for (let l of list) {
        html += `
            <tr>
                <td>${l.date}</td>
                <td>${l.category}</td>
                <td>${l.amount.toFixed(2)}</td>
                <td>${l.comment || ""}</td>
                <td>
                    <button onclick="deleteLog(${l.id})"
                        style="background:#b30000; color:white; padding:6px 10px; border-radius:6px;">
                        ✖
                    </button>
                </td>
            </tr>
        `;
    }

    body.innerHTML = html;
}

/* ------------------------------------------------------------
   4. Автоматичний перерахунок фінансів
   (викликається після змін у витратах)
------------------------------------------------------------ */

function logsAutoUpdate() {
    renderLogs();
    if (typeof financeAutoUpdate === "function") financeAutoUpdate();
    autosave();
}