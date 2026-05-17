// test.js — Обработка сигналов 4-7 от CloudWebSocket

// === Глобальные переменные ===
let isProcessingSignal = false;
const SIGNAL_VAR = 'test_signal';

// === Вспомогательная функция: безопасная задержка ===
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// === Вспомогательная функция: имитация реального клика ===
function simulateClick(element) {
    if (!element) return false;
    if (typeof element.focus === 'function') element.focus();
    const events = ['mouseenter', 'mouseover', 'mousedown', 'mouseup', 'click'];
    events.forEach(type => {
        element.dispatchEvent(new MouseEvent(type, {
            bubbles: true, cancelable: true, view: window, buttons: 1
        }));
    });
    if (typeof element.blur === 'function') setTimeout(() => element.blur(), 100);
    return true;
}

// === Вспомогательная функция: имитация ввода в input ===
async function simulateInput(input, value) {
    if (!input) return;
    input.focus();
    // Используем нативный setter чтобы сработали React/Vue обёртки
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSetter) {
        nativeSetter.call(input, String(value));
    } else {
        input.value = String(value);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(50);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('keyup', { bubbles: true }));
    input.blur();
}

// === Вспомогательная функция: получение числа из значения ===
function getSignalNumber(value) {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    if (window.ws?.decodeText && typeof value === 'string' && /^[\x31-\x38]+$/.test(str)) {
        try {
            const decoded = window.ws.decodeText(str);
            if (decoded && /^\d+$/.test(decoded.trim())) return parseInt(decoded.trim(), 10);
        } catch (e) { /* игнорируем */ }
    }
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
}

// === Сигнал 4: Калькулятор → sin(π/2)+3^2 ===
async function handleSignal4() {
    console.log('🔢 Signal 4: Calculator sin(π/2)+3^2');
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) simulateClick(calcBtn);
    else window.PagesManager?.pageSwitch('calc');
    await wait(500);

    const clearBtn = document.querySelector('#pcalc .btn[data-val="clear"]');
    if (clearBtn) { simulateClick(clearBtn); await wait(300); }

    const expression = 'sin(π/2)+3^2';
    const cm = window.CalcManager;
    const input = document.getElementById('clin');
    if (cm?.interactClin && input) {
        for (const char of expression) { cm.interactClin('add', char); await wait(150); }
    } else if (input) {
        await simulateInput(input, expression);
    }
    await wait(400);

    const resultBtn = document.querySelector('#pcalc .btn[data-val="result"]');
    if (resultBtn) simulateClick(resultBtn);
    else cm?.interactClin('result', 'click');

    await wait(600);
    console.log('✅ Signal 4 completed');
}

// === Сигнал 5: HEX + мин.вид → 25-B ===
async function handleSignal5() {
    console.log('🔣 Signal 5: HEX minimal 25-B');
    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) simulateClick(calcBtn);
    else window.PagesManager?.pageSwitch('calc');
    await wait(500);

    const hexBtn = document.getElementById('sys16');
    if (hexBtn) { simulateClick(hexBtn); await wait(400); }
    else window.CalcManager?.sysSwitch(16);

    window.CalcManager?.sheetSet(16, 'min');
    await wait(500);

    const clearBtn = document.querySelector('#pcalc .btn[data-val="clear"]');
    if (clearBtn) { simulateClick(clearBtn); await wait(300); }

    const expression = '25-B';
    const cm = window.CalcManager;
    const input = document.getElementById('clin');
    if (cm?.interactClin && input) {
        for (const char of expression) { cm.interactClin('add', char); await wait(150); }
    } else if (input) {
        await simulateInput(input, expression);
    }
    await wait(400);

    const resultBtn = document.querySelector('#pcalc .btn[data-val="result"]');
    if (resultBtn) simulateClick(resultBtn);
    else cm?.interactClin('result', 'click');

    await wait(600);
    console.log('✅ Signal 5 completed');
}

