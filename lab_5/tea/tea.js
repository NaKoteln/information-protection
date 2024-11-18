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
// Пример входных данных для шифрования и дешифрования
var message = 'Тестовое сообщение';
// Пример ключа для шифрования
var key = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');
// Шифруем сообщение
var encryptedMessage = encrypt(message, key);
console.log("Зашифрованное сообщение (hex):", encryptedMessage);
// Дешифруем сообщение
var decryptedMessage = decrypt(encryptedMessage, key);
console.log("Расшифрованное сообщение:", decryptedMessage);
