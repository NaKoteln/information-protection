// Размер блока данных, который обрабатывается за один раз (8 байт)
const BLOCK_SIZE = 8;
// Количество раундов для шифрования TEA
const TEA_ROUNDS = 32;
// DELTA для TEA, основанное на текущем времени
const TEA_DELTA = Date.now() & 0xFFFFFFFF;
// Начальная сумма для дешифрования (генерируется случайно для каждой сессии)
const DECRYPTION_START_SUM = Math.floor(Math.random() * 0xFFFFFFFF);

/**
 * Функция для шифрования строки с использованием алгоритма TEA в режиме потока.
 * input - входная строка для шифрования
 * key - ключ для шифрования (Buffer)
 * Возвращается зашифрованная строка в hex формате.
 */
function encrypt(input: string, key: Buffer): string {
  // Преобразуем входные данные в буфер
  const dataBuffer = Buffer.from(input, 'utf-8');
  const encryptedBlocks: Buffer[] = [];
  const nonce = Buffer.alloc(8); // Инициализация nonce (можно использовать случайное значение)
  let blockIndex = 0;

  // Процесс шифрования каждого блока
  for (let i = 0; i < dataBuffer.length; i += BLOCK_SIZE) {
    let currentBlock = dataBuffer.slice(i, i + BLOCK_SIZE);

    // Если блок данных меньше BLOCK_SIZE, нужно дополнить его
    if (currentBlock.length < BLOCK_SIZE) {
      currentBlock = padBlock(currentBlock);
    }

    // Генерация ключевого потока с использованием nonce и индекса блока
    const keyStream = generateKeyStream(key, nonce, blockIndex);
    blockIndex++;

    // XOR с ключевым потоком для получения зашифрованного блока
    const encryptedBlock = xorBlocks(currentBlock, keyStream);
    encryptedBlocks.push(encryptedBlock);
  }

  // Возвращаем зашифрованные данные в формате hex
  return encryptedBlocks.map(b => b.toString('hex')).join('');
}

/**
 * Функция для дешифрования строки, зашифрованной с использованием алгоритма TEA.
 * encryptedHex - зашифрованная строка в hex формате
 * key - ключ для дешифрования
 */
function decrypt(encryptedHex: string, key: Buffer): string {
  // Преобразуем строку в hex обратно в буфер
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
  const decryptedBlocks: Buffer[] = [];
  const nonce = Buffer.alloc(8);
  let blockIndex = 0;

  // Дешифровка каждого блока
  for (let i = 0; i < encryptedBuffer.length; i += BLOCK_SIZE) {
    const currentBlock = encryptedBuffer.slice(i, i + BLOCK_SIZE);

    // Генерация ключевого потока с использованием nonce и индекса блока
    const keyStream = generateKeyStream(key, nonce, blockIndex);
    blockIndex++;

    // XOR с ключевым потоком для получения расшифрованного блока
    const decryptedBlock = xorBlocks(currentBlock, keyStream);
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
function generateKeyStream(key: Buffer, nonce: Buffer, blockIndex: number): Buffer {
  // Разделяем ключ на 4 32-битных части
  const keyParts = extractKeyParts(key);
  const counterBlock = Buffer.alloc(8);

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
function xorBlocks(block: Buffer, keyStream: Buffer): Buffer {
  const result = Buffer.alloc(block.length);
  for (let i = 0; i < block.length; i++) {
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
function encryptBlock(keyParts: number[], block: Buffer): Buffer {
  // Разделяем блок на две части
  const blockParts = splitBlock(block);
  let sum = 0;

  // Применяем 32 раунда шифрования
  for (let i = 0; i < TEA_ROUNDS; i++) {
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
function extractKeyParts(key: Buffer): number[] {
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
function splitBlock(block: Buffer): number[] {
  return [
    block.readUInt32BE(0),
    block.readUInt32BE(4) 
  ];
}

/**
 * Преобразует массив целых чисел в буфер байтов
 * intArray - массив целых чисел
 */
function intArrayToBuffer(intArray: number[]): number[] {
  const buffer = Buffer.alloc(8);
  for (let i = 0; i < intArray.length; i++) {
    buffer.writeUInt32BE(intArray[i] >>> 0, i * 4);
  }
  return Array.from(buffer);
}

/**
 * Дополняет блок данных до нужного размера BLOCK_SIZE, если он меньше
 * block - входной блок данных
 */
function padBlock(block: Buffer): Buffer {
  const padded = Buffer.alloc(BLOCK_SIZE, 0x00); // Дополняем нулями
  block.copy(padded, 0);
  return padded;
}

// Пример входных данных для шифрования и дешифрования
const message = 'Тестовое сообщение';
// Пример ключа для шифрования
const key = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');

// Шифруем сообщение
const encryptedMessage = encrypt(message, key);
console.log("Зашифрованное сообщение (hex):", encryptedMessage);

// Дешифруем сообщение
const decryptedMessage = decrypt(encryptedMessage, key);
console.log("Расшифрованное сообщение:", decryptedMessage);
