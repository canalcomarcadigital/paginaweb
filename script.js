// Estado global de la calculadora (usando un objeto para mejor organización)
const calculatorState = {
    currentInput: '0',
    previousInput: '',
    operation: null,
    shouldResetScreen: false,
    lastAnswer: 0,
    history: [],
    currentLanguage: navigator.language.split('-')[0] || 'es'
};

// Alias para acceso más rápido (mejora rendimiento)
let currentInput = calculatorState.currentInput;
let previousInput = calculatorState.previousInput;
let operation = calculatorState.operation;
let shouldResetScreen = calculatorState.shouldResetScreen;
let lastAnswer = calculatorState.lastAnswer;
let history = calculatorState.history;
let currentLanguage = calculatorState.currentLanguage;

// Traducciones
const translations = {
    es: {
        operations: {
            add: 'suma',
            subtract: 'resta',
            multiply: 'multiplica',
            divide: 'divide',
            sin: 'seno',
            cos: 'coseno',
            tan: 'tangente',
            log: 'logaritmo',
            sqrt: 'raíz cuadrada',
            power: 'potencia',
            factorial: 'factorial',
            percent: 'porcentaje',
            exp: 'exponencial'
        },
        error: 'Error'
    },
    en: {
        operations: {
            add: 'add',
            subtract: 'subtract',
            multiply: 'multiply',
            divide: 'divide',
            sin: 'sine',
            cos: 'cosine',
            tan: 'tangent',
            log: 'logarithm',
            sqrt: 'square root',
            power: 'power',
            factorial: 'factorial',
            percent: 'percent',
            exp: 'exponential'
        },
        error: 'Error'
    }
};

// Función para obtener la traducción (optimizada con memoización)
const translationCache = {};
function getTranslation(key, category = 'operations') {
    const cacheKey = `${currentLanguage}:${category}:${key}`;
    if (translationCache[cacheKey] === undefined) {
        translationCache[cacheKey] = translations[currentLanguage]?.[category]?.[key] || key;
    }
    return translationCache[cacheKey];
}

// Elementos del DOM
const display = document.getElementById('display');
const historyDisplay = document.getElementById('history');
const themeToggle = document.getElementById('themeToggle');

