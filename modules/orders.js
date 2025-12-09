/* ============================================================
   orders.js — FULL ENTERPRISE MODE (M1 Modular Architecture)
   Замовлення + клієнти + взаємодія з яйцями + autosync
   ============================================================ */

/* ------------------------------------------------------------
   1. Додати нове замовлення
------------------------------------------------------------ */
export function addOrder(DATA, autosave, renderAll) {
    const name = document.getElementById("ordName").value.trim();
    const eggs = Number(document.getElementById("ordEggs").value);
    const trays = Number(document.getElementById("ordTrays").value);
    const date = document.getElementById("ordDate").value;
    const note = document.getElementById("ordNote").value.trim();

    if (!name || (!eggs && !trays)) {
        alert("Заповніть ім'я клієнта і кількість.");
        return;
    }

    const order = {
        id: Date.now(),
        name,
        eggs,
        trays,
        date,
        note,
        done: false,
        created: new Date().toISOString()
    };

    DATA.orders.push(order);

    autosave();
    renderAll();
}

/* ------------------------------------------------------------
   2. Позначити замовлення як виконане
------------------------------------------------------------ */
export function completeOrder(DATA, id, autosave, renderAll) {
    const order = DATA.orders.find(o => o.id === id);
    if (order) {
        order.done = true;
        order.completedAt = new Date().toISOString();

        // відняти забрані лотки
        if (order.trays > 0) {
            if (!DATA.eggs) DATA.eggs = {};
            DATA.eggs.available = (DATA.eggs.available || 0) - order.trays * 20;
            if (DATA.eggs.available < 0) DATA.eggs.available = 0;
        }

        autosave();
        renderAll();
    }
}

/* ------------------------------------------------------------
   3. Видалити замовлення
------------------------------------------------------------ */
export function deleteOrder(DATA, id, autosave, renderAll) {
    DATA.orders = DATA.orders.filter(o => o.id !== id);
    autosave();
    renderAll();
}

/* ------------------------------------------------------------
   4. Підрахунок заброньованих лотків
------------------------------------------------------------ */
export function getReservedTrays(DATA) {
    return DATA.orders
        .filter(o => !o.done)
        .reduce((s, o) => s + (o.trays || 0), 0);
}

/* ------------------------------------------------------------
   5. Побудова списку клієнтів
------------------------------------------------------------ */
export function buildClientsReport(DATA) {
    const clients = {};

    DATA.orders.forEach(o => {
        if (!o.done) return;

        if (!clients[o.name]) {
            clients[o.name] = {
                orders: 0,
                trays: 0,
                eggs: 0,
                sum: 0,
                last: null
            };
        }

        clients[o.name].orders++;
        clients[o.name].trays += o.trays || 0;
        clients[o.name].eggs += o.eggs || 0;
        clients[o.name].sum += (o.trays || 0) * (DATA.eggs?.trayPrice || 0);
        clients[o.name].last = o.completedAt;
    });

    return clients;
}

/* ------------------------------------------------------------
   6. Рендеринг активних + виконаних замовлень
------------------------------------------------------------ */
export function renderOrders(DATA, completeOrderFn, deleteOrderFn) {
    const activeBox = document.getElementById("ordersActive");
    const doneBox   = document.getElementById("ordersDone");

    activeBox.innerHTML = "";
    doneBox.innerHTML = "";

    DATA.orders.forEach(o => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${o.name}</td>
            <td>${o.trays || 0} лот.</td>
            <td>${o.eggs || 0} яєць</td>
            <td>${o.date}</td>
            <td>${o.note || ""}</td>
            <td>
                ${!o.done ? `<button data-id="${o.id}" class="complete-btn">✔️</button>` : ""}
                <button data-id="${o.id}" class="delete-btn">🗑</button>
            </td>
        `;

        if (o.done) doneBox.appendChild(row);
        else activeBox.appendChild(row);
    });

    /* --- кнопки виконання --- */
    activeBox.querySelectorAll(".complete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            completeOrderFn(parseInt(btn.dataset.id));
        });
    });

    /* --- кнопки видалення --- */
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            deleteOrderFn(parseInt(btn.dataset.id));
        });
    });
}

/* ------------------------------------------------------------
   7. Рендер клієнтів
------------------------------------------------------------ */
export function renderClients(DATA) {
    const body = document.getElementById("clientsBody");
    body.innerHTML = "";

    const report = buildClientsReport(DATA);

    Object.keys(report).forEach(name => {
        const c = report[name];

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${name}</td>
            <td>${c.orders}</td>
            <td>${c.trays}</td>
            <td>${c.eggs}</td>
            <td>${c.sum.toFixed(2)}</td>
            <td>${c.last ? c.last.substring(0, 10) : "-"}</td>
        `;
        body.appendChild(row);
    });
}

/* ------------------------------------------------------------
   8. Допоміжне
------------------------------------------------------------ */
export function ordersSummary(DATA) {
    return {
        active: DATA.orders.filter(o => !o.done).length,
        done: DATA.orders.filter(o => o.done).length,
        reservedTrays: getReservedTrays(DATA)
    };
}