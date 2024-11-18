// Размер блока для обработки данных (8 байт = 64 бита)
var BLOCK_SIZE = 8;
// Количество раундов для шифрования TEA
var ROUNDS = 32;
// Константа DELTA в алгоритме TEA
var DELTA = 0x9E3779B9;
/**
 * Основная функция хеширования, использует TEA для обработки данных и возвращает хеш-строку, представленную в формате hex.
 * input - входная строка для хеширования
 * key - ключ для шифрования (Buffer)
 */
function hash(input, key) {
    // Преобразование строки в буфер
    var inputData = Buffer.from(input, 'utf-8');
    var outputData = [];
    // Входные данные делятся на блоки размером BLOCK_SIZE
    for (var i = 0; i < inputData.length; i += BLOCK_SIZE) {
        var block = inputData.slice(i, i + BLOCK_SIZE);
        var paddedBlock = block;
        // Если блок меньше BLOCK_SIZE, дополнение до нужного размера
        if (block.length < BLOCK_SIZE) {
            paddedBlock = addPadding(block);
        }
        // Применение TEA к каждому блоку для получения хешированного блока
        var hashedBlock = applyTEA(paddedBlock, key);
        // Добавление хешированного блока в результирующий массив
        outputData.push(hashedBlock);
    }
    // Результат в виде hex строки
    return outputData.map(function (b) { return b.toString('hex'); }).join('');
}
/**
 * Функция для дополнения блока до нужного размера
 * block - входной блок данных
 */
function addPadding(block) {
    var padded = Buffer.alloc(BLOCK_SIZE);
    block.copy(padded, 0);
    return padded;
}
/**
 * Применение алгоритма TEA для шифрования блока данных
 * block - блок данных для шифрования
 * key - ключ для шифрования
 */
function applyTEA(block, key) {
    var keyParts = getKeyParts(key);
    var textBlockParts = divideTextBlock(block);
    var sum = 0;
    // Выполнения 32-х раундов шифрования TEA
    for (var i = 0; i < ROUNDS; i++) {
        sum += DELTA; // Увеличиваем сумму на DELTA каждый раунд
        // Операция шифрования для первой части блока
        textBlockParts[0] = (textBlockParts[0] + (((textBlockParts[1] << 4) + keyParts[0]) ^ (textBlockParts[1] + sum) ^ ((textBlockParts[1] >>> 5) + keyParts[1]))) >>> 0;
        // Операция шифрования для второй части блока
        textBlockParts[1] = (textBlockParts[1] + (((textBlockParts[0] << 4) + keyParts[2]) ^ (textBlockParts[0] + sum) ^ ((textBlockParts[0] >>> 5) + keyParts[3]))) >>> 0;
    }
    // Преобразования полученных частей блока обратно в байты
    return Buffer.from(intArrayToByteArray(textBlockParts));
}
/**
 * Делим 16-байтовый ключ на 4 части по 32 бита.
 */
function getKeyParts(key) {
    return [
        key.readUInt32BE(0),
        key.readUInt32BE(4),
        key.readUInt32BE(8),
        key.readUInt32BE(12)
    ];
}
/**
 * Разделяем 8-байтовый блок данных на 2 части по 32 бита.
 */
function divideTextBlock(block) {
    return [
        block.readUInt32BE(0),
        block.readUInt32BE(4)
    ];
}
/**
 * Преобразование массива целых чисел в массив байтов.
 * intArray - Массив целых чисел (32-битных)
 */
function intArrayToByteArray(intArray) {
    var buffer = Buffer.alloc(8);
    for (var i = 0; i < intArray.length; i++) {
        var value = intArray[i];
        if (value < 0 || value > 4294967295) {
            throw new Error("Value out of range: ".concat(value)); // Проверка на диапазон значений
        }
        buffer.writeUInt32BE(value >>> 0, i * 4);
    }
    // Возврат массива байтов из буфера
    return Array.from(buffer);
}
// Пример входных данных для хеширования
var inputText = "Тестовое сообщение";
// Пример ключа для шифрования
var key = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
// Получаем хеш строки с помощью функции hash
var hashed = hash(inputText, key);
// Выводим результат хеширования
console.log("Хеш:", hashed);
