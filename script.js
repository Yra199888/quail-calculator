// === Тема ===
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

// === Навігація ===
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return;
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.getElementById("page-" + page).classList.add("active-page");
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// === Дані складу ===
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

let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) warehouse = { feed:{}, trays:0, ready:0, reserved:0, history:[] };
saveWarehouse();
function saveWarehouse(){ localStorage.setItem("warehouse", JSON.stringify(warehouse)); }

// === Відображення складу ===
function renderWarehouse(){
  let html="";
  feedComponents.forEach(item=>{
    const name=item[0], need=item[1];
    const stock=warehouse.feed[name]||0;
    html += `
    <tr>
      <td>${name}</td>
      <td><input type="number" class="addStock" data-name="${name}" value="0"></td>
      <td>${need}</td>
      <td>${stock.toFixed(2)}</td>
    </tr>`;
  });
  document.getElementById("warehouseTable").innerHTML = html;
  document.querySelectorAll(".addStock").forEach(inp=>{
    inp.addEventListener("change", e=>{
      const n=e.target.dataset.name; const v=+e.target.value;
      if(v>0){ warehouse.feed[n]=(warehouse.feed[n]||0)+v; saveWarehouse(); renderWarehouse(); }
    });
  });
  document.getElementById("trayStock").value = warehouse.trays;
  document.getElementById("fullTrays").textContent = warehouse.ready;
  document.getElementById("reservedTrays").textContent = warehouse.reserved;
  document.getElementById("mixHistory").innerHTML = warehouse.history.map(x=>`<li>${x}</li>`).join("");
}
renderWarehouse();

// === Зробити корм ===
document.getElementById("makeFeedBtn").addEventListener("click", ()=>{
  for(let i of feedComponents){
    const name=i[0], need=i[1];
    if((warehouse.feed[name]||0)<need){ alert(`Недостатньо: ${name}`); return; }
  }
  feedComponents.forEach(i=>warehouse.feed[i[0]]-=i[1]);
  warehouse.history.push("Заміс "+new Date().toLocaleString());
  saveWarehouse(); renderWarehouse();
});
document.getElementById("trayStock").addEventListener("change", e=>{
  warehouse.trays=+e.target.value; saveWarehouse();
});

// === Яйця ===
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");
function saveEggRecord(){
  const d=eggsDate.value||new Date().toISOString().slice(0,10);
  const good=+eggsGood.value||0, bad=+eggsBad.value||0, home=+eggsHome.value||0;
  const com=good-bad-home; const trays=Math.floor(com/20); const left=com%20;
  eggs[d]={good,bad,home,com,trays,left};
  localStorage.setItem("eggs",JSON.stringify(eggs));
  document.getElementById("eggsInfo").innerHTML = com<20 
    ? `Зібрано ${com} яєць, до повного лотка не вистачає ${20-com}.`
    : `Повних лотків: ${trays}, залишок ${left} яєць.`;
  showEggs();
}
function showEggs(){
  let out="";
  Object.keys(eggs).sort().reverse().forEach(d=>{
    const e=eggs[d];
    out+=`<div class="egg-entry"><b>${d}</b> — ${e.good} / ${e.bad} / ${e.home} → ${e.trays} лотків</div>`;
  });
  document.getElementById("eggsList").innerHTML=out;
}
showEggs();

// === Замовлення ===
let orders = JSON.parse(localStorage.getItem("orders") || "{}");
function addOrder(){
  const d=orderDate.value||new Date().toISOString().slice(0,10);
  if(!orders[d]) orders[d]=[];
  orders[d].push({name:orderName.value,trays:+orderTrays.value,details:orderDetails.value,status:"активне"});
  warehouse.reserved += +orderTrays.value;
  saveWarehouse();
  localStorage.setItem("orders",JSON.stringify(orders));
  showOrders();
}
function showOrders(){
  let html="";
  Object.keys(orders).sort().reverse().forEach(d=>{
    html+=`<h3>${d}</h3>`;
    orders[d].forEach((o,i)=>{
      html += `<div>
        <b>${o.name}</b> — ${o.trays} лотків (${o.status})
        <br>${o.details}
        <br><button onclick="setStatus('${d}',${i},'виконано')">✅ Виконано</button>
        <button onclick="setStatus('${d}',${i},'скасовано')">❌ Скасовано</button>
      </div>`;
    });
  });
  document.getElementById("ordersList").innerHTML=html;
}
function setStatus(d,i,s){
  orders[d][i].status=s;
  if(s==="виконано") warehouse.ready -= orders[d][i].trays;
  if(s==="скасовано") warehouse.reserved -= orders[d][i].trays;
  saveWarehouse();
  localStorage.setItem("orders",JSON.stringify(orders));
  showOrders(); renderWarehouse();
}
showOrders();