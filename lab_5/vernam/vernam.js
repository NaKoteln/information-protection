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
// модуль readline для работы с пользовательским вводом в командной строке.
var readline = require("readline");
/**
 * Класс VernamCipher реализует алгоритм шифрования Вернама
 * и поддерживает два метода шифрования: сдвиг по алфавиту и XOR.
 */
var VernamCipher = /** @class */ (function () {
    /**
     * Конструктор для инициализации алфавита и создания карт для кодирования и декодирования.
     * alphabet - Строка, содержащая все возможные символы для шифрования.
     */
    function VernamCipher(alphabet) {
        this.alphabetMap = new Map(); // Карта символов в алфавите к индексам.
        this.reverseAlphabetMap = new Map(); // Обратная карта индексов к символам.
        // Создание карт для кодирования и декодирования
        for (var i = 0; i < alphabet.length; i++) {
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
    VernamCipher.prototype.encodeWithShift = function (input, key, isEncrypt) {
        var _a;
        var keyChars = key.split('');
        var inputChars = input.split('');
        var result = []; // Массив для хранения результата.
        for (var i = 0; i < inputChars.length; i++) {
            var char = inputChars[i];
            var keyChar = keyChars[i % keyChars.length];
            var inputIndex = this.alphabetMap.get(char);
            var keyIndex = this.alphabetMap.get(keyChar);
            if (inputIndex !== undefined && keyIndex !== undefined) {
                var operation = isEncrypt ? 1 : -1; // В зависимости от операции (шифрование или дешифрование) определяем направление сдвига.
                var newIndex = (this.alphabetMap.size + inputIndex + operation * keyIndex) % this.alphabetMap.size;
                result.push((_a = this.reverseAlphabetMap.get(newIndex)) !== null && _a !== void 0 ? _a : '');
            }
        }
        return result.join('');
    };
    /**
     * Метод для шифрования/дешифрования текста с использованием операции XOR.
     * input - Входной текст для шифрования/дешифрования.
     * key - Ключ для шифрования.
     */
    VernamCipher.prototype.encodeWithXor = function (input, key) {
        var _a;
        var keyChars = key.split('');
        var inputChars = input.split('');
        var result = [];
        for (var i = 0; i < inputChars.length; i++) {
            var char = inputChars[i];
            var keyChar = keyChars[i % keyChars.length];
            var inputIndex = this.alphabetMap.get(char);
            var keyIndex = this.alphabetMap.get(keyChar);
            if (inputIndex !== undefined && keyIndex !== undefined) {
                var newIndex = (inputIndex ^ keyIndex) % this.alphabetMap.size; // Применяем операцию XOR.
                result.push((_a = this.reverseAlphabetMap.get(newIndex)) !== null && _a !== void 0 ? _a : '');
            }
        }
        return result.join('');
    };
    return VernamCipher;
}());
/**
 * Функция для тестирования алгоритма шифрования.
 */
function runTests() {
    console.log('*** Результаты тестов ***\n');
    // Тест 1: Шифрование и дешифрование с использованием сдвига по алфавиту.
    var cipher1 = new VernamCipher('abcdefghijklmnopqrstuvwxyz ');
    var input1 = 'hello world';
    var key1 = 'key';
    var encrypted1 = cipher1.encodeWithShift(input1, key1, true);
    var decrypted1 = cipher1.encodeWithShift(encrypted1, key1, false);
    console.log('Тест 1: Шифрование с использованием сдвига (+)');
    console.log('\tИсходный текст:', input1);
    console.log('\tКлюч:', key1);
    console.log('\tЗашифрованный текст:', encrypted1);
    console.log('\tРасшифрованный текст:', decrypted1);
    // Тест 2: Шифрование и дешифрование с использованием XOR.
    var cipher2 = new VernamCipher('абвгдежзийклмнопрстуфхцчшщыьэюя ');
    var input2 = 'привет мир';
    var key2 = 'ключ';
    var encrypted2 = cipher2.encodeWithXor(input2, key2);
    var decrypted2 = cipher2.encodeWithXor(encrypted2, key2);
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
function runCipherInterface() {
    return __awaiter(this, void 0, void 0, function () {
        var rl, question, alphabet, text, key, cipher, choice, encrypted, decrypted, encrypted, decrypted;
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
                    console.log('*** Программа шифрования ***');
                    console.log('Для выхода введите команду "exit".');
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 6];
                    return [4 /*yield*/, question('\nВведите алфавит (или "exit" для выхода): ')];
                case 2:
                    alphabet = _a.sent();
                    if (alphabet.toLowerCase() === 'exit')
                        return [3 /*break*/, 6];
                    return [4 /*yield*/, question('Введите текст для шифрования (или "exit" для выхода): ')];
                case 3:
                    text = _a.sent();
                    if (text.toLowerCase() === 'exit')
                        return [3 /*break*/, 6];
                    return [4 /*yield*/, question('Введите ключ (или "exit" для выхода): ')];
                case 4:
                    key = _a.sent();
                    if (key.toLowerCase() === 'exit')
                        return [3 /*break*/, 6];
                    cipher = new VernamCipher(alphabet);
                    // Запрос на выбор метода шифрования.
                    console.log('Выберите метод шифрования:');
                    console.log('1. Сдвиг (+)');
                    console.log('2. XOR');
                    return [4 /*yield*/, question('Ваш выбор (1/2): ')];
                case 5:
                    choice = _a.sent();
                    if (choice === '1') {
                        encrypted = cipher.encodeWithShift(text, key, true);
                        decrypted = cipher.encodeWithShift(encrypted, key, false);
                        console.log('\nРезультаты шифрования (сдвиг):');
                        console.log('\tЗашифрованный текст:', encrypted);
                        console.log('\tРасшифрованный текст:', decrypted);
                    }
                    else if (choice === '2') {
                        encrypted = cipher.encodeWithXor(text, key);
                        decrypted = cipher.encodeWithXor(encrypted, key);
                        console.log('\nРезультаты шифрования (XOR):');
                        console.log('\tЗашифрованный текст:', encrypted);
                        console.log('\tРасшифрованный текст:', decrypted);
                    }
                    else {
                        console.log('Некорректный выбор, попробуйте снова.');
                    }
                    return [3 /*break*/, 1];
                case 6:
                    console.log('*** Завершение работы программы ***');
                    rl.close();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Главная функция, которая запускает тесты и интерфейс шифрования.
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    runTests();
                    return [4 /*yield*/, runCipherInterface()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Запуск программы.
main();
