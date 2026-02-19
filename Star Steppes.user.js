// ==UserScript==
// @name         CatWar Steppe Scanner
// @namespace    Violent Monkey Scripts
// @version      1.0
// @description  Автоматически определяет номер Звездной степи по сетке переходов
// @author       Gemini
// @match        *://catwar.net/*
// @match        *://catwar.su/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    let steppePatterns = {};
    let scanTimeout = null; // Таймер для защиты от зависаний

    // === ЧАСТЬ 1: НАДЕЖНЫЙ ПАРСЕР ===
    function compilePatterns(bbData) {
        const blockRegex = /\[block=Меню1:(\d+)\]([\s\S]*?)\[\/block\]/g;
        let match;

        while ((match = blockRegex.exec(bbData)) !== null) {
            const stepId = match[1];
            const content = match[2].trim();

            let exitIndices = [];
            let cellIndex = 0;

            let lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines[0] && /^\d+$/.test(lines[0])) {
                lines = lines.slice(1); // Убираем заголовок
            }

            lines.forEach(line => {
                // Превращаем любой тег [header...]...[/header] в букву E
                let simplified = line.replace(/\[header=[^\]]+\](?:.*?)\[\/header\]/g, "E");

                // Ищем ТОЛЬКО E, ⬛ и ⬜. Это решает проблему со съезжанием из-за пробелов или эмодзи!
                const tokens = simplified.match(/E|⬛|⬜/g) || [];

                tokens.forEach(token => {
                    if (token === 'E' || token === '⬛') {
                        exitIndices.push(cellIndex);
                        cellIndex++;
                    } else if (token === '⬜') {
                        cellIndex++;
                    }
                });
            });

            steppePatterns[stepId] = exitIndices;
        }
        console.log("[Steppe Scanner] Загружено паттернов степей:", Object.keys(steppePatterns).length);
    }

    // === ЧАСТЬ 2: ЛОГИКА СКАНИРОВАНИЯ (ИСПРАВЛЕННАЯ) ===
    function scanAndMatch() {
        // 1. Проверяем, в степи ли мы
        const locationSpan = document.getElementById('location');
        if (!locationSpan || !locationSpan.innerText.includes('Звёздная степь')) {
            return;
        }

        // 2. Ищем все ячейки
        const cages = document.querySelectorAll('table#cages td.cage');
        if (cages.length === 0) return;

        let currentExits = [];

        cages.forEach((cage, index) => {
            // ИСПРАВЛЕНИЕ: Ищем класс move_parent (с нижним подчеркиванием!)
            if (cage.querySelector('.move_parent')) {
                currentExits.push(index);
            }
        });

        if (currentExits.length === 0) return;

        // 3. Ищем совпадение
        let matchedSteppe = null;
        for (const [steppe, pattern] of Object.entries(steppePatterns)) {
            if (currentExits.length === pattern.length && currentExits.every((val, i) => val === pattern[i])) {
                matchedSteppe = steppe;
                break;
            }
        }

        // 4. Выводим результат
        if (matchedSteppe) {
            displaySteppeNumber(matchedSteppe);
        } else {
            // Если паттерн не найден, можем вывести знак вопроса для отладки
            displaySteppeNumber("?");
        }
    }

    function displaySteppeNumber(steppeNum) {
        const locationSpan = document.getElementById('location');
        if (!locationSpan) return;

        let resultSpan = document.getElementById('cw-steppe-result');
        if (!resultSpan) {
            resultSpan = document.createElement('span');
            resultSpan.id = 'cw-steppe-result';
            resultSpan.style.color = '#2B89BD';
            resultSpan.style.fontWeight = 'bold';
            resultSpan.style.marginLeft = '0px';
          resultSpan.style.display = 'block'; // Делает элемент блоком (перенос на новую строку)
            resultSpan.style.marginTop = '3px'; // Небольшой отступ сверху
            locationSpan.parentNode.insertBefore(resultSpan, locationSpan.nextSibling);
        }

        resultSpan.innerText = `[Степь: ${steppeNum}]`;
              // --- ОТПРАВКА ДАННЫХ В IFRAME ---

        const iframe = document.getElementById('cw-route-iframe');

        if (iframe && iframe.contentWindow && steppeNum !== "?") {

            // Шлем сайту команду обновить начальную степь

            iframe.contentWindow.postMessage({ action: 'updateStart', steppe: steppeNum }, '*');

        }
    }
    // === ЛОГИКА ИСТОРИИ (Реверс и прокрутка) ===
        // === ЛОГИКА ИСТОРИИ (Реверс и прокрутка) ===
    function formatHistory() {
        const ist = document.getElementById('ist');
        if (!ist) return;

        // 1. Оформляем блок (рамка, размер, прокрутка)
        ist.style.display = 'block';
        ist.style.maxHeight = '250px';
        ist.style.overflowY = 'auto';
        ist.style.border = '1px solid #777';
        ist.style.padding = '5px';
        ist.style.borderRadius = '4px';
        ist.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
        ist.style.marginBottom = '5px';

        // 2. УМНАЯ БЛОКИРОВКА: проверяем, не перевернули ли мы этот текст уже
        if (ist.querySelector('#cw-history-reversed')) return;

        // Берем текущий текст от игры
        let currentHTML = ist.innerHTML.trim();
        if (!currentHTML) return;

        // 3. Заменяем ". " на специальный маркер, чтобы не сломать ссылки на профили
        let tempHTML = currentHTML.replace(/\.\s+/g, '.|||');

        // Разбиваем на массив предложений
        let parts = tempHTML.split('|||');

        // Убираем возможные пустые кусочки
        parts = parts.filter(p => p.trim() !== '');

        // 4. ПЕРЕВОРАЧИВАЕМ!
        parts.reverse();

        // Склеиваем обратно с пробелами
        let finalHTML = parts.join(' ');

        // 5. Оборачиваем в наш маркер-невидимку (display: contents не ломает верстку) и вставляем
        ist.innerHTML = `<div id="cw-history-reversed" style="display: contents;">${finalHTML}</div>`;
    }


    // Создаем отдельного наблюдателя для блока истории
    const historyObserver = new MutationObserver(() => {
        formatHistory();
    });

    // НАБЛЮДАТЕЛЬ
    const observer = new MutationObserver(() => {
        // Используем debounce (задержку), чтобы скрипт не срабатывал 100 раз в секунду при анимации перехода
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(scanAndMatch, 200);
    });

      // === ВИДЖЕТ МАРШРУТИЗАТОРА ===
        // === ВИДЖЕТ МАРШРУТИЗАТОРА ===
    function createRouteWidget() {
        // Ищем таблицу с инфо-блоками (родство, история, персонаж)
        const infoTable = document.getElementById('info_main');

        // Защита от двойного создания
        if (!infoTable || document.getElementById('cw-route-widget')) return;

        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'cw-route-widget';
        // Растягиваем почти на всю ширину страницы и центрируем
        widgetContainer.style.margin = '20px auto';
        widgetContainer.style.width = '98%';
        widgetContainer.style.textAlign = 'center';

        const toggleBtn = document.createElement('button');
        toggleBtn.innerText = 'Строить маршрут (Звёздные степи)';
        toggleBtn.style.padding = '10px 20px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.background = '#334155';
        toggleBtn.style.color = '#fff';
        toggleBtn.style.border = '1px solid #475569';
        toggleBtn.style.borderRadius = '5px';
        toggleBtn.style.fontWeight = 'bold';
        toggleBtn.style.fontSize = '14px';

        const iframe = document.createElement('iframe');
        iframe.id = 'cw-route-iframe';
        iframe.src = 'https://lyuova.github.io/Star-Steppes-route/';
        iframe.style.width = '100%';
        // Сделал высоту чуть больше (700px), чтобы на широком экране помещалось еще больше данных
        iframe.style.height = '700px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.marginTop = '15px';
        iframe.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

        // Вспоминаем, было ли окно открыто при прошлой загрузке
        iframe.style.display = localStorage.getItem('cw-route-open') === 'true' ? 'block' : 'none';

        toggleBtn.onclick = () => {
            if (iframe.style.display === 'none') {
                iframe.style.display = 'block';
                localStorage.setItem('cw-route-open', 'true');
            } else {
                iframe.style.display = 'none';
                localStorage.setItem('cw-route-open', 'false');
            }
        };

        widgetContainer.appendChild(toggleBtn);
        widgetContainer.appendChild(iframe);

                // Создаем новую строку прямо ВНУТРИ бежевой таблицы
        const tbody = infoTable.querySelector('tbody');
        if (tbody) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            
            td.colSpan = 3; // Растягиваем ячейку на все 3 колонки (Родственники, История, Персонаж)
            td.className = 'infos'; // Волшебный класс игры, который дает тот самый бежевый фон!
            td.style.padding = '10px'; // Аккуратный отступ от краев
            
            // Немного уменьшим отступ самого виджета, так как у ячейки теперь есть свои отступы
            widgetContainer.style.margin = '0 auto';
            
            td.appendChild(widgetContainer);
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

    }

    // ЗАПУСК
    window.addEventListener('load', () => {


        createRouteWidget(); // <-- ДОБАВИТЬ ЭТУ СТРОЧКУ



        formatHistory();

        compilePatterns(bbData);

        // ... остальной код


        // Начинаем следить за изменениями именно в блоке истории
        const historyBlock = document.getElementById('history_block');
        if (historyBlock) {
            historyObserver.observe(historyBlock, { childList: true, subtree: true, characterData: true });
        }

        compilePatterns(bbData); // bbData находится в 3-й части внизу

        setTimeout(scanAndMatch, 500);

        const actBlock = document.getElementById('act');
        if (actBlock) {
            observer.observe(actBlock, { childList: true, subtree: true });
        } else {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    });

    // === ТУТ ДОЛЖНА БЫТЬ ЧАСТЬ 3 (let bbData = `...`) ===


    // === ЧАСТЬ 3.1: БАЗА ДАННЫХ СТЕПЕЙ (1 - 50) ===
    let bbData = `
[block=Меню1:1]
⬛⬜⬜⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:46]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:43]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:62]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:2]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:5]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:22]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:3]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:6]⬛[/header]⬜⬜⬜
⬜[header=Меню2:34]⬛[/header]⬜⬜[header=Меню2:37]⬛[/header]⬜[header=Меню2:38]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:15]⬛[/header]⬜
⬜⬜⬜⬜⬜[header=Меню2:55]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:4]
[header=Меню2:3]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:36]⬛[/header]⬜⬜⬜[header=Меню2:90]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:5]
⬜[header=Меню2:4]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:43]⬛[/header][header=Меню2:52]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:75]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:90]⬛[/header]⬜
⬜⬜⬜⬜⬜[header=Меню2:23]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:6]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:1]1️⃣[/header]⬜
⬜⬜⬜[header=Меню2:7]⬛[/header]⬜⬜⬜⬜[header=Меню2:99]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:84]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:65]⬛[/header]⬜⬜
[header=Меню2:41]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:7]
⬜[header=Меню2:49]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:8]⬛[/header]⬜⬜[header=Меню2:83]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:55]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:8]
⬜⬜[header=Меню2:9]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:25]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:15]⬛[/header][header=Меню2:70]⬛[/header]⬜⬜[header=Меню2:49]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:65]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:9]
⬜⬜⬜[header=Меню2:59]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:10]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:66]⬛[/header]⬜⬜[header=Меню2:85]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:10]
⬜⬜⬜⬜[header=Меню2:11]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:98]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:54]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:98]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:11]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:14]⬛[/header]⬜
⬜⬜[header=Меню2:12]⬛[/header]⬜⬜[header=Меню2:40]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:12]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:15]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:27]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:9]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:13]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:15]⬛[/header]⬜⬜⬜
⬜[header=Меню2:40]⬛[/header]⬜⬜⬜[header=Меню2:70]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:35]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:14]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:15]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:86]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:4]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:30]⬛[/header]⬜
[/block]
[block=Меню1:15]
⬜⬜[header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:75]⬛[/header]⬜[header=Меню2:72]⬛[/header]⬜⬜
[header=Меню2:53]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:7]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:5]⬛[/header]⬜⬜⬜⬜⬜
[/block]
[block=Меню1:16]
⬜⬜⬜⬜[header=Меню2:76]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:34]⬛[/header]⬜⬜⬜⬜
⬜⬜[header=Меню2:24]⬛[/header][header=Меню2:83]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:27]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:7]⬛[/header][header=Меню2:17]⬛[/header]⬜
[/block]
[block=Меню1:17]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:20]⬛[/header]⬜⬜⬜⬜⬜⬜⬜[header=Меню2:18]⬛[/header]⬜
[/block]
[block=Меню1:18]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:19]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:29]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:19]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:36]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:79]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:68]⬛[/header]⬜⬜
[header=Меню2:25]⬛[/header]⬜⬜[header=Меню2:20]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:84]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:97]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:20]
[header=Меню2:21]⬛[/header]⬜⬜⬜[header=Меню2:15]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:86]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:91]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:21]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:40]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:22]⬛[/header]⬜⬜[header=Меню2:63]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:43]⬛[/header][header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:22]
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:25]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:20]⬛[/header]⬜⬜⬜
⬜⬜[header=Меню2:19]⬛[/header]⬜⬜[header=Меню2:94]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:21]⬛[/header]⬜⬜⬜
[header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:23]
⬜⬜⬜⬜[header=Меню2:78]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:95]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:12]⬛[/header][header=Меню2:98]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:24]
⬜⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:14]⬛[/header]⬜
⬜⬜⬜⬜[header=Меню2:56]⬛[/header]⬜[header=Меню2:86]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:33]⬛[/header]⬜[header=Меню2:93]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:69]⬛[/header]⬜⬜
[/block]
[block=Меню1:25]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:26]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:15]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:26]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:18]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:46]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:46]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:56]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:27]
⬜⬜⬜⬜⬜⬜[header=Меню2:32]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:39]⬛[/header][header=Меню2:5]⬛[/header]⬜⬜[header=Меню2:39]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:93]⬛[/header]⬜⬜[header=Меню2:32]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:50]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:28]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:27]⬛[/header]⬜[header=Меню2:41]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:29]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:28]⬛[/header]⬜⬜⬜⬜⬜⬜⬜[header=Меню2:65]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:25]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:40]⬛[/header]⬜⬜
[/block]
[block=Меню1:30]
⬜⬜⬜⬜[header=Меню2:31]⬛[/header][header=Меню2:67]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:20]⬛[/header]⬜⬜
⬜[header=Меню2:90]⬛[/header]⬜⬜⬜[header=Меню2:59]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:89]⬛[/header]⬜⬜⬜[header=Меню2:12]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:31]
[header=Меню2:99]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:77]⬛[/header]⬜[header=Меню2:48]⬛[/header]⬜
⬜[header=Меню2:95]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:70]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:33]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:32]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:10]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:14]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:33]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:3]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:58]⬛[/header][header=Меню2:62]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:84]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:47]⬛[/header]⬜⬜⬜⬜⬜
[header=Меню2:98]⬛[/header][header=Меню2:47]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:34]
⬜⬜⬜⬜[header=Меню2:80]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:4]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:45]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:61]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:93]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:35]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:42]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:36]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:3]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:33]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:37]
⬜⬜⬜[header=Меню2:19]⬛[/header]⬜⬜[header=Меню2:66]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:1]1️⃣[/header]⬜[header=Меню2:14]⬛[/header]⬜⬜⬜⬜⬜
[header=Меню2:69]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:36]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:38]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:87]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:55]⬛[/header]⬜
⬜⬜[header=Меню2:39]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:39]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:11]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:57]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:54]⬛[/header]⬜⬜
[/block]
[block=Меню1:40]
⬜⬜⬜⬜⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:28]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:23]⬛[/header]⬜⬜⬜⬜[header=Меню2:8]⬛[/header]⬜
[header=Меню2:11]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:41]
[header=Меню2:42]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:65]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:42]
⬜⬜⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:89]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:43]
⬜⬜⬜⬜[header=Меню2:34]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:3]⬛[/header]⬜⬜[header=Меню2:9]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:9]⬛[/header]⬜
[/block]
[block=Меню1:44]
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:26]⬛[/header]⬜⬜
[header=Меню2:58]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:28]⬛[/header]⬜⬜⬜[header=Меню2:3]⬛[/header]⬜[header=Меню2:74]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:45]
⬜⬜⬜[header=Меню2:1]1️⃣[/header]⬜⬜[header=Меню2:43]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:82]⬛[/header]⬜⬜⬜⬜
[header=Меню2:71]⬛[/header][header=Меню2:72]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:41]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:5]⬛[/header]⬜
[/block]
[block=Меню1:46]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:19]⬛[/header]⬜[header=Меню2:72]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:39]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:37]⬛[/header]⬜[header=Меню2:68]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:47]
⬜⬜⬜⬜⬜⬜[header=Меню2:48]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:6]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:42]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:48]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:49]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:61]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:25]⬛[/header]⬜⬜⬜⬜
⬜[header=Меню2:3]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:49]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:27]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:57]⬛[/header][header=Меню2:32]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:12]⬛[/header]⬜⬜⬜⬜⬜
[header=Меню2:56]⬛[/header]⬜⬜⬜[header=Меню2:52]⬛[/header]⬜⬜⬜⬜⬜
[/block]
[block=Меню1:50]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:73]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:60]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
`;
    // === ЧАСТЬ 3.2: БАЗА ДАННЫХ СТЕПЕЙ (51 - 100) ===
    bbData += `
[block=Меню1:51]
⬜⬜⬜⬜⬜⬜[header=Меню2:93]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:77]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:13]⬛[/header]⬜[header=Меню2:38]⬛[/header]⬜⬜[header=Меню2:74]⬛[/header]⬜
⬜⬜[header=Меню2:75]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:52]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:8]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:99]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:53]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:54]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:93]⬛[/header][header=Меню2:92]⬛[/header]⬜⬜⬜⬜
⬜⬜[header=Меню2:68]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:54]
⬜⬜⬜⬜⬜⬜[header=Меню2:55]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:87]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:87]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:55]
⬜⬜⬜[header=Меню2:68]⬛[/header]⬜[header=Меню2:100]⬛[/header]⬜⬜⬜⬜
[header=Меню2:4]⬛[/header]⬜⬜[header=Меню2:62]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:85]⬛[/header]⬜[header=Меню2:28]⬛[/header]⬜⬜[header=Меню2:94]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:56]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:78]⬛[/header]⬜
⬜⬜[header=Меню2:40]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:77]⬛[/header][header=Меню2:81]⬛[/header][header=Меню2:88]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:76]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:57]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:64]⬛[/header]⬜⬜⬜[header=Меню2:38]⬛[/header]⬜⬜⬜⬜
⬜[header=Меню2:45]⬛[/header][header=Меню2:13]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:10]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:3]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:1]1️⃣[/header]⬜⬜⬜
[/block]
[block=Меню1:58]
⬜[header=Меню2:42]⬛[/header]⬜[header=Меню2:65]⬛[/header]⬜⬜⬜⬜⬜⬜
[header=Меню2:26]⬛[/header]⬜⬜[header=Меню2:53]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:46]⬛[/header]⬜⬜⬜
⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:5]⬛[/header]⬜[header=Меню2:27]⬛[/header]⬜⬜⬜⬜⬜
[/block]
[block=Меню1:59]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:60]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:67]⬛[/header]⬜⬜[header=Меню2:85]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:60]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:38]⬛[/header]⬜
⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:71]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:18]⬛[/header]⬜⬜[header=Меню2:58]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:61]
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:53]⬛[/header]⬜⬜
[header=Меню2:6]⬛️[/header]⬜⬜⬜⬜⬜⬜[header=Меню2:18]⬛[/header][header=Меню2:93]⬛[/header]⬜
⬜️[header=Меню2:62]⬛️[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜️⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:6]⬛[/header]⬜[header=Меню2:73]⬛[/header]⬜
[/block]
[block=Меню1:62]
⬜⬜[header=Меню2:63]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:99]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:74]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:63]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:1]1️⃣[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:57]⬛[/header]⬜⬜⬜[header=Меню2:33]⬛[/header]⬜[header=Меню2:88]⬛[/header]⬜
[/block]
[block=Меню1:64]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:7]⬛[/header]⬜⬜⬜⬜[header=Меню2:88]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:29]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:65]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:66]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:50]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:80]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:77]⬛[/header]⬜
[/block]
[block=Меню1:66]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:79]⬛[/header]⬜
[header=Меню2:25]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:59]⬛[/header]⬜⬜
⬜⬜⬜⬜[header=Меню2:59]⬛[/header]⬜[header=Меню2:57]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:80]⬛[/header][header=Меню2:8]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:67]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:68]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:53]⬛[/header]⬜[header=Меню2:45]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:50]⬛[/header]⬜⬜⬜[header=Меню2:97]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:68]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:41]⬛[/header]⬜[header=Меню2:34]⬛[/header]⬜[header=Меню2:38]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:69]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:69]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:12]⬛[/header][header=Меню2:75]⬛[/header]⬜⬜⬜⬜
⬜[header=Меню2:81]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:52]⬛[/header]⬜[header=Меню2:63]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:19]⬛[/header]⬜⬜
[/block]
[block=Меню1:70]
⬜⬜⬜⬜⬜⬜[header=Меню2:24]⬛[/header][header=Меню2:42]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:60]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:66]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:71]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:50]⬛[/header]⬜⬜⬜⬜⬜⬜⬜[header=Меню2:30]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:60]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:36]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:72]
[header=Меню2:73]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:51]⬛[/header]⬜⬜
[/block]
[block=Меню1:73]
[header=Меню2:70]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:26]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:94]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:19]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:97]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:74]
⬜⬜⬜⬜⬜[header=Меню2:23]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:31]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:75]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:83]⬛[/header]⬜[header=Меню2:35]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:87]⬛[/header][header=Меню2:57]⬛[/header]⬜⬜️⬜
[/block]
[block=Меню1:76]
⬜⬜⬜⬜⬜[header=Меню2:79]⬛[/header][header=Меню2:96]⬛[/header][header=Меню2:2]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:23]⬛[/header]⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:55]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:77]
[header=Меню2:73]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:42]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:72]⬛[/header]⬜⬜[header=Меню2:66]⬛[/header]⬜⬜⬜⬜
[/block]
[block=Меню1:78]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:79]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:53]⬛[/header]⬜⬜
⬜⬜⬜⬜[header=Меню2:44]⬛[/header]⬜[header=Меню2:91]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:79]
⬜⬜⬜⬜[header=Меню2:69]⬛[/header]⬜⬜⬜⬜⬜
⬜[header=Меню2:83]⬛[/header]⬜⬜⬜⬜[header=Меню2:24]⬛[/header]⬜[header=Меню2:87]⬛[/header]⬜
⬜⬜⬜⬜[header=Меню2:60]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:3]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜⬜⬜⬜⬜
[/block]
[block=Меню1:80]
⬜⬜⬜⬜⬜[header=Меню2:81]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:16]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:81]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:45]⬛[/header]⬜
⬜⬜⬜⬜[header=Меню2:92]⬛[/header]⬜⬜⬜⬜⬜
⬜[header=Меню2:34]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:18]⬛[/header]⬜[header=Меню2:26]⬛[/header]⬜⬜
⬜[header=Меню2:18]⬛[/header]⬜⬜⬜⬜[header=Меню2:32]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:82]
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:80]⬛[/header]⬜⬜
⬜[header=Меню2:79]⬛[/header]⬜⬜⬜⬜[header=Меню2:2]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:77]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:83]
[header=Меню2:6]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:48]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:73]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:93]⬛[/header]⬜⬜⬜⬜⬜[header=Меню2:21]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:84]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:26]⬛[/header]⬜⬜[header=Меню2:25]⬛[/header]⬜⬜⬜
⬜[header=Меню2:20]⬛[/header]⬜[header=Меню2:39]⬛[/header]⬜[header=Меню2:20]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:28]⬛[/header]⬜⬜
[/block]
[block=Меню1:85]
⬜⬜⬜⬜[header=Меню2:54]⬛[/header]⬜⬜[header=Меню2:3]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:25]⬛[/header]⬜⬜⬜⬜
⬜[header=Меню2:72]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:92]⬛[/header]⬜⬜⬜⬜⬜
[/block]
[block=Меню1:86]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:54]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:6]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:66]⬛[/header]⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:87]
⬜⬜⬜⬜⬜[header=Меню2:61]⬛[/header]⬜[header=Меню2:80]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:88]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:7]⬛[/header][header=Меню2:57]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:88]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:76]⬛[/header]⬜[header=Меню2:23]⬛[/header]⬜⬜⬜⬜
⬜⬜[header=Меню2:95]⬛[/header]⬜⬜[header=Меню2:90]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:76]⬛[/header]⬜⬜⬜⬜[header=Меню2:87]⬛[/header]⬜[header=Меню2:96]⬛[/header]⬜
[/block]
[block=Меню1:89]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:74]⬛[/header][header=Меню2:25]⬛[/header]⬜⬜⬜
⬜⬜⬜[header=Меню2:19]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:96]⬛[/header]⬜
[/block]
[block=Меню1:90]
⬜[header=Меню2:28]⬛[/header]⬜⬜⬜[header=Меню2:59]⬛[/header]⬜⬜⬜⬜
⬜[header=Меню2:61]⬛[/header]⬜⬜⬜⬜[header=Меню2:53]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:46]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:4]⬛[/header]⬜⬜
[/block]
[block=Меню1:91]
[header=Меню2:72]⬛[/header]⬜⬜⬜⬜⬜⬜[header=Меню2:64]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:92]
⬜⬜⬜⬜[header=Меню2:67]⬛[/header]⬜⬜⬜⬜⬜
⬜[header=Меню2:12]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:78]⬛[/header]⬜
⬜[header=Меню2:26]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:76]⬛[/header][header=Меню2:70]⬛[/header]⬜⬜⬜
⬜⬜[header=Меню2:9]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:93]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:100]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:31]⬛[/header]⬜⬜⬜⬜[header=Меню2:47]⬛[/header]⬜⬜⬜
[header=Меню2:40]⬛[/header]⬜⬜⬜⬜[header=Меню2:92]⬛[/header][header=Меню2:73]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:94]
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:29]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:18]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:27]⬛[/header]⬜⬜[header=Меню2:51]⬛[/header][header=Меню2:42]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[header=Меню2:91]⬛[/header]⬜[header=Меню2:42]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:95]
⬜⬜⬜⬜⬜⬜⬜⬜[header=Меню2:89]⬛[/header]⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:62]⬛[/header]⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:68]⬛[/header]⬜⬜⬜⬜[header=Меню2:96]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:79]⬛[/header]⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:96]
⬜[header=Меню2:97]⬛[/header]⬜⬜⬜⬜[header=Меню2:45]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜[header=Меню2:21]⬛[/header]⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:21]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜[header=Меню2:9]⬛[/header]⬜⬜⬜
[/block]
[block=Меню1:97]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜[header=Меню2:32]⬛[/header]⬜⬜[header=Меню2:82]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:98]
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜[header=Меню2:52]⬛[/header][header=Меню2:39]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
[/block]
[block=Меню1:99]
⬜⬜⬜⬜[header=Меню2:79]⬛[/header]⬜[header=Меню2:18]⬛[/header]⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜[header=Меню2:25]⬛[/header]⬜[header=Меню2:18]⬛[/header]⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:47]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:36]⬛[/header]⬜[header=Меню2:37]⬛[/header][header=Меню2:7]⬛[/header]⬜⬜
[/block]
[block=Меню1:100]
⬜⬜⬜⬜[header=Меню2:48]⬛[/header]⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:28]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜[header=Меню2:17]⬛[/header]⬜⬜⬜⬜
⬜⬜⬜⬜[header=Меню2:49]⬛[/header]⬜⬜⬜⬜⬜
⬜[header=Меню2:69]⬛[/header]⬜⬜⬜⬜⬜⬜[header=Меню2:44]⬛[/header]⬜
[/block]
`;

})(); // ЗАКРЫВАЕМ ОСНОВНУЮ ФУНКЦИЮ СКРИПТА
