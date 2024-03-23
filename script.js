let byteArray = [];
let bitsPerRow = 8;
let scale = 2;
let originalFileName = '';
let offset = 0;
let maxLines = 800;

document.getElementById('offsetInput').addEventListener('input', function(event) {
    offset = parseInt(event.target.value) || 0;
    syncOffset();
    drawBits();
});

document.getElementById('offsetSlider').addEventListener('input', function(event) {
    offset = parseInt(event.target.value) || 0;
    document.getElementById('offsetInput').value = offset;
    drawBits();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    originalFileName = file.name;
    const reader = new FileReader();
    reader.onload = function(event) {
        byteArray = new Uint8Array(event.target.result);
        syncOffset();
        drawBits();
    };
    reader.readAsArrayBuffer(file);
});

document.getElementById('bitsPerRowSlider').addEventListener('input', function(event) {
    bitsPerRow = parseInt(event.target.value);
    document.getElementById('bitsPerRowValue').textContent = bitsPerRow / 8;
    drawBits();
});

document.getElementById('scaleSlider').addEventListener('input', function(event) {
    scale = parseInt(event.target.value);
    document.getElementById('scaleValue').textContent = scale;
    drawBits();
});

document.getElementById('canvas').addEventListener('mousedown', function(event) {
    event.preventDefault();
    modifyBit(event, event.button !== 2);
});

document.getElementById('canvas').addEventListener('mousemove', function(event) {
    if (event.buttons !== 0) {
        modifyBit(event, event.buttons !== 2);
    }
});

document.getElementById('canvas').addEventListener('contextmenu', event => event.preventDefault());

document.getElementById('saveButton').addEventListener('click', function() {
    const blob = new Blob([byteArray], {type: "application/octet-stream"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalFileName || 'modified_file.bin';
    a.click();
});

function syncOffset() {
    const totalBytes = byteArray.length;
    // Максимальное значение смещения должно позволять отображать хотя бы один байт
    const maxOffset = totalBytes > 0 ? totalBytes - 1 : 0;
    document.getElementById('offsetSlider').max = maxOffset;
    document.getElementById('offsetMax').textContent = maxOffset.toString();

    // Обеспечиваем, что текущее значение смещения не выходит за пределы допустимого диапазона
    offset = Math.min(offset, maxOffset);
    document.getElementById('offsetSlider').value = offset;
    document.getElementById('offsetInput').value = offset;
}

function drawBits() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = bitsPerRow * scale;
    // Расчет высоты канваса с учетом смещения и максимальной высоты в строках
    const linesToDisplay = Math.ceil((byteArray.length - offset) * 8 / bitsPerRow);
    canvas.height = Math.min(maxLines, linesToDisplay) * scale;

    let x = 0, y = 0;
    // Проходим по байтам, начиная с указанного смещения
    for (let i = offset; i < byteArray.length; i++) {
        for (let bit = 7; bit >= 0; bit--) {
            // Прекращаем отрисовку, если достигнута максимальная высота
            if (y >= Math.min(maxLines, linesToDisplay)) break;
            ctx.fillStyle = (byteArray[i] & (1 << bit)) ? 'black' : 'white';
            ctx.fillRect(x * scale, y * scale, scale, scale);
            if (++x >= bitsPerRow) {
                x = 0;
                y++;
            }
        }
        if (y >= Math.min(maxLines, linesToDisplay)) break;
    }
}

function modifyBit(event, setBit) {
    const rect = document.getElementById('canvas').getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / scale);
    const y = Math.floor((event.clientY - rect.top) / scale);
    const bitIndex = y * bitsPerRow + x;
    // Учитываем смещение при расчете byteIndex
    const byteIndex = Math.floor(bitIndex / 8) + offset; // Добавляем offset здесь
    const bit = 7 - bitIndex % 8;

    // Проверяем, что byteIndex не выходит за пределы массива
    if (byteIndex < byteArray.length) {
        // Устанавливаем или сбрасываем бит в соответствии с действием пользователя
        if (setBit) byteArray[byteIndex] |= 1 << bit;
        else byteArray[byteIndex] &= ~(1 << bit);
        drawBits(); // Перерисовываем канвас, чтобы отразить изменения
    }
}

