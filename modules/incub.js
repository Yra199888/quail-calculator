/* ============================================================
   MODULE: incub.js
   Відповідає за:
   - Облік інкубаційних партій
   - Підрахунок днів
   - Статуси (active, done, candling, hatch)
   - Овоскопія / вилуплення / втрати
   - Рендер таблиці
============================================================ */

/* ------------------------------------------------------------
   1. ДОДАТИ НОВУ ПАРТІЮ
------------------------------------------------------------ */

function incubAdd() {
    const name = document.getElementById("incBatchName").value.trim();
    const start = document.getElementById("incStartDate").value;
    const eggs = Number(document.getElementById("incEggsSet").value);
    const note = document.getElementById("incNote").value.trim();

    if (!name || !start || eggs <= 0) {
        return alert("Заповніть всі поля");
    }

    DATA.incub.push({
        id: Date.now(),
        name,
        start,
        eggs,
        infertile: 0,
        hatched: 0,
        diedInc: 0,
        diedBrooder: 0,
        note,
    });

    autosave();
    renderInc();
}


/* ------------------------------------------------------------
   2. ПІДРАХУНОК ДНІВ
------------------------------------------------------------ */

function incubDaysBetween(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();

    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}


/* ------------------------------------------------------------
   3. ВИЗНАЧЕННЯ СТАТУСУ ПАРТІЇ
------------------------------------------------------------ */

function incubStatus(batch) {
    const d = incubDaysBetween(batch.start);

    if (d < 7) return "active";
    if (d >= 7 && d < 14) return "candling";
    if (d >= 14 && d < 17) return "hatch";
    if (d >= 17) return "done";

    return "active";
}


/* ------------------------------------------------------------
   4. ФІЛЬТР ПАРТІЙ
------------------------------------------------------------ */

function incubFilterList() {
    const f = document.getElementById("incFilter").value;
    const list = DATA.incub || [];

    return list.filter(batch => {
        const st = incubStatus(batch);
        if (f === "all") return true;
        return f === st;
    });
}


/* ------------------------------------------------------------
   5. ОНОВЛЕННЯ ЗАПИСІВ (овоскопія, вилуплення, втрати)
------------------------------------------------------------ */

function incubUpdateField(id, field, value) {
    const batch = DATA.incub.find(b => b.id === id);
    if (!batch) return;

    batch[field] = Number(value);
    autosave();
    renderInc();
}


/* ------------------------------------------------------------
   6. ВИДАЛЕННЯ ПАРТІЇ (за бажанням)
------------------------------------------------------------ */

function incubDelete(id) {
    if (!confirm("Видалити партію?")) return;

    DATA.incub = DATA.incub.filter(x => x.id !== id);
    autosave();
    renderInc();
}


/* ------------------------------------------------------------
   7. РЕНДЕР ТАБЛИЦІ
------------------------------------------------------------ */

function renderInc() {
    const body = document.getElementById("incubationBody");
    if (!body) return;

    const list = incubFilterList();

    let html = "";

    for (let b of list) {
        const days = incubDaysBetween(b.start);
        const status = incubStatus(b);

        const alive =
            b.eggs - b.infertile - b.diedInc - b.diedBrooder - (b.hatched || 0);

        html += `
        <tr>
            <td>${b.name}</td>
            <td>${b.start}</td>
            <td>${days}</td>
            <td>${b.eggs}</td>

            <td>
                <input type="number" value="${b.infertile}" min="0"
                    onchange="incubUpdateField(${b.id}, 'infertile', this.value)">
            </td>

            <td>
                <input type="number" value="${b.hatched}" min="0"
                    onchange="incubUpdateField(${b.id}, 'hatched', this.value)">
            </td>

            <td>
                <input type="number" value="${b.diedInc}" min="0"
                    onchange="incubUpdateField(${b.id}, 'diedInc', this.value)">
            </td>

            <td>
                <input type="number" value="${b.diedBrooder}" min="0"
                    onchange="incubUpdateField(${b.id}, 'diedBrooder', this.value)">
            </td>

            <td>${alive < 0 ? 0 : alive}</td>

            <td>${status}</td>

            <td>${b.note || ""}</td>

            <td>
                <button onclick="incubDelete(${b.id})">🗑</button>
            </td>
        </tr>
        `;
    }

    body.innerHTML = html;
}


/* ------------------------------------------------------------
   8. ІНІЦІАЛІЗАЦІЯ
      (викликається з app.js → renderAll())
------------------------------------------------------------ */

function incubInit() {
    const btn = document.getElementById("addIncubation");
    if (btn) btn.onclick = incubAdd;
}