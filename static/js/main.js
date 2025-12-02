const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const dimensions = document.getElementById('dimensions');
const parts = document.getElementById('parts');
const processBtn = document.getElementById('processBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const success = document.getElementById('success');

let selectedFile = null;

// Drag and drop
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File input
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Select a valid file');
        return;
    }

    selectedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        fileName.textContent = file.name;

        const img = new Image();
        img.onload = () => {
            const width = img.width;
            const height = img.height;
            const numParts = Math.ceil(width / 1080);

            dimensions.textContent = `${width}px × ${height}px`;
            parts.textContent = `${numParts} ${numParts === 1 ? 'part' : 'parts'}`;

            preview.style.display = 'block';
            hideMessages();
        };
        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

processBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);

    loading.style.display = 'block';
    processBtn.disabled = true;
    hideMessages();

    try {
        const response = await fetch('/split', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error when process image');
        }

        // Pega o nome do arquivo do header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'imagens_divididas.zip'; // fallback
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showSuccess('Pages are sliced successfully!');
    } catch (err) {
        showError(err.message);
    } finally {
        loading.style.display = 'none';
        processBtn.disabled = false;
    }
});

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
    success.style.display = 'none';
}

function showSuccess(message) {
    success.textContent = message;
    success.style.display = 'block';
    error.style.display = 'none';
}

function hideMessages() {
    error.style.display = 'none';
    success.style.display = 'none';
}