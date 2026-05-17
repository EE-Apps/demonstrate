// === Глобальные переменные ===
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const totalSlides = slides.length;

// === Вспомогательная функция: извлекает число из "slide1" → 1 ===
function getSlideNumber(id) {
    if (!id) return 1;
    const num = String(id).replace(/^slide|^p|^c/i, '');
    const parsed = parseInt(num, 10);
    return isNaN(parsed) ? 1 : parsed;
}

// === Инициализация индикаторов ===
function initIndicators() {
    const container = document.getElementById('indicators');
    if (!container) return;
    container.innerHTML = '';
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.dataset.num = String(index + 1);
        dot.id = `c${index + 1}`;
        dot.addEventListener('click', () => goToSlide(index + 1));
        container.appendChild(dot);
    });
}

// === Основная функция переключения слайдов ===
function changeSlide(id, way, numer = 1) {
    // Нормализуем входящий ID: "slide1" → 1, "1" → 1
    const currentId = getSlideNumber(id);
    
    // Граничные проверки
    if (currentId === 1 && way === 'minus') return;
    if (way === 'plus' && currentId >= totalSlides) return;
    
    const currentSlideEl = document.getElementById(`slide${currentId}`);
    const currentDot = document.getElementById(`c${currentId}`);
    
    if (!currentSlideEl) {
        console.warn(`⚠️ Слайд #slide${currentId} не найден`);
        return;
    }
    
    // Анимация ухода: добавляем класс 'left' при движении вперёд
    if (way === 'plus') {
        currentSlideEl.classList.add('left');
        if (currentDot) currentDot.classList.add('left');
    }
    
    // Убираем active с текущего
    currentSlideEl.classList.remove('active');
    if (currentDot) currentDot.classList.remove('active');
    
    // Вычисляем целевой номер слайда
    let targetNum;
    switch (way) {
        case 'plus': targetNum = currentId + 1; break;
        case 'minus': targetNum = currentId - 1; break;
        case 'dirrect': targetNum = getSlideNumber(numer); break;
        default: return;
    }
    
    // Проверка границ
    if (targetNum < 1 || targetNum > totalSlides) return;
    
    // Обработка прямого перехода: анимация всех промежуточных
    if (way === 'dirrect') {
        slides.forEach(slide => {
            const num = getSlideNumber(slide.id);
            if (num < targetNum && !slide.classList.contains('left')) {
                slide.classList.add('left');
            }
            if (num > targetNum && slide.classList.contains('active')) {
                slide.classList.remove('active');
            }
        });
        // Анимация точек
        document.querySelectorAll('.dot').forEach(dot => {
            const dotNum = getSlideNumber(dot.id);
            if (dotNum < targetNum && !dot.classList.contains('left')) {
                dot.classList.add('left');
            }
            if (dotNum > targetNum && dot.classList.contains('left')) {
                dot.classList.remove('left');
            }
        });
    }
    
    const targetSlideEl = document.getElementById(`slide${targetNum}`);
    const targetDot = document.getElementById(`c${targetNum}`);
    
    if (!targetSlideEl) {
        console.warn(`⚠️ Целевой слайд #slide${targetNum} не найден`);
        return;
    }
    
    // Убираем 'left' с целевого (чтобы он появился плавно)
    targetSlideEl.classList.remove('left');
    if (targetDot) targetDot.classList.remove('left');
    
    // Активируем целевой
    targetSlideEl.classList.add('active');
    if (targetDot) targetDot.classList.add('active');
    
    // Обновляем глобальный индекс
    currentSlide = targetNum - 1;
    
    console.log(`🔀 Переход: слайд ${currentId} → ${targetNum} (${way})`);
    
    // Прокрутка вверх для демо-слайдов (если есть iframe)
    if (targetSlideEl.querySelector('iframe')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// === Быстрый переход по номеру ===
function goToSlide(num) {
    const active = document.querySelector('.slide.active');
    if (!active) return;
    const currentNum = getSlideNumber(active.id);
    changeSlide(currentNum, 'dirrect', num);
}

// === Обработчики клавиатуры ===
document.addEventListener('keydown', (event) => {
    const activeSlide = document.querySelector('.slide.active');
    if (!activeSlide) return;
    
    const currentNum = getSlideNumber(activeSlide.id);
    
    if (event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        changeSlide(currentNum, 'plus');
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        changeSlide(currentNum, 'minus');
    }
    // Прямой переход по цифрам 1-9
    else if (event.key >= '1' && event.key <= '9') {
        const target = parseInt(event.key);
        if (target <= totalSlides) {
            changeSlide(currentNum, 'dirrect', target);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prevBtn').addEventListener('click', () => {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return;
        const currentNum = getSlideNumber(activeSlide.id);
        event.preventDefault();
        changeSlide(currentNum, 'minus');
    })
    document.getElementById('nextBtn').addEventListener('click', () => {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide) return;
        const currentNum = getSlideNumber(activeSlide.id);
        event.preventDefault();
        changeSlide(currentNum, 'plus');
    })
})



// === WebSocket интеграция ===
function initWebSocket() {
    // Проверяем наличие глобального ws-объекта
    if (typeof window.ws === 'undefined') {
        console.warn('⚠️ window.ws не найден — WebSocket отключён');
        return;
    }
    
    try {
        // Подключаемся (если ещё не подключено)
        if (!window.ws.connected) {
            window.ws.connect();
        }
        console.log('✅ WebSocket подключён');
        
        // Обработчик сообщений
        window.ws.on('set', (data) => {
            console.log('📡 WebSocket message:', data);
            
            const activeSlide = document.querySelector('.slide.active');
            if (!activeSlide) return;
            const currentNum = getSlideNumber(activeSlide.id);
            
            // data.value может быть числом или строкой — приводим к строке для сравнения
            const value = String(data.value);
            
            if (value === '2') {
                // Следующий слайд
                changeSlide(currentNum, 'plus');
            } else if (value === '1') {
                // Предыдущий слайд
                changeSlide(currentNum, 'minus');
            } else if (value === '3') {
                // Специальное действие: прокрутка к элементу
                const element = document.getElementById('txtPart7') || 
                               document.querySelector('.conclusion') ||
                               document.querySelector('.final h1');
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    } catch (err) {
        console.error('❌ Ошибка инициализации WebSocket:', err);
    }
}

// === Обработчики кликов по точкам-индикаторам ===
function initDotClicks() {
    document.querySelectorAll('.dot').forEach(el => {
        el.addEventListener('click', () => {
            const activeSlide = document.querySelector('.slide.active');
            if (!activeSlide) return;
            const currentNum = getSlideNumber(activeSlide.id);
            const targetNum = getSlideNumber(el.id);
            changeSlide(currentNum, 'dirrect', targetNum);
        });
    });
}

// === Инициализация при загрузке ===
document.addEventListener('DOMContentLoaded', () => {
    // Устанавливаем data-num и id для слайдов, если нет
    slides.forEach((slide, index) => {
        if (!slide.dataset.num) {
            slide.dataset.num = String(index + 1);
        }
        if (!slide.id) {
            slide.id = `slide${index + 1}`;
        }
    });
    
    // Инициализируем индикаторы
    initIndicators();
    
    // Навешиваем обработчики на точки
    initDotClicks();
    
    // Активируем первый слайд
    if (slides[0]) {
        slides[0].classList.add('active');
    }
    const firstDot = document.getElementById('c1') || document.querySelector('.dot');
    if (firstDot) {
        firstDot.classList.add('active');
    }
    
    // Инициализируем WebSocket
    initWebSocket();
    
    console.log(`🚀 Презентация готова: ${totalSlides} слайдов`);
});

// === Экспорт функций для внешнего использования ===
window.presentation = {
    next: () => {
        const active = document.querySelector('.slide.active');
        if (active) changeSlide(getSlideNumber(active.id), 'plus');
    },
    prev: () => {
        const active = document.querySelector('.slide.active');
        if (active) changeSlide(getSlideNumber(active.id), 'minus');
    },
    goTo: (num) => {
        const active = document.querySelector('.slide.active');
        if (active) changeSlide(getSlideNumber(active.id), 'dirrect', num);
    }
};