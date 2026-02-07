<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Поиск маршрута (GraphOnline)</title>
    <style>
        body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #f4f4f9; }
        h1 { color: #333; }
        .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        label { display: block; margin-top: 1rem; font-weight: bold; }
        input { width: 100%; padding: 0.5rem; margin-top: 0.5rem; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
        button { margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #218838; }
        #result { margin-top: 1.5rem; padding: 1rem; background: #e9ecef; border-radius: 4px; min-height: 50px; white-space: pre-wrap; }
        .error { color: red; }
        .success { color: green; font-weight: bold; }
    </style>
</head>
<body>

<div class="card">
    <h1>🗺️ Поиск маршрута</h1>
    <p>Введите номера вершин, как они указаны на графе.</p>

    <label for="startNode">Начальная точка:</label>
    <input type="text" id="startNode" placeholder="Например: 1">

    <label for="endNode">Конечная точка:</label>
    <input type="text" id="endNode" placeholder="Например: 55">

    <button onclick="findShortestPath()">Найти путь</button>

    <div id="result">Результат отобразится здесь...</div>
</div>

<script>
    // === ДАННЫЕ ГРАФА (ВСТАВЛЕНЫ ИЗ ТВОЕГО ФАЙЛА) ===
    const rawGraphXML = `<?xml version="1.0" encoding="UTF-8"?><graphml><graph id="Graph" uidGraph="100" uidEdge="11378">
    <node id="0" mainText="1" /><node id="1" mainText="2" /><node id="2" mainText="46" /><node id="3" mainText="43" /><node id="4" mainText="62" /><node id="5" mainText="5" /><node id="6" mainText="22" /><node id="7" mainText="3" /><node id="8" mainText="6" /><node id="9" mainText="34" /><node id="10" mainText="37" /><node id="11" mainText="38" /><node id="12" mainText="15" /><node id="13" mainText="55" /><node id="14" mainText="4" /><node id="15" mainText="36" /><node id="16" mainText="90" /><node id="17" mainText="52" /><node id="18" mainText="75" /><node id="19" mainText="23" /><node id="20" mainText="7" /><node id="21" mainText="99" /><node id="22" mainText="84" /><node id="23" mainText="65" /><node id="24" mainText="41" /><node id="25" mainText="49" /><node id="26" mainText="8" /><node id="27" mainText="83" /><node id="28" mainText="9" /><node id="29" mainText="25" /><node id="30" mainText="70" /><node id="31" mainText="26" /><node id="32" mainText="58" /><node id="33" mainText="28" /><node id="34" mainText="74" /><node id="35" mainText="59" /><node id="36" mainText="10" /><node id="37" mainText="66" /><node id="38" mainText="85" /><node id="39" mainText="11" /><node id="40" mainText="98" /><node id="41" mainText="54" /><node id="42" mainText="14" /><node id="43" mainText="12" /><node id="44" mainText="40" /><node id="45" mainText="27" /><node id="46" mainText="13" /><node id="47" mainText="35" /><node id="48" mainText="86" /><node id="49" mainText="30" /><node id="50" mainText="16" /><node id="51" mainText="72" /><node id="52" mainText="53" /><node id="53" mainText="76" /><node id="54" mainText="24" /><node id="55" mainText="17" /><node id="56" mainText="20" /><node id="57" mainText="18" /><node id="58" mainText="19" /><node id="59" mainText="29" /><node id="60" mainText="79" /><node id="61" mainText="68" /><node id="62" mainText="97" /><node id="63" mainText="21" /><node id="64" mainText="91" /><node id="65" mainText="63" /><node id="66" mainText="94" /><node id="67" mainText="78" /><node id="68" mainText="95" /><node id="69" mainText="56" /><node id="70" mainText="33" /><node id="71" mainText="93" /><node id="72" mainText="69" /><node id="73" mainText="32" /><node id="74" mainText="39" /><node id="75" mainText="50" /><node id="76" mainText="31" /><node id="77" mainText="67" /><node id="78" mainText="89" /><node id="79" mainText="77" /><node id="80" mainText="48" /><node id="81" mainText="47" /><node id="82" mainText="80" /><node id="83" mainText="45" /><node id="84" mainText="61" /><node id="85" mainText="42" /><node id="86" mainText="87" /><node id="87" mainText="57" /><node id="88" mainText="44" /><node id="89" mainText="82" /><node id="90" mainText="71" /><node id="91" mainText="73" /><node id="92" mainText="60" /><node id="93" mainText="51" /><node id="94" mainText="92" /><node id="95" mainText="100" /><node id="96" mainText="81" /><node id="97" mainText="88" /><node id="98" mainText="64" /><node id="99" mainText="96" />
    <edge source="0" target="1" /><edge source="0" target="2" /><edge source="0" target="3" /><edge source="0" target="4" /><edge source="1" target="5" /><edge source="1" target="6" /><edge source="7" target="8" /><edge source="7" target="9" /><edge source="7" target="10" /><edge source="7" target="11" /><edge source="7" target="12" /><edge source="7" target="13" /><edge source="14" target="7" /><edge source="14" target="15" /><edge source="14" target="16" /><edge source="5" target="14" /><edge source="5" target="3" /><edge source="5" target="17" /><edge source="5" target="18" /><edge source="5" target="16" /><edge source="5" target="19" /><edge source="8" target="0" /><edge source="8" target="20" /><edge source="8" target="21" /><edge source="8" target="22" /><edge source="8" target="23" /><edge source="8" target="24" /><edge source="20" target="25" /><edge source="20" target="26" /><edge source="20" target="27" /><edge source="20" target="13" /><edge source="26" target="28" /><edge source="26" target="29" /><edge source="26" target="12" /><edge source="26" target="30" /><edge source="26" target="25" /><edge source="26" target="23" /><edge source="28" target="31" /><edge source="28" target="32" /><edge source="28" target="33" /><edge source="28" target="7" /><edge source="28" target="34" /><edge source="28" target="35" /><edge source="28" target="36" /><edge source="28" target="37" /><edge source="28" target="38" /><edge source="36" target="39" /><edge source="36" target="40" /><edge source="36" target="41" /><edge source="39" target="42" /><edge source="39" target="43" /><edge source="39" target="44" /><edge source="43" target="12" /><edge source="43" target="45" /><edge source="43" target="28" /><edge source="46" target="12" /><edge source="46" target="44" /><edge source="46" target="30" /><edge source="46" target="47" /><edge source="42" target="12" /><edge source="42" target="48" /><edge source="42" target="14" /><edge source="42" target="49" /><edge source="12" target="50" /><edge source="12" target="18" /><edge source="12" target="51" /><edge source="12" target="52" /><edge source="12" target="20" /><edge source="12" target="5" /><edge source="50" target="53" /><edge source="50" target="9" /><edge source="50" target="54" /><edge source="50" target="27" /><edge source="50" target="45" /><edge source="50" target="20" /><edge source="50" target="55" /><edge source="55" target="56" /><edge source="55" target="57" /><edge source="57" target="58" /><edge source="57" target="59" /><edge source="58" target="15" /><edge source="58" target="60" /><edge source="58" target="61" /><edge source="58" target="29" /><edge source="58" target="56" /><edge source="58" target="22" /><edge source="58" target="62" /><edge source="56" target="63" /><edge source="56" target="12" /><edge source="56" target="48" /><edge source="56" target="64" /><edge source="63" target="44" /><edge source="63" target="6" /><edge source="63" target="65" /><edge source="63" target="3" /><edge source="63" target="50" /><edge source="6" target="29" /><edge source="6" target="56" /><edge source="6" target="58" /><edge source="6" target="66" /><edge source="6" target="63" /><edge source="6" target="50" /><edge source="19" target="67" /><edge source="19" target="68" /><edge source="19" target="43" /><edge source="19" target="40" /><edge source="54" target="1" /><edge source="54" target="42" /><edge source="54" target="69" /><edge source="54" target="48" /><edge source="54" target="70" /><edge source="54" target="71" /><edge source="54" target="72" /><edge source="29" target="31" /><edge source="29" target="12" /><edge source="31" target="57" /><edge source="31" target="2" /><edge source="31" target="69" /><edge source="45" target="73" /><edge source="45" target="74" /><edge source="45" target="5" /><edge source="45" target="71" /><edge source="45" target="73" /><edge source="45" target="75" /><edge source="33" target="45" /><edge source="33" target="24" /><edge source="59" target="33" /><edge source="59" target="23" /><edge source="59" target="29" /><edge source="59" target="44" /><edge source="49" target="76" /><edge source="49" target="77" /><edge source="49" target="56" /><edge source="49" target="16" /><edge source="49" target="35" /><edge source="49" target="78" /><edge source="49" target="43" /><edge source="76" target="21" /><edge source="76" target="79" /><edge source="76" target="80" /><edge source="76" target="68" /><edge source="76" target="30" /><edge source="76" target="70" /><edge source="73" target="36" /><edge source="73" target="42" /><edge source="70" target="7" /><edge source="70" target="32" /><edge source="70" target="4" /><edge source="70" target="22" /><edge source="70" target="81" /><edge source="70" target="40" /><edge source="70" target="81" /><edge source="9" target="82" /><edge source="9" target="14" /><edge source="9" target="50" /><edge source="9" target="83" /><edge source="9" target="84" /><edge source="9" target="71" /><edge source="47" target="50" /><edge source="47" target="85" /><edge source="15" target="7" /><edge source="15" target="70" /><edge source="10" target="58" /><edge source="10" target="37" /><edge source="10" target="0" /><edge source="10" target="42" /><edge source="10" target="72" /><edge source="10" target="15" /><edge source="11" target="86" /><edge source="11" target="13" /><edge source="11" target="74" /><edge source="74" target="39" /><edge source="74" target="87" /><edge source="74" target="41" /><edge source="44" target="80" /><edge source="44" target="33" /><edge source="44" target="19" /><edge source="44" target="26" /><edge source="44" target="39" /><edge source="24" target="85" /><edge source="24" target="23" /><edge source="85" target="1" /><edge source="85" target="78" /><edge source="3" target="9" /><edge source="3" target="7" /><edge source="3" target="28" /><edge source="3" target="80" /><edge source="3" target="28" /><edge source="88" target="31" /><edge source="88" target="32" /><edge source="88" target="33" /><edge source="88" target="7" /><edge source="88" target="34" /><edge source="83" target="0" /><edge source="83" target="3" /><edge source="83" target="89" /><edge source="83" target="90" /><edge source="83" target="51" /><edge source="83" target="24" /><edge source="83" target="5" /><edge source="2" target="58" /><edge source="2" target="51" /><edge source="2" target="74" /><edge source="2" target="10" /><edge source="2" target="61" /><edge source="81" target="80" /><edge source="81" target="8" /><edge source="81" target="85" /><edge source="80" target="25" /><edge source="80" target="84" /><edge source="80" target="29" /><edge source="80" target="7" /><edge source="25" target="45" /><edge source="25" target="87" /><edge source="25" target="73" /><edge source="25" target="43" /><edge source="25" target="69" /><edge source="25" target="17" /><edge source="75" target="91" /><edge source="75" target="92" /><edge source="93" target="71" /><edge source="93" target="79" /><edge source="93" target="46" /><edge source="93" target="11" /><edge source="93" target="34" /><edge source="93" target="18" /><edge source="17" target="26" /><edge source="17" target="21" /><edge source="52" target="41" /><edge source="52" target="71" /><edge source="52" target="94" /><edge source="52" target="61" /><edge source="41" target="13" /><edge source="41" target="86" /><edge source="13" target="61" /><edge source="13" target="95" /><edge source="13" target="14" /><edge source="13" target="4" /><edge source="13" target="38" /><edge source="13" target="33" /><edge source="13" target="66" /><edge source="69" target="67" /><edge source="69" target="44" /><edge source="69" target="79" /><edge source="69" target="96" /><edge source="69" target="97" /><edge source="69" target="53" /><edge source="87" target="98" /><edge source="87" target="11" /><edge source="87" target="83" /><edge source="87" target="46" /><edge source="87" target="36" /><edge source="87" target="7" /><edge source="87" target="0" /><edge source="32" target="85" /><edge source="32" target="23" /><edge source="32" target="31" /><edge source="32" target="52" /><edge source="32" target="2" /><edge source="32" target="80" /><edge source="32" target="5" /><edge source="32" target="45" /><edge source="35" target="92" /><edge source="35" target="77" /><edge source="35" target="38" /><edge source="92" target="11" /><edge source="92" target="80" /><edge source="92" target="90" /><edge source="92" target="57" /><edge source="92" target="32" /><edge source="84" target="52" /><edge source="84" target="57" /><edge source="84" target="71" /><edge source="84" target="8" /><edge source="84" target="4" /><edge source="84" target="8" /><edge source="84" target="91" /><edge source="4" target="65" /><edge source="4" target="21" /><edge source="4" target="34" /><edge source="65" target="0" /><edge source="65" target="87" /><edge source="65" target="70" /><edge source="65" target="97" /><edge source="98" target="20" /><edge source="98" target="97" /><edge source="98" target="59" /><edge source="23" target="37" /><edge source="23" target="75" /><edge source="23" target="82" /><edge source="23" target="79" /><edge source="37" target="60" /><edge source="37" target="29" /><edge source="37" target="35" /><edge source="37" target="35" /><edge source="37" target="87" /><edge source="37" target="82" /><edge source="37" target="26" /><edge source="77" target="61" /><edge source="77" target="52" /><edge source="77" target="83" /><edge source="77" target="75" /><edge source="77" target="62" /><edge source="61" target="24" /><edge source="61" target="9" /><edge source="61" target="11" /><edge source="61" target="72" /><edge source="72" target="43" /><edge source="72" target="18" /><edge source="72" target="96" /><edge source="72" target="17" /><edge source="72" target="65" /><edge source="72" target="58" /><edge source="30" target="54" /><edge source="30" target="85" /><edge source="30" target="1" /><edge source="30" target="92" /><edge source="30" target="37" /><edge source="90" target="75" /><edge source="90" target="49" /><edge source="90" target="92" /><edge source="90" target="15" /><edge source="51" target="91" /><edge source="51" target="93" /><edge source="91" target="30" /><edge source="91" target="31" /><edge source="91" target="66" /><edge source="91" target="58" /><edge source="91" target="62" /><edge source="34" target="19" /><edge source="34" target="76" /><edge source="18" target="27" /><edge source="18" target="47" /><edge source="18" target="86" /><edge source="18" target="87" /><edge source="53" target="60" /><edge source="53" target="99" /><edge source="53" target="1" /><edge source="53" target="19" /><edge source="53" target="80" /><edge source="53" target="13" /><edge source="79" target="91" /><edge source="79" target="85" /><edge source="79" target="51" /><edge source="79" target="37" /><edge source="67" target="60" /><edge source="67" target="52" /><edge source="67" target="88" /><edge source="67" target="64" /><edge source="60" target="72" /><edge source="60" target="27" /><edge source="60" target="54" /><edge source="60" target="86" /><edge source="60" target="92" /><edge source="60" target="7" /><edge source="60" target="1" /><edge source="82" target="96" /><edge source="82" target="50" /><edge source="96" target="83" /><edge source="96" target="94" /><edge source="96" target="9" /><edge source="96" target="57" /><edge source="96" target="31" /><edge source="96" target="57" /><edge source="96" target="73" /><edge source="89" target="82" /><edge source="89" target="60" /><edge source="89" target="1" /><edge source="89" target="79" /><edge source="27" target="8" /><edge source="27" target="80" /><edge source="27" target="91" /><edge source="27" target="71" /><edge source="27" target="63" /><edge source="22" target="31" /><edge source="22" target="29" /><edge source="22" target="56" /><edge source="22" target="74" /><edge source="22" target="56" /><edge source="22" target="33" /><edge source="38" target="41" /><edge source="38" target="7" /><edge source="38" target="29" /><edge source="38" target="94" /><edge source="48" target="41" /><edge source="48" target="8" /><edge source="48" target="37" /><edge source="86" target="84" /><edge source="86" target="82" /><edge source="86" target="97" /><edge source="86" target="20" /><edge source="86" target="87" /><edge source="97" target="53" /><edge source="97" target="19" /><edge source="97" target="68" /><edge source="97" target="16" /><edge source="97" target="53" /><edge source="97" target="86" /><edge source="97" target="99" /><edge source="78" target="34" /><edge source="78" target="29" /><edge source="78" target="58" /><edge source="78" target="99" /><edge source="16" target="33" /><edge source="16" target="35" /><edge source="16" target="84" /><edge source="16" target="52" /><edge source="16" target="2" /><edge source="16" target="14" /><edge source="64" target="51" /><edge source="64" target="98" /><edge source="94" target="77" /><edge source="94" target="43" /><edge source="94" target="67" /><edge source="94" target="31" /><edge source="94" target="53" /><edge source="94" target="30" /><edge source="94" target="28" /><edge source="71" target="95" /><edge source="71" target="76" /><edge source="71" target="81" /><edge source="71" target="44" /><edge source="71" target="94" /><edge source="71" target="91" /><edge source="66" target="59" /><edge source="66" target="57" /><edge source="66" target="45" /><edge source="66" target="93" /><edge source="66" target="85" /><edge source="66" target="64" /><edge source="66" target="85" /><edge source="68" target="78" /><edge source="68" target="4" /><edge source="68" target="61" /><edge source="68" target="99" /><edge source="68" target="60" /><edge source="99" target="62" /><edge source="99" target="83" /><edge source="99" target="63" /><edge source="99" target="63" /><edge source="99" target="28" /><edge source="62" target="73" /><edge source="62" target="89" /><edge source="40" target="17" /><edge source="40" target="74" /><edge source="21" target="60" /><edge source="21" target="57" /><edge source="21" target="29" /><edge source="21" target="57" /><edge source="21" target="81" /><edge source="21" target="15" /><edge source="21" target="10" /><edge source="21" target="20" /><edge source="95" target="80" /><edge source="95" target="33" /><edge source="95" target="55" /><edge source="95" target="25" /><edge source="95" target="72" /><edge source="38" target="51" /></graph></graphml>`;

    // Глобальные переменные
    let adjacency = {};
    let idToLabel = {};
    let labelToId = {};

    // Парсим XML при загрузке страницы
    function parseGraph() {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawGraphXML, "text/xml");

        // 1. Читаем узлы
        const nodes = xmlDoc.getElementsByTagName("node");
        for (let i = 0; i < nodes.length; i++) {
            const id = nodes[i].getAttribute("id");
            const label = nodes[i].getAttribute("mainText");
            if (id && label) {
                idToLabel[id] = label;
                labelToId[label] = id;
            }
        }

        // 2. Читаем связи
        const edges = xmlDoc.getElementsByTagName("edge");
        for (let i = 0; i < edges.length; i++) {
            const source = edges[i].getAttribute("source");
            const target = edges[i].getAttribute("target");
            
            if (!adjacency[source]) adjacency[source] = [];
            // Граф ориентированный, добавляем только в одну сторону
            adjacency[source].push(target);
        }
    }

    // Алгоритм поиска (BFS)
    function findShortestPath() {
        const startLabel = document.getElementById("startNode").value.trim();
        const endLabel = document.getElementById("endNode").value.trim();
        const resultDiv = document.getElementById("result");

        if (!labelToId[startLabel]) {
            resultDiv.innerHTML = `<span class="error">Ошибка: Вершина "${startLabel}" не найдена.</span>`;
            return;
        }
        if (!labelToId[endLabel]) {
            resultDiv.innerHTML = `<span class="error">Ошибка: Вершина "${endLabel}" не найдена.</span>`;
            return;
        }

        const startId = labelToId[startLabel];
        const endId = labelToId[endLabel];

        // Очередь для BFS: [текущий_узел, [путь]]
        let queue = [[startId, [startId]]];
        let visited = new Set([startId]);
        let foundPath = null;

        while (queue.length > 0) {
            const [currentNode, path] = queue.shift();

            if (currentNode === endId) {
                foundPath = path;
                break;
            }

            const neighbors = adjacency[currentNode] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    const newPath = [...path, neighbor];
                    queue.push([neighbor, newPath]);
                }
            }
        }

        if (foundPath) {
            const labelPath = foundPath.map(id => idToLabel[id]);
            const pathStr = labelPath.join(" → ");
            resultDiv.innerHTML = `<span class="success">Маршрут найден (${labelPath.length - 1} шагов):</span><br><br>${pathStr}`;
        } else {
            resultDiv.innerHTML = `<span class="error">Маршрут от ${startLabel} до ${endLabel} невозможен (нет связи).</span>`;
        }
    }

    // Запуск парсинга сразу
    parseGraph();

</script>

</body>
</html>
