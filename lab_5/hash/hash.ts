import * as readline from 'readline';

// Размер блока для обработки данных (8 байт = 64 бита)
const BLOCK_SIZE = 8;
// Количество раундов для шифрования TEA
const ROUNDS = 32;
// Константа DELTA в алгоритме TEA
const DELTA = 0x9E3779B9;

/**
 * Основная функция хеширования, использует TEA для обработки данных и возвращает хеш-строку, представленную в формате hex.
 * input - входная строка для хеширования
 * key - ключ для шифрования (Buffer)
 */
function hash(input: string, key: Buffer): string {
  // Преобразование строки в буфер
  const inputData = Buffer.from(input, 'utf-8');
  const outputData: Buffer[] = [];

  // Входные данные делятся на блоки размером BLOCK_SIZE
  for (let i = 0; i < inputData.length; i += BLOCK_SIZE) {
    const block = inputData.slice(i, i + BLOCK_SIZE);

    let paddedBlock = block;
    // Если блок меньше BLOCK_SIZE, дополнение до нужного размера
    if (block.length < BLOCK_SIZE) {
      paddedBlock = addPadding(block);
    }

    // Применение TEA к каждому блоку для получения хешированного блока
    const hashedBlock = applyTEA(paddedBlock, key);
    // Добавление хешированного блока в результирующий массив
    outputData.push(hashedBlock);
  }

  // Результат в виде hex строки
  return outputData.map(b => b.toString('hex')).join('');
}

/**
 * Функция для дополнения блока до нужного размера
 * block - входной блок данных
 */
function addPadding(block: Buffer): Buffer {
  const padded = Buffer.alloc(BLOCK_SIZE);
  block.copy(padded, 0);
  return padded;
}

/**
 * Применение алгоритма TEA для шифрования блока данных
 * block - блок данных для шифрования
 * key - ключ для шифрования
 */
function applyTEA(block: Buffer, key: Buffer): Buffer {
  const keyParts = extractKeyParts(key);
  const textBlockParts = splitBlock(block);

  let sum = 0;
  // Выполнения 32-х раундов шифрования TEA
  for (let i = 0; i < ROUNDS; i++) {
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
function extractKeyParts(key: Buffer): number[] {
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
function splitBlock(block: Buffer): number[] {
  return [
    block.readUInt32BE(0),
    block.readUInt32BE(4) 
  ];
}

/**
 * Преобразование массива целых чисел в массив байтов.
 * intArray - Массив целых чисел (32-битных)
 */
function intArrayToByteArray(intArray: number[]): number[] {
  const buffer = Buffer.alloc(8);

  for (let i = 0; i < intArray.length; i++) {
    const value = intArray[i];
    if (value < 0 || value > 4294967295) {
      throw new Error(`Value out of range: ${value}`); // Проверка на диапазон значений
    }
    buffer.writeUInt32BE(value >>> 0, i * 4);
  }

  // Возврат массива байтов из буфера
  return Array.from(buffer);
}

// Запуск тестов
function runTests() {
  const inputText = "Тестовое сообщение";
  const key = Buffer.from('0123456789ABCDEF0123456789ABCDEF', 'hex');

  console.log("\n*** Тестовые данные ***");
  const hashedOriginal = hash(inputText, key);
  console.log("Исходный текст:", inputText);
  console.log("Исходный хеш:", hashedOriginal);

  const alteredText = "Тестовый сообщение";
  const hashedAlteredText = hash(alteredText, key);
  console.log("\nИзменённый текст:", alteredText);
  console.log("Хеш изменённого текста:", hashedAlteredText);

  const alteredKey = Buffer.from('0123456789ABCDEF0123456789ABCDEE', 'hex');
  const hashedAlteredKey = hash(inputText, alteredKey);
  console.log("\nИзменённый ключ:", alteredKey.toString('hex'));
  console.log("Хеш с изменённым ключом:", hashedAlteredKey);
}

// Взаимодействие с пользвателем
function userInteraction() {
  console.log("\n*** Ввод от пользователя ***");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function askForInput() {
    rl.question("\nВведите строку для хеширования (или 'exit' для выхода): ", (inputText) => {
      if (inputText.toLowerCase() === 'exit') {
        console.log("Выход из программы.");
        rl.close();
        return;
      }

      rl.question("Введите ключ (в формате hex, 16 байт, или 'exit' для выхода): ", (keyHex) => {
        if (keyHex.toLowerCase() === 'exit') {
          console.log("Выход из программы.");
          rl.close();
          return;
        }

        try {
          const key = Buffer.from(keyHex, 'hex');
          if (key.length !== 16) {
            throw new Error("Ключ должен быть длиной 16 байт!");
          }

          const hashed = hash(inputText, key);
          console.log("\nХеш введённой строки:", hashed);
        } catch (err) {
          console.error("Ошибка:", err.message);
        } finally {
          askForInput(); // Повторяем запрос после завершения текущего.
        }
      });
    });
  }

  askForInput();
}

runTests();
userInteraction();