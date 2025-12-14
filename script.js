<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <title>Ферма</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- НАВІГАЦІЯ -->
<div class="topnav">
    <button class="nav-btn active" data-page="eggs">🥚</button>
    <button class="nav-btn" data-page="feed">🌾</button>
    <button class="nav-btn" data-page="warehouse">📦</button>
    <button id="themeSwitch">🌙</button>
</div>

<!-- ===== ЯЙЦЯ ===== -->
<div id="page-eggs" class="page active-page">
    <h2>🥚 Облік яєць</h2>

    <div class="egg-form">
        <div class="egg-row">
            <label>Дата:</label>
            <input id="eggsDate" type="date">
        </div>

        <div class="egg-row">
            <label>Яєць за добу:</label>
            <input id="eggsGood" type="number">
        </div>

        <div class="egg-row">
            <label>Браковані:</label>
            <input id="eggsBad" type="number">
        </div>

        <div class="egg-row">
            <label>Для дому:</label>
            <input id="eggsHome" type="number">
        </div>

        <button class="egg-save" onclick="saveEggRecord()">Зберегти</button>
        <div id="eggsInfo"></div>
    </div>

    <h3>Щоденний звіт</h3>
    <div id="eggsList"></div>

    <button onclick="clearAllEggs()">🗑️ Видалити весь звіт</button>
</div>

<!-- ===== КАЛЬКУЛЯТОР КОРМУ ===== -->
<div id="page-feed" class="page">
    <h2>🌾 Калькулятор корму</h2>

    <table class="feed-table">
        <thead>
        <tr>
            <th>Компонент</th>
            <th>К-сть</th>
            <th>Ціна</th>
            <th>Сума</th>
        </tr>
        </thead>
        <tbody id="feedTable"></tbody>
    </table>

    <input id="feedVolume" type="number" placeholder="К-сть кг">
    <p>Разом: <span id="feedTotal">0</span></p>
    <p>Ціна/кг: <span id="feedPerKg">0</span></p>
    <p>На обʼєм: <span id="feedVolumeTotal">0</span></p>
</div>

<!-- ===== СКЛАД ===== -->
<div id="page-warehouse" class="page">
    <h2>📦 Склад</h2>

    <table class="feed-table">
        <thead>
        <tr>
            <th>Компонент</th>
            <th>Прихід</th>
            <th>На заміс</th>
            <th>Залишок</th>
        </tr>
        </thead>
        <tbody id="warehouseTable"></tbody>
    </table>

    <p>Готові лотки: <b id="fullTrays">0</b></p>
    <p>Заброньовані: <b id="reservedTrays">0</b></p>
</div>

<script src="script.js"></script>
</body>
</html>