// === Сигнал 6: Конвертер длины → м/дюйм/аршин → 2м ===
async function handleSignal6() {
    console.log('📏 Signal 6: Length converter m/in/arshin → 2');

    // 1. Открываем страницу конвертеров
    const convsBtn = document.getElementById('convs-btn');
    if (convsBtn) simulateClick(convsBtn);
    else window.PagesManager?.pageSwitch('convs');
    await wait(600);

    // 2. Открываем конвертер длины через convOpen() — он устанавливает currentConverter
    //    и инициализирует converters[currentConverter]
    const lengthCard = Array.from(document.querySelectorAll('.converter'))
        .find(el => el.querySelector('p')?.textContent?.includes('Длина'));
    if (lengthCard) simulateClick(lengthCard);
    else if (typeof convOpen === 'function') convOpen('length');
    await wait(700);

    // 3. Добиваем количество полей до 3.
    //    Проверяем реальную длину массива — не захардкоживаем количество кликов.
    // Считаем сколько полей уже есть и добавляем недостающие (не более 3 итераций)
    const currentCount6 = window.converters?.[window.currentConverter]?.length ?? 0;
    const toAdd6 = Math.max(0, 3 - currentCount6);
    for (let i = 0; i < toAdd6; i++) {
        if (typeof convPlaceNew === 'function') convPlaceNew();
        else simulateClick(document.getElementById('addPlace'));
        await wait(400);
    }
    await wait(300);

    // 4. Устанавливаем единицы напрямую:
    //    convChoseEl(i) → меняет numOfChosing
    //    convSetThis(text) → пишет в converters[currentConverter][numOfChosing].unit
    //                        и вызывает convUpdate() (пересоздаёт DOM)
    //    unit.text — это ровно то значение, что хранится в converters и принимает convSetThis
    const units = [
        { field: 0, text: 'м' },
        { field: 1, text: 'in' },
        { field: 2, text: 'an' }
    ];
    for (const { field, text } of units) {
        convChoseEl(field);
        await wait(100);
        convSetThis(text);
        await wait(400);
        console.log(`  ✓ Поле ${field} → "${text}"`);
    }

    // 5. DOM пересоздан после последнего convSetThis — ищем input заново.
    //    convUpdate навешивает addEventListener('input') на инпуты,
    //    поэтому достаточно input.value + dispatchEvent('input').
    await wait(300);
    const input = document.getElementById('convInput0');
    if (input) {
        input.focus();
        input.value = '2';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('  ✓ Введено 2 в поле метров');
    } else {
        console.warn('  ⚠ convInput0 не найден');
    }

    await wait(500);
    console.log('✅ Signal 6 completed');
}

// === Сигнал 7: Конвертер валют → RUP/UAH/USD → 100 грн ===
async function handleSignal7() {
    console.log('💱 Signal 7: Currency converter RUP/UAH/USD → 100');

    // 1. Открываем страницу конвертеров
    const convsBtn = document.getElementById('convs-btn');
    if (convsBtn) simulateClick(convsBtn);
    else window.PagesManager?.pageSwitch('convs');
    await wait(500);

    // 2. Открываем конвертер валют
    const currencyCard = Array.from(document.querySelectorAll('.converter'))
        .find(el => el.querySelector('p')?.textContent?.includes('Валюты'));
    if (currencyCard) {
        currencyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await wait(600);
        simulateClick(currencyCard);
    } else {
        window.PagesManager?.pageSwitch('currency');
    }
    await wait(700);

    // 3. Добиваем количество полей до 3.
    //    currencyPlaces — аналог converters[] для валютного конвертера.
    // Считаем сколько полей уже есть и добавляем недостающие (не более 3 итераций).
    // currencyPlaces может называться иначе — смотрим оба варианта.
    const existingFields7 = document.querySelectorAll('#convplaces .place, #currencyplaces .place, [id^="currN"]').length;
    const currentCount7 = window.currencyPlaces?.length ?? existingFields7 ?? 1;
    const toAdd7 = Math.max(0, 3 - currentCount7);
    for (let i = 0; i < toAdd7; i++) {
        if (typeof currencyPlaceNew === 'function') currencyPlaceNew();
        else simulateClick(document.getElementById('addPlace'));
        await wait(400);
    }
    await wait(300);

    // 4. Устанавливаем валюты.
    //    Если валютный конвертер построен по той же схеме (currencyChoseEl + currencySetThis) — используем их.
    //    Иначе правим currencyPlaces напрямую.
    const currencies = [
        { index: 0, code: 'RUP', name: 'рубль ПМР' },
        { index: 1, code: 'UAH', name: 'гривна' },
        { index: 2, code: 'USD', name: 'доллар' }
    ];
    for (const { index, code, name } of currencies) {
        if (typeof currencyChoseEl === 'function' && typeof currencySetThis === 'function') {
            currencyChoseEl(index);
            await wait(100);
            currencySetThis(code);
            await wait(400);
        } else if (typeof currencyPlaces !== 'undefined' && currencyPlaces[index] !== undefined) {
            currencyPlaces[index].code = code;
            if (typeof currencyUpdate === 'function') { currencyUpdate(); await wait(400); }
        }
        console.log(`  ✓ Поле ${index} → ${name} (${code})`);
    }

    // 5. Вводим 100 в поле гривен (индекс 1). DOM пересоздан — ищем заново.
    await wait(300);
    const input = document.getElementById('currInput1');
    if (input) {
        input.focus();
        input.value = '100';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('  ✓ Введено 100 в поле гривен');
    } else {
        console.warn('  ⚠ currInput1 не найден');
    }

    await wait(500);
    console.log('✅ Signal 7 completed');
}

// === Обработчик сообщения от WebSocket ===
function onWebSocketMessage(data) {
    console.log('📡 WebSocket message:', data);
    const varName = data?.name?.replace(/^☁\s*/, '');
    if (varName !== SIGNAL_VAR) return;
    const signal = getSignalNumber(data?.value);
    if (![4, 5, 6, 7].includes(signal)) return;
    console.log(`✅ Received signal ${signal}`);
    if (isProcessingSignal) { console.log('⏳ Already processing, skipping'); return; }
    isProcessingSignal = true;
    (async () => {
        try {
            switch (signal) {
                case 4: await handleSignal4(); break;
                case 5: await handleSignal5(); break;
                case 6: await handleSignal6(); break;
                case 7: await handleSignal7(); break;
            }
        } catch (err) {
            console.error('❌ Error handling signal:', signal, err);
        } finally {
            setTimeout(() => { isProcessingSignal = false; }, 3000);
        }
    })();
}

// === Инициализация WebSocket ===
function initWebSocket() {
    if (typeof window.ws === 'undefined') {
        console.warn('⚠️ window.ws не найден — WebSocket отключён');
        return;
    }
    try {
        if (!window.ws.connected) window.ws.connect();
        console.log('✅ WebSocket подключён, слушаю сигналы');
        window.ws.on('set', (data) => onWebSocketMessage(data));
    } catch (err) {
        console.error('❌ Ошибка инициализации WebSocket:', err);
    }
}

// === Инициализация при загрузке ===
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    console.log('🚀 test.js готов: слушаю сигналы на', `☁ ${SIGNAL_VAR}`);
});

// === Экспорт для отладки ===
window.testSignals = {
    trigger: (num) => onWebSocketMessage({ method: 'set', name: `☁ ${SIGNAL_VAR}`, value: String(num) }),
    send: (num) => { if (window.ws?.sendSet) { window.ws.sendSet(SIGNAL_VAR, String(num)); console.log(`📤 Sent signal ${num}`); } },
    status: () => ({ wsConnected: window.ws?.connected || false, processing: isProcessingSignal, currentVar: SIGNAL_VAR }),
    click: simulateClick,
    input: simulateInput
};