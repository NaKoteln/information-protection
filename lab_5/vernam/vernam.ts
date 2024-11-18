// модуль readline для работы с пользовательским вводом в командной строке.
import * as readline from 'readline';

/**
 * Класс VernamCipher реализует алгоритм шифрования Вернама
 * и поддерживает два метода шифрования: сдвиг по алфавиту и XOR.
 */
class VernamCipher {
    private alphabetMap: Map<string, number> = new Map(); // Карта символов в алфавите к индексам.
    private reverseAlphabetMap: Map<number, string> = new Map(); // Обратная карта индексов к символам.

    /**
     * Конструктор для инициализации алфавита и создания карт для кодирования и декодирования.
     * alphabet - Строка, содержащая все возможные символы для шифрования.
     */
    constructor(alphabet: string) {
        // Создание карт для кодирования и декодирования
        for (let i = 0; i < alphabet.length; i++) {
            this.alphabetMap.set(alphabet[i], i);
            this.reverseAlphabetMap.set(i, alphabet[i]);
        }
    }

    /**
     * Метод для шифрования/дешифрования текста с использованием сдвига по алфавиту.
     * input - Входной текст для шифрования/дешифрования.
     * key - Ключ для шифрования.
     * isEncrypt - Флаг, указывающий на операцию шифрования (true) или дешифрования (false).
     */
    encodeWithShift(input: string, key: string, isEncrypt: boolean): string {
        const keyChars = key.split('');
        const inputChars = input.split('');
        const result: string[] = []; // Массив для хранения результата.

        for (let i = 0; i < inputChars.length; i++) {
            const char = inputChars[i];
            const keyChar = keyChars[i % keyChars.length];

            const inputIndex = this.alphabetMap.get(char); 
            const keyIndex = this.alphabetMap.get(keyChar); 

            if (inputIndex !== undefined && keyIndex !== undefined) {
                const operation = isEncrypt ? 1 : -1; // В зависимости от операции (шифрование или дешифрование) определяем направление сдвига.
                const newIndex = (this.alphabetMap.size + inputIndex + operation * keyIndex) % this.alphabetMap.size;
                result.push(this.reverseAlphabetMap.get(newIndex) ?? '');
            }
        }

        return result.join('');
    }

    /**
     * Метод для шифрования/дешифрования текста с использованием операции XOR.
     * input - Входной текст для шифрования/дешифрования.
     * key - Ключ для шифрования.
     */
    encodeWithXor(input: string, key: string): string {
        const keyChars = key.split('');
        const inputChars = input.split('');
        const result: string[] = [];

        for (let i = 0; i < inputChars.length; i++) {
            const char = inputChars[i];
            const keyChar = keyChars[i % keyChars.length];

            const inputIndex = this.alphabetMap.get(char);
            const keyIndex = this.alphabetMap.get(keyChar); 

            if (inputIndex !== undefined && keyIndex !== undefined) {
                const newIndex = (inputIndex ^ keyIndex) % this.alphabetMap.size; // Применяем операцию XOR.
                result.push(this.reverseAlphabetMap.get(newIndex) ?? '');
            }
        }

        return result.join('');
    }
}

/**
 * Функция для тестирования алгоритма шифрования.
 */
function runTests() {
    console.log('*** Результаты тестов ***\n');

    // Тест 1: Шифрование и дешифрование с использованием сдвига по алфавиту.
    const cipher1 = new VernamCipher('abcdefghijklmnopqrstuvwxyz ');
    const input1 = 'hello world';
    const key1 = 'key';
    const encrypted1 = cipher1.encodeWithShift(input1, key1, true);
    const decrypted1 = cipher1.encodeWithShift(encrypted1, key1, false);
    console.log('Тест 1: Шифрование с использованием сдвига (+)');
    console.log('\tИсходный текст:', input1);
    console.log('\tКлюч:', key1);
    console.log('\tЗашифрованный текст:', encrypted1);
    console.log('\tРасшифрованный текст:', decrypted1);

    // Тест 2: Шифрование и дешифрование с использованием XOR.
    const cipher2 = new VernamCipher('абвгдежзийклмнопрстуфхцчшщыьэюя ');
    const input2 = 'привет мир';
    const key2 = 'ключ';
    const encrypted2 = cipher2.encodeWithXor(input2, key2);
    const decrypted2 = cipher2.encodeWithXor(encrypted2, key2);
    console.log('\nТест 2: Шифрование с использованием XOR');
    console.log('\tИсходный текст:', input2);
    console.log('\tКлюч:', key2);
    console.log('\tЗашифрованный текст:', encrypted2);
    console.log('\tРасшифрованный текст:', decrypted2);

    console.log('\n*** Завершение тестов ***\n');
}

/**
 * Функция для запуска интерфейса шифрования с пользователем.
 */
async function runCipherInterface() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query: string): Promise<string> =>
        new Promise(resolve => rl.question(query, resolve));

    console.log('*** Программа шифрования ***');
    console.log('Для выхода введите команду "exit".');

    while (true) {
        // Запрос на ввод алфавита.
        const alphabet = await question('\nВведите алфавит (или "exit" для выхода): ');
        if (alphabet.toLowerCase() === 'exit') break;

        // Запрос на ввод текста для шифрования.
        const text = await question('Введите текст для шифрования (или "exit" для выхода): ');
        if (text.toLowerCase() === 'exit') break;

        // Запрос на ввод ключа.
        const key = await question('Введите ключ (или "exit" для выхода): ');
        if (key.toLowerCase() === 'exit') break;

        // Создаем объект для шифрования с введенным алфавитом.
        const cipher = new VernamCipher(alphabet);

        // Запрос на выбор метода шифрования.
        console.log('Выберите метод шифрования:');
        console.log('1. Сдвиг (+)');
        console.log('2. XOR');
        const choice = await question('Ваш выбор (1/2): ');

        if (choice === '1') {
            // Шифрование с использованием сдвига.
            const encrypted = cipher.encodeWithShift(text, key, true);
            const decrypted = cipher.encodeWithShift(encrypted, key, false);
            console.log('\nРезультаты шифрования (сдвиг):');
            console.log('\tЗашифрованный текст:', encrypted);
            console.log('\tРасшифрованный текст:', decrypted);
        } else if (choice === '2') {
            // Шифрование с использованием XOR.
            const encrypted = cipher.encodeWithXor(text, key);
            const decrypted = cipher.encodeWithXor(encrypted, key);
            console.log('\nРезультаты шифрования (XOR):');
            console.log('\tЗашифрованный текст:', encrypted);
            console.log('\tРасшифрованный текст:', decrypted);
        } else {
            console.log('Некорректный выбор, попробуйте снова.');
        }
    }

    console.log('*** Завершение работы программы ***');
    rl.close();
}

/**
 * Главная функция, которая запускает тесты и интерфейс шифрования.
 */
async function main() {
    runTests();
    await runCipherInterface();
}

// Запуск программы.
main();
