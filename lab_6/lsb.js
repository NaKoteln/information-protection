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

// Функция для кодирования изображения с длиной сообщения
async function encodeImageToPNG(inputPath, message, outputPath) {
    try {
        const imageBuffer = await fs.promises.readFile(inputPath);
        const image = PNG.sync.read(imageBuffer);

        // Преобразуем сообщение в бинарный массив
        const binaryMessage = textToBinaryArray(message);

        // Кодируем длину сообщения в первых пикселях
        const messageLength = binaryMessage.length;
        const lengthInBytes = messageLength.toString(2).padStart(32, '0'); // Длина сообщения (32 бита)
        const binaryMessageWithLength = lengthInBytes.split('').map(Number).concat(binaryMessage);

        let messageIndex = 0;
        const pixelData = Array.from(image.data);

        // Процесс кодирования
        for (let i = 0; i < pixelData.length; i += 4) {
            const pixel = pixelData.slice(i, i + 4);
            if (messageIndex < binaryMessageWithLength.length) {
                const messageFragment = binaryMessageWithLength.slice(messageIndex, messageIndex + 4);
                const updatedPixel = insertMessageIntoPixel(pixel, messageFragment);
                updatedPixel.forEach((newValue, j) => {
                    pixelData[i + j] = newValue;
                });
                messageIndex += 4;
            } else {
                // Заполнение случайными данными после завершения сообщения
                const randomNoise = Array.from({ length: 4 }, () => Math.round(Math.random()));
                const updatedPixel = insertMessageIntoPixel(pixel, randomNoise);
                updatedPixel.forEach((newValue, j) => {
                    pixelData[i + j] = newValue;
                });
            }
        }

        const newImage = new PNG({ width: image.width, height: image.height });
        newImage.data = Buffer.from(pixelData);

        const buffer = PNG.sync.write(newImage);
        await fs.promises.writeFile(outputPath, buffer);
    } catch (err) {
        console.error('Error processing image:', err.message);
        throw err;
    }
}

// Функция для декодирования изображения с извлечением длины сообщения
async function decodeImageFromPNG(imagePath) {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        const image = PNG.sync.read(imageBuffer);

        const extractedData = [];
        for (let i = 0; i < image.data.length; i += 4) {
            const pixel = Array.from(image.data.slice(i, i + 4));
            const dataFragment = extractMessageFromPixel(pixel);
            extractedData.push(...dataFragment);
        }

        // Извлекаем длину сообщения из первых 32 бит
        const messageLengthBinary = extractedData.slice(0, 32);
        const messageLength = parseInt(messageLengthBinary.join(''), 2);

        // Извлекаем само сообщение, начиная с 33 бита
        const messageBinary = extractedData.slice(32, 32 + messageLength);

        return binaryArrayToText(messageBinary);
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
        for (const bit of binaryString) {
            binaryArray.push(Number(bit));
        }
    }
    return binaryArray;
}

// Функция для преобразования бинарного массива обратно в текст
function binaryArrayToText(binaryArray) {
    let decodedText = '';
    let index = 0;
    while (index + 8 <= binaryArray.length) {
        const binarySegment = binaryArray.slice(index, index + 8).join('');
        decodedText += String.fromCharCode(parseInt(binarySegment, 2));
        index += 8;
    }
    return decodedText;
}
