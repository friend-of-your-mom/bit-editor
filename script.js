let byteArray = [];
let bitsPerRow = 8;
let scale = 2;
let originalFileName = '';
let offset = 0;
let maxLines = 800;

document.addEventListener('DOMContentLoaded', function() {
    var saveModal = new bootstrap.Modal(document.getElementById('saveModal'));

    document.getElementById('saveButton').addEventListener('click', function() {
      const offsetInput = document.getElementById('saveModalOffset');
      offsetInput.value = offset;
      offsetInput.min = 0;
      offsetInput.max = byteArray.length > 0 ? byteArray.length - 1 : 0; 
      document.getElementById('saveModalLength').value = byteArray.length - offset;
      saveModal.show();
    });

    document.getElementById('saveModalOffset').addEventListener('input', function() {
        const fromOffset = parseInt(this.value, 10) || 0;
        document.getElementById('saveModalLength').value = byteArray.length - fromOffset;
    });

    document.getElementById('modalSaveButton').addEventListener('click', function() {
        const offset = parseInt(document.getElementById('saveModalOffset').value, 10) || 0;
        const length = parseInt(document.getElementById('saveModalLength').value, 10) || byteArray.length;
        const partOfArray = byteArray.slice(offset, offset + length);
        const blob = new Blob([partOfArray], {type: "application/octet-stream"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = originalFileName || 'modified_file.bin';
        a.click();
        // close modal after saving
        const saveModal = bootstrap.Modal.getInstance(document.getElementById('saveModal'));
        saveModal.hide();
    });

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
            resetSettings();
            syncOffset();
            drawBits();
            document.getElementById('saveButton').disabled = false;
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

    document.getElementById('showReadme').addEventListener('click', function(event) {
        event.preventDefault();
        fetch('README.md')
          .then(response => response.text())
          .then(text => {
            document.getElementById('readmeContainer').innerHTML = marked.parse(text);
            document.getElementById('readmePopup').style.display = 'block';
          })
          .catch(error => console.error('Error loading README.md:', error));
    });

    document.getElementById('canvas').addEventListener('contextmenu', event => event.preventDefault());

    window.addEventListener('beforeunload', function (e) {
        e.preventDefault();
        e.returnValue = '';
        return 'Are you sure you want to leave? You will lose all unsaved data.';
    });
});

function resetSettings() {
    bitsPerRow = 8;
    scale = 2;
    offset = 0;
    document.getElementById('bitsPerRowSlider').value = bitsPerRow;
    document.getElementById('bitsPerRowValue').textContent = bitsPerRow / 8;
    document.getElementById('scaleSlider').value = scale;
    document.getElementById('scaleValue').textContent = scale;
    document.getElementById('offsetInput').value = offset;
    document.getElementById('offsetSlider').value = offset;
}

function syncOffset() {
    const totalBytes = byteArray.length;
    const maxOffset = totalBytes > 0 ? totalBytes - 1 : 0;
    document.getElementById('offsetSlider').max = maxOffset;
    document.getElementById('offsetMax').textContent = maxOffset.toString();
    offset = Math.min(offset, maxOffset);
    document.getElementById('offsetSlider').value = offset;
    document.getElementById('offsetInput').value = offset;
}

function drawBits() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = bitsPerRow * scale;
    const linesToDisplay = Math.ceil((byteArray.length - offset) * 8 / bitsPerRow);
    canvas.height = Math.min(maxLines, linesToDisplay) * scale;

    let x = 0, y = 0;
    for (let i = offset; i < byteArray.length; i++) {
        for (let bit = 7; bit >= 0; bit--) {
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
    const byteIndex = Math.floor(bitIndex / 8) + offset;
    const bit = 7 - bitIndex % 8;
    if (byteIndex < byteArray.length) {
        if (setBit) byteArray[byteIndex] |= 1 << bit;
        else byteArray[byteIndex] &= ~(1 << bit);
        drawBits();
    }
}
