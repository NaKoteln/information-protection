"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var readline = require("readline");
// Размер блока данных, который обрабатывается за один раз (8 байт)
var BLOCK_SIZE = 8;
// Количество раундов для шифрования TEA
var TEA_ROUNDS = 32;
// DELTA для TEA, основанное на текущем времени
var TEA_DELTA = Date.now() & 0xFFFFFFFF;
// Начальная сумма для дешифрования (генерируется случайно для каждой сессии)
var DECRYPTION_START_SUM = Math.floor(Math.random() * 0xFFFFFFFF);
/**
 * Функция для шифрования строки с использованием алгоритма TEA в режиме потока.
 * input - входная строка для шифрования
 * key - ключ для шифрования (Buffer)
 * Возвращается зашифрованная строка в hex формате.
 */
function encrypt(input, key) {
    // Преобразуем входные данные в буфер
    var dataBuffer = Buffer.from(input, 'utf-8');
    var encryptedBlocks = [];
    var nonce = Buffer.alloc(8); // Инициализация nonce (можно использовать случайное значение)
    var blockIndex = 0;
    // Процесс шифрования каждого блока
    for (var i = 0; i < dataBuffer.length; i += BLOCK_SIZE) {
        var currentBlock = dataBuffer.slice(i, i + BLOCK_SIZE);
        // Если блок данных меньше BLOCK_SIZE, нужно дополнить его
        if (currentBlock.length < BLOCK_SIZE) {
            currentBlock = padBlock(currentBlock);
        }
        // Генерация ключевого потока с использованием nonce и индекса блока
        var keyStream = generateKeyStream(key, nonce, blockIndex);
        blockIndex++;
        // XOR с ключевым потоком для получения зашифрованного блока
        var encryptedBlock = xorBlocks(currentBlock, keyStream);
        encryptedBlocks.push(encryptedBlock);
    }
    // Возвращаем зашифрованные данные в формате hex
    return encryptedBlocks.map(function (b) { return b.toString('hex'); }).join('');
}
/**
 * Функция для дешифрования строки, зашифрованной с использованием алгоритма TEA.
 * encryptedHex - зашифрованная строка в hex формате
 * key - ключ для дешифрования
 */
function decrypt(encryptedHex, key) {
    // Преобразуем строку в hex обратно в буфер
    var encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    var decryptedBlocks = [];
    var nonce = Buffer.alloc(8);
    var blockIndex = 0;
    // Дешифровка каждого блока
    for (var i = 0; i < encryptedBuffer.length; i += BLOCK_SIZE) {
        var currentBlock = encryptedBuffer.slice(i, i + BLOCK_SIZE);
        // Генерация ключевого потока с использованием nonce и индекса блока
        var keyStream = generateKeyStream(key, nonce, blockIndex);
        blockIndex++;
        // XOR с ключевым потоком для получения расшифрованного блока
        var decryptedBlock = xorBlocks(currentBlock, keyStream);
        decryptedBlocks.push(decryptedBlock);
    }
    // Возвращаем расшифрованную строку
    return Buffer.concat(decryptedBlocks).toString('utf-8');
}
/**
 * Генерация ключевого потока для текущего блока данных на основе nonce и индекса блока.
 * key - ключ для шифрования
 * nonce - случайный блок (или счетчик)
 * blockIndex - индекс текущего блока данных
 */
function generateKeyStream(key, nonce, blockIndex) {
    // Разделяем ключ на 4 32-битных части
    var keyParts = extractKeyParts(key);
    var counterBlock = Buffer.alloc(8);
    // Записываем nonce в начало блока
    nonce.copy(counterBlock, 0, 0, nonce.length);
    // Добавляем индекс блока в старшие 4 байта счетчика
    counterBlock.writeUInt32BE(blockIndex, 4);
    // Шифруем счетчик с помощью TEA
    return encryptBlock(keyParts, counterBlock);
}
/**
 * Применение операции XOR к двум блокам данных
 * block - исходный блок данных
 * keyStream - ключевой поток для шифрования или дешифрования
 */
function xorBlocks(block, keyStream) {
    var result = Buffer.alloc(block.length);
    for (var i = 0; i < block.length; i++) {
        // XOR каждого байта блока с соответствующим байтом ключевого потока
        result[i] = block[i] ^ keyStream[i];
    }
    return result;
}
/**
 * Шифрование блока с использованием алгоритма TEA
 * keyParts - 4 части ключа, полученные из исходного ключа
 * block - 8-байтовый блок данных для шифрования
 */
