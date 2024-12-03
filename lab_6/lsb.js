const fs = require('fs');  // Модуль для работы с файловой системой
const { PNG } = require('pngjs');  // Модуль для работы с PNG-изображениями
const path = require('path');  // Модуль для работы с путями файлов
const readline = require('readline'); // Модуль для ввода с клавиатуры

// Пути к исходному и выходному изображениям
const originalImagePath = path.resolve(__dirname, 'test.png');
const outputImagePath = path.resolve(__dirname, 'test_output.png');
// Ключ, который указывает на конец скрытого сообщения
const endMarker = 'secret_key';

// Создаем интерфейс для ввода с клавиатуры
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('Program started...');
console.log('Enter data to hide:');

// Запрашиваем у пользователя ввод скрытого сообщения
rl.question('Enter your secret message: ', (secretMessage) => {
    console.log('Encoding process begins...');
    
    // Функция кодирования изображения с добавлением скрытого сообщения
    encodeImageToPNG(originalImagePath, secretMessage, outputImagePath, endMarker).then(() => {
        console.log('Encoding completed.');

        console.log('Decoding process begins...');
        // Функция декодирования изображения для извлечения скрытого сообщения
        decodeImageFromPNG(outputImagePath, endMarker).then(retrievedMessage => {
            console.log('Decoded message:');
            console.log(retrievedMessage);
        }).catch(err => {
            console.error('Error during decoding:', err.message);
        });
    }).catch(err => {
        console.error('Error during encoding:', err.message);
    });

    // Закрываем интерфейс после завершения работы
    rl.close();
});

// Функция для кодирования изображения с скрытым сообщением
async function encodeImageToPNG(inputPath, message, outputPath, endMarker) {
    try {
        // Чтение исходного изображения в формате PNG
        const imageBuffer = await fs.promises.readFile(inputPath);
        const image = PNG.sync.read(imageBuffer);

        // Преобразуем сообщение в бинарный массив и добавляем маркер конца
        const binaryMessage = textToBinaryArray(message + endMarker);
        let messageIndex = 0;

        // Получаем данные пикселей изображения
        const pixelData = Array.from(image.data);

        // Проходим по пикселям изображения и вставляем скрытое сообщение
        for (let i = 0; i < pixelData.length; i += 4) {
            const pixel = pixelData.slice(i, i + 4);
            if (messageIndex < binaryMessage.length) {
                const messageFragment = binaryMessage.slice(messageIndex, messageIndex + 4);
                // Вставляем фрагмент сообщения в пиксель
                const updatedPixel = insertMessageIntoPixel(pixel, messageFragment);
                updatedPixel.forEach((newValue, j) => {
                    pixelData[i + j] = newValue;
                });
                messageIndex += 4;
            } else {
                // Если сообщение закончилось, вставляем шум в пиксели
                const randomNoise = Array.from({ length: 4 }, () => Math.round(Math.random()));
                const updatedPixel = insertMessageIntoPixel(pixel, randomNoise);
                updatedPixel.forEach((newValue, j) => {
                    pixelData[i + j] = newValue;
                });
            }
        }

        // Создаем новое изображение с обновленными данными пикселей
        const newImage = new PNG({
            width: image.width,
            height: image.height,
        });
        newImage.data = Buffer.from(pixelData);

        // Записываем измененное изображение в файл
        const buffer = PNG.sync.write(newImage);
        await fs.promises.writeFile(outputPath, buffer);
    } catch (err) {
        console.error('Error processing image:', err.message);
        throw err;
    }
}

// Функция для декодирования изображения и извлечения скрытого сообщения
async function decodeImageFromPNG(imagePath, endMarker) {
    try {
        // Чтение изображения из файла
        const imageBuffer = await fs.promises.readFile(imagePath);
        const image = PNG.sync.read(imageBuffer);

        // Массив для хранения извлеченных данных
        const extractedData = [];
        for (let i = 0; i < image.data.length; i += 4) {
            const pixel = Array.from(image.data.slice(i, i + 4));
            // Извлекаем биты сообщения из пикселей
            const dataFragment = extractMessageFromPixel(pixel);
            extractedData.push(...dataFragment);
        }

        // Преобразуем бинарные данные обратно в текст, заканчивая на маркере
        return binaryArrayToText(extractedData, endMarker);
    } catch (err) {
        console.error('Error processing image:', err.message);
        throw err;
    }
}

// Функция для вставки фрагмента сообщения в пиксель
function insertMessageIntoPixel(pixel, messageFragment) {
    return pixel.map((value, idx) =>
        parseInt(value.toString(2).padStart(8, '0').slice(0, 7) + messageFragment[idx], 2)
    );
}

// Функция для извлечения скрытых бит из пикселя
function extractMessageFromPixel(pixel) {
    return pixel.map(value => parseInt(value.toString(2).slice(-1), 2));
}

// Функция для преобразования текста в бинарный массив
function textToBinaryArray(text) {
    const binaryArray = [];
    for (const char of text) {
        const binaryString = char.charCodeAt(0).toString(2).padStart(8, '0');
        // Преобразуем каждый символ в массив бит
        for (const bit of binaryString) {
            binaryArray.push(Number(bit));
        }
    }
    return binaryArray;
}

// Функция для преобразования бинарного массива обратно в текст
function binaryArrayToText(binaryArray, endMarker) {
    let decodedText = '';
    let index = 0;
    // Читаем биты по 8 и преобразуем их в символы
    while (index + 8 <= binaryArray.length) {
        const binarySegment = binaryArray.slice(index, index + 8).join('');
        decodedText += String.fromCharCode(parseInt(binarySegment, 2));
        index += 8;
        // Проверяем, не достигли ли конца скрытого сообщения
        if (decodedText.endsWith(endMarker)) {
            break;
        }
    }
    // Убираем маркер из конца сообщения
    return decodedText.slice(0, -endMarker.length);
}