// Funciones matemáticas (optimizadas con mejor manejo de errores)
const calculator = {
    add: (a, b) => {
        const result = a + b;
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    subtract: (a, b) => {
        const result = a - b;
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    multiply: (a, b) => {
        const result = a * b;
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    divide: (a, b) => {
        if (b === 0 || !isFinite(a) || !isFinite(b)) return getTranslation('error', 'error');
        const result = a / b;
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    sin: (a) => {
        if (!isFinite(a)) return getTranslation('error', 'error');
        try {
            // Normalizar ángulos grandes para evitar pérdida de precisión
            const normalizedAngle = a % 360;
            const result = Math.sin(normalizedAngle * Math.PI / 180);
            // Redondear a cero los valores muy cercanos a cero (error de punto flotante)
            return Math.abs(result) < 1e-14 ? 0 : result;
        } catch {
            return getTranslation('error', 'error');
        }
    },
    cos: (a) => {
        if (!isFinite(a)) return getTranslation('error', 'error');
        try {
            // Normalizar ángulos grandes para evitar pérdida de precisión
            const normalizedAngle = a % 360;
            const result = Math.cos(normalizedAngle * Math.PI / 180);
            // Redondear a cero los valores muy cercanos a cero (error de punto flotante)
            return Math.abs(result) < 1e-14 ? 0 : result;
        } catch {
            return getTranslation('error', 'error');
        }
    },
    tan: (a) => {
        if (!isFinite(a)) return getTranslation('error', 'error');
        try {
            // Normalizar ángulos grandes para evitar pérdida de precisión
            const normalizedAngle = a % 360;
            // Verificar si es 90 grados o múltiplos impares (donde tangente no está definida)
            if (Math.abs(normalizedAngle % 180) === 90) return getTranslation('error', 'error');
            const result = Math.tan(normalizedAngle * Math.PI / 180);
            return isFinite(result) ? result : getTranslation('error', 'error');
        } catch {
            return getTranslation('error', 'error');
        }
    },
    log: (a) => {
        if (a <= 0 || !isFinite(a)) return getTranslation('error', 'error');
        try {
            return Math.log10(a);
        } catch {
            return getTranslation('error', 'error');
        }
    },
    sqrt: (a) => {
        if (a < 0 || !isFinite(a)) return getTranslation('error', 'error');
        return Math.sqrt(a);
    },
    power: (a) => {
        if (!isFinite(a)) return getTranslation('error', 'error');
        const result = Math.pow(a, 2);
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    factorial: (a) => {
        // Validaciones mejoradas
        if (a < 0 || !Number.isInteger(a) || a > 170 || !isFinite(a)) return getTranslation('error', 'error');
        if (a === 0) return 1;
        let result = 1;
        for (let i = 2; i <= a; i++) result *= i; // Optimizado: empezar desde 2
        return isFinite(result) ? result : getTranslation('error', 'error');
    },
    percent: (a) => {
        if (!isFinite(a)) return getTranslation('error', 'error');
        return a / 100;
    },
    exp: (a, b = 10) => {
        if (!isFinite(a) || !isFinite(b)) return getTranslation('error', 'error');
        try {
            const result = Math.pow(b, a);
            return isFinite(result) ? result : getTranslation('error', 'error');
        } catch {
            return getTranslation('error', 'error');
        }
    }
};

// Actualizar display
function updateDisplay(value = currentInput) {
    let displayText = value;
    if (previousInput && operation) {
        const operatorSymbols = {
            add: '+',
            subtract: '-',
            multiply: '×',
            divide: '÷',
            exp: '^'
        };
        // Si shouldResetScreen es true, no mostrar el valor actual después del operador
        // Esto evita que se muestre "30 × 30" después de una multiplicación
        displayText = `${previousInput} ${operatorSymbols[operation] || operation}${shouldResetScreen ? '' : ' ' + value}`;
    }
    display.textContent = displayText;
    display.dataset.previousInput = previousInput;
    display.dataset.operation = operation || '';
    display.dataset.currentInput = currentInput;
}

// Expresión regular compilada fuera de la función para mejor rendimiento
const operationRegex = /\b(add|subtract|multiply|divide|sin|cos|tan|log|sqrt|power|factorial|percent|exp)\b/g;

// Actualizar historial (optimizado con fragmentos de DOM y caché)
function updateHistory(operation) {
    // Traducir la operación
    const translatedOperation = operation.replace(operationRegex, match => getTranslation(match));
    
    // Limitar el historial a 10 elementos con mejor rendimiento
    history.push(translatedOperation);
    if (history.length > 10) history.shift();
    
    // Usar DocumentFragment para reducir reflows
    const fragment = document.createDocumentFragment();
    const newDiv = document.createElement('div');
    newDiv.textContent = translatedOperation;
    fragment.appendChild(newDiv);
    
    // Optimizar la actualización del DOM
    if (historyDisplay.children.length >= 10) {
        historyDisplay.removeChild(historyDisplay.firstChild);
    }
    historyDisplay.appendChild(fragment);
    historyDisplay.scrollTop = historyDisplay.scrollHeight;
    
    // Guardar historial en localStorage para persistencia
    try {
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
    } catch (e) {
        // Silenciar errores de localStorage (modo incógnito, etc.)
        console.warn('No se pudo guardar el historial');
    }
}

// Manejar entrada de números
function inputNumber(number) {
    if (shouldResetScreen) {
        currentInput = number;
        shouldResetScreen = false;
    } else {
        currentInput = currentInput === '0' ? number : currentInput + number;
    }
    updateDisplay();
}

// Manejar operadores
function handleOperator(op) {
    const current = parseFloat(currentInput);
    
    if (operation && !shouldResetScreen) {
        const prev = parseFloat(previousInput);
        const result = calculator[operation](prev, current);
        currentInput = String(result);
        previousInput = String(result);
        updateDisplay();
        updateHistory(`${prev} ${operation} ${current} = ${result}`);
    } else {
        previousInput = currentInput;
    }
    
    operation = op;
    shouldResetScreen = true;
    // Actualizar el display después de establecer shouldResetScreen a true
    // para evitar que se muestre el valor actual después del operador
    updateDisplay();
}

// Manejar funciones especiales
function handleFunction(func) {
    const current = parseFloat(currentInput);
    let result;

    if (func === 'backspace') {
        handleBackspace();
        return;
    }

    switch(func) {
        case 'sin':
        case 'cos':
        case 'tan':
        case 'log':
        case 'sqrt':
        case 'power':
        case 'factorial':
        case 'percent':
            result = calculator[func](current);
            updateHistory(`${func}(${current}) = ${result}`);
            break;
        case 'pi':
            result = Math.PI;
            break;
        case 'ans':
            result = lastAnswer;
            break;
        case 'clear':
            result = '0';
            previousInput = '';
            operation = null;
            // Se eliminan las líneas que borran el historial
            // history = [];
            // historyDisplay.innerHTML = '';
            break;
        case 'exp':
            if (operation === 'exp') {
                // Si ya tenemos una operación exp pendiente, calcularla
                const base = parseFloat(previousInput);
                result = calculator.exp(current, base);
                updateHistory(`${base}^${current} = ${result}`);
                operation = null;
            } else {
                // Preparar para recibir el exponente
                previousInput = currentInput;
                operation = 'exp';
                shouldResetScreen = true;
                updateDisplay();
                return;
            }
            break;
    }

    currentInput = String(result);
    updateDisplay();
    shouldResetScreen = true;
}

// Función auxiliar para manejar la tecla de retroceso (optimizada)
function handleBackspace() {
    // Si estamos esperando un nuevo número después de un operador
    if (shouldResetScreen && operation) {
        operation = null;
        shouldResetScreen = false;
        updateDisplay();
        return;
    }
    
    // Si hay más de un dígito, eliminar el último
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } 
    // Si hay una operación pendiente, cancelarla
    else if (operation) {
        operation = null;
        currentInput = previousInput;
        previousInput = '';
        shouldResetScreen = false;
    } 
    // Si solo queda un dígito, resetear a cero
    else {
        currentInput = '0';
    }
    
    updateDisplay();
}

// Calcular resultado (optimizado con mejor manejo de errores y precisión)
function calculate() {
    // Validar que haya una operación pendiente y no estemos esperando un nuevo número
    if (!operation || shouldResetScreen) return;

    const current = parseFloat(currentInput);
    const prev = parseFloat(previousInput);
    let result;
    
    try {
        // Validar que los operandos sean números válidos y finitos
        if (isNaN(current) || isNaN(prev) || !isFinite(current) || !isFinite(prev)) {
            throw new Error('Operandos inválidos');
        }
        
        // Realizar el cálculo según la operación
        if (operation === 'exp') {
            result = calculator.exp(current, prev);
            updateHistory(`${prev}^${current} = ${result}`);
        } else {
            // Verificar que la operación exista en la calculadora
            if (typeof calculator[operation] !== 'function') {
                throw new Error(`Operación desconocida: ${operation}`);
            }
            result = calculator[operation](prev, current);
            updateHistory(`${prev} ${operation} ${current} = ${result}`);
        }
        
        // Manejar el resultado
        if (result === getTranslation('error', 'error')) {
            currentInput = '0';
            lastAnswer = 0;
        } else {
            // Convertir a string y limitar decimales si es necesario para evitar desbordamientos
            if (typeof result === 'number') {
                if (!Number.isInteger(result) && Math.abs(result) < 1e15) {
                    // Limitar a 12 decimales para números pequeños
                    const resultStr = result.toString();
                    if (resultStr.includes('.') && resultStr.split('.')[1].length > 12) {
                        result = parseFloat(result.toFixed(12));
                    }
                } else if (Math.abs(result) >= 1e15) {
                    // Usar notación científica para números muy grandes
                    result = result.toExponential(6);
                }
                
                // Redondear a cero valores muy cercanos a cero (errores de punto flotante)
                if (Math.abs(result) < 1e-14) {
                    result = 0;
                }
            }
            
            currentInput = String(result);
            lastAnswer = result;
        }
        
        // Resetear estado
        previousInput = '';
        operation = null;
        updateDisplay();
        shouldResetScreen = true;
    } catch (error) {
        currentInput = getTranslation('error', 'error');
        updateDisplay();
        console.error('Error en cálculo:', error);
    }
}

// Manejar eventos de teclado (optimizado con memoización y mejor manejo de eventos)
const keyHandlerCache = {};

function handleKeyboard(event) {
    // Evitar procesamiento múltiple de teclas y eventos de modificadores
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    
    const key = event.key;
    
    // Usar caché para mapeo de teclas a funciones (mejora rendimiento)
    if (!keyHandlerCache.initialized) {
        keyHandlerCache['.'] = () => {
            // Validar que no haya múltiples puntos decimales
            if (!currentInput.includes('.')) {
                inputNumber('.');
            }
        };
        keyHandlerCache['+'] = () => handleOperator('add');
        keyHandlerCache['-'] = () => handleOperator('subtract');
        keyHandlerCache['*'] = () => handleOperator('multiply');
        keyHandlerCache['×'] = () => handleOperator('multiply'); // Soporte para teclado numérico
        keyHandlerCache['/'] = () => handleOperator('divide');
        keyHandlerCache['÷'] = () => handleOperator('divide'); // Soporte para teclado numérico
        keyHandlerCache['%'] = () => handleFunction('percent');
        keyHandlerCache['^'] = () => handleOperator('exp');
        keyHandlerCache['Enter'] = calculate;
        keyHandlerCache['='] = calculate;
        keyHandlerCache['Backspace'] = handleBackspace;
        keyHandlerCache['Delete'] = () => handleFunction('clear'); // Soporte para tecla Delete
        keyHandlerCache['Escape'] = () => handleFunction('clear');
        keyHandlerCache['p'] = () => handleFunction('pi');
        keyHandlerCache['P'] = () => handleFunction('pi');
        keyHandlerCache['a'] = () => handleFunction('ans');
        keyHandlerCache['A'] = () => handleFunction('ans');
        keyHandlerCache['s'] = () => handleFunction('sin');
        keyHandlerCache['S'] = () => handleFunction('sin');
        keyHandlerCache['c'] = () => handleFunction('cos');
        keyHandlerCache['C'] = () => handleFunction('cos');
        keyHandlerCache['t'] = () => handleFunction('tan');
        keyHandlerCache['T'] = () => handleFunction('tan');
        keyHandlerCache['l'] = () => handleFunction('log');
        keyHandlerCache['L'] = () => handleFunction('log');
        keyHandlerCache['r'] = () => handleFunction('sqrt'); // r de raíz
        keyHandlerCache['R'] = () => handleFunction('sqrt');
        keyHandlerCache.initialized = true;
    }
    
    // Prevenir comportamiento predeterminado para teclas que manejamos
    if ((key >= '0' && key <= '9') || keyHandlerCache[key]) {
        event.preventDefault();
    }
    
    // Manejar dígitos con validación adicional
    if (key >= '0' && key <= '9') {
        inputNumber(key);
        return;
    }
    
    // Ejecutar la función correspondiente si existe en caché
    const handler = keyHandlerCache[key];
    if (handler) {
        handler();
    }
}

// Cambiar tema
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    themeToggle.querySelector('.theme-icon').textContent = 
        document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

// Event Listeners
document.addEventListener('keydown', handleKeyboard);
themeToggle.addEventListener('click', toggleTheme);

// Caché para mapeo de acciones a funciones (mejora rendimiento)
const actionHandlersCache = {
    'add': () => handleOperator('add'),
    'subtract': () => handleOperator('subtract'),
    'multiply': () => handleOperator('multiply'),
    'divide': () => handleOperator('divide'),
    'calculate': calculate
};

// Event delegation para botones (optimizado con mejor manejo de errores)
document.querySelector('.keypad').addEventListener('click', (event) => {
    const button = event.target;
    if (!button.matches('.btn')) return;

    try {
        // Efecto visual de pulsación con animación más suave
        button.classList.add('active');
        // Usar requestAnimationFrame para mejor rendimiento visual
        requestAnimationFrame(() => {
            setTimeout(() => {
                button.classList.remove('active');
            }, 150); // Reducido para mejor respuesta
        });

        // Manejar la acción del botón
        const action = button.dataset.action;
        
        // Si no hay acción, es un número
        if (!action) {
            inputNumber(button.textContent.trim());
            return;
        }
        
        // Si la acción está en nuestro mapa, ejecutarla
        if (actionHandlersCache[action]) {
            actionHandlersCache[action]();
        } else {
            // Para otras funciones especiales
            handleFunction(action);
        }
    } catch (error) {
        console.error('Error al procesar clic de botón:', error);
        // Recuperación de errores
        currentInput = '0';
        previousInput = '';
        operation = null;
        updateDisplay();
    }
});

// Inicializar la calculadora con mejor manejo de errores y carga de datos guardados
function initCalculator() {
    try {
        // Cargar historial guardado si existe
        const savedHistory = localStorage.getItem('calculatorHistory');
        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory);
                if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                    history = parsedHistory.slice(0, 10); // Limitar a 10 elementos
                    
                    // Actualizar la visualización del historial
                    const fragment = document.createDocumentFragment();
                    history.forEach(item => {
                        const div = document.createElement('div');
                        div.textContent = item;
                        fragment.appendChild(div);
                    });
                    historyDisplay.innerHTML = '';
                    historyDisplay.appendChild(fragment);
                    historyDisplay.scrollTop = historyDisplay.scrollHeight;
                }
            } catch (e) {
                console.warn('Error al cargar historial guardado:', e);
                // Continuar con historial vacío
                history = [];
            }
        }
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('calculatorTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.querySelector('.theme-icon').textContent = '☀️';
        }
        
        // Inicializar display
        updateDisplay();
        
        console.log('Calculadora inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar calculadora:', error);
        // Asegurar que la calculadora funcione incluso si hay errores
        updateDisplay();
    }
}

// Actualizar función toggleTheme para guardar preferencia
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeToggle.querySelector('.theme-icon').textContent = isDarkMode ? '☀️' : '🌙';
    
    // Guardar preferencia
    try {
        localStorage.setItem('calculatorTheme', isDarkMode ? 'dark' : 'light');
    } catch (e) {
        console.warn('No se pudo guardar preferencia de tema');
    }
}

// Iniciar la calculadora cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initCalculator);