function encryptBlock(keyParts, block) {
    // Разделяем блок на две части
    var blockParts = splitBlock(block);
    var sum = 0;
    // Применяем 32 раунда шифрования
    for (var i = 0; i < TEA_ROUNDS; i++) {
        sum += TEA_DELTA; // Обновляем сумму с учетом DELTA
        blockParts[0] = (blockParts[0] + (((blockParts[1] << 4) + keyParts[0]) ^ (blockParts[1] + sum) ^ ((blockParts[1] >>> 5) + keyParts[1]))) >>> 0;
        blockParts[1] = (blockParts[1] + (((blockParts[0] << 4) + keyParts[2]) ^ (blockParts[0] + sum) ^ ((blockParts[0] >>> 5) + keyParts[3]))) >>> 0;
    }
    // Преобразуем шифрованные блоки обратно в буфер
    return Buffer.from(intArrayToBuffer(blockParts));
}
/**
 * Разделяет ключ (16 байт) на 4 части по 32 бита
 * key - 16-байтовый ключ
 */
function extractKeyParts(key) {
    return [
        key.readUInt32BE(0),
        key.readUInt32BE(4),
        key.readUInt32BE(8),
        key.readUInt32BE(12)
    ];
}
/**
 * Разделяет 8-байтовый блок данных на две части по 32 бита
 * block - 8-байтовый блок данных
 */
function splitBlock(block) {
    return [
        block.readUInt32BE(0),
        block.readUInt32BE(4)
    ];
}
/**
 * Преобразует массив целых чисел в буфер байтов
 * intArray - массив целых чисел
 */
function intArrayToBuffer(intArray) {
    var buffer = Buffer.alloc(8);
    for (var i = 0; i < intArray.length; i++) {
        buffer.writeUInt32BE(intArray[i] >>> 0, i * 4);
    }
    return Array.from(buffer);
}
/**
 * Дополняет блок данных до нужного размера BLOCK_SIZE, если он меньше
 * block - входной блок данных
 */
function padBlock(block) {
    var padded = Buffer.alloc(BLOCK_SIZE, 0x00); // Дополняем нулями
    block.copy(padded, 0);
    return padded;
}
/**
 * Запуск тестового примера.
 */
function runTests() {
    console.log('*** Тест алгоритма TEA ***');
    var message = 'Тестовое сообщение';
    var key = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
    console.log('\nИсходное сообщение:', message);
    console.log('Ключ:', key.toString('hex'));
    // Шифрование
    var encryptedMessage = encrypt(message, key);
    console.log('Зашифрованное сообщение (hex):', encryptedMessage);
    // Дешифрование
    var decryptedMessage = decrypt(encryptedMessage, key);
    console.log('Расшифрованное сообщение:', decryptedMessage);
    console.log('*** Завершение тестов ***\n');
}
/**
* Интерфейс взаимодействия с пользователем для шифрования и дешифрования.
*/
function runCipherInterface() {
    return __awaiter(this, void 0, void 0, function () {
        var rl, question, message, keyInput, key, encryptedMessage, decryptedMessage, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rl = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout
                    });
                    question = function (query) {
                        return new Promise(function (resolve) { return rl.question(query, resolve); });
                    };
                    console.log('*** TEA Шифратор/Дешифратор ***');
                    console.log('Для выхода введите команду "exit".\n');
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, question('Введите сообщение для шифрования (или "exit" для выхода): ')];
                case 3:
                    message = _a.sent();
                    if (message.toLowerCase() === 'exit')
                        return [3 /*break*/, 7];
                    return [4 /*yield*/, question('Введите 16-байтовый ключ (в hex формате, или "exit" для выхода): ')];
                case 4:
                    keyInput = _a.sent();
                    if (keyInput.toLowerCase() === 'exit')
                        return [3 /*break*/, 7];
                    if (keyInput.length !== 32) {
                        console.log('Ошибка: ключ должен быть 16 байт (32 символа в hex формате). Попробуйте снова.\n');
                        return [3 /*break*/, 1];
                    }
                    key = Buffer.from(keyInput, 'hex');
                    encryptedMessage = encrypt(message, key);
                    console.log('Зашифрованное сообщение (hex):', encryptedMessage);
                    decryptedMessage = decrypt(encryptedMessage, key);
                    console.log('Расшифрованное сообщение:', decryptedMessage, '\n');
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('Произошла ошибка:', error_1.message);
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 1];
                case 7:
                    console.log('*** Завершение работы программы ***');
                    rl.close();
                    return [2 /*return*/];
            }
        });
    });
}
/**
* Основная функция программы.
* Сначала выполняются тесты, затем запускается пользовательский интерфейс.
*/
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    runTests(); // Запуск тестов
                    return [4 /*yield*/, runCipherInterface()];
                case 1:
                    _a.sent(); // Запуск пользовательского интерфейса
                    return [2 /*return*/];
            }
        });
    });
}
// Запуск программы
main();
