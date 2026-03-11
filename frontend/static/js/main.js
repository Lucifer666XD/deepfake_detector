// DOM Elements
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const removeImage = document.getElementById('removeImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');

// State
let selectedFile = null;

// Event Listeners
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
removeImage.addEventListener('click', resetUpload);
analyzeBtn.addEventListener('click', analyzeImage);
analyzeAnotherBtn.addEventListener('click', resetUpload);

// Drag and Drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('drag-over');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('drag-over');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

uploadBox.addEventListener('click', () => fileInput.click());

// Functions
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFile(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, PNG, or WEBP)');
        return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
    }

    selectedFile = file;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        uploadBox.style.display = 'none';
        previewSection.style.display = 'block';
        previewSection.classList.add('animate-in');
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    uploadBox.style.display = 'block';
    previewSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
}

async function analyzeImage() {
    if (!selectedFile) {
        alert('Please select an image first');
        return;
    }

    // Show loading
    previewSection.style.display = 'none';
    loadingSection.style.display = 'block';
    loadingSection.classList.add('animate-in');

    // Prepare form data
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        // Make API request
        const response = await fetch('/api/detect/image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        // Hide loading
        loadingSection.style.display = 'none';

        if (result.success) {
            displayResults(result);
        } else {
            alert('Error analyzing image: ' + result.error);
            previewSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to analyze image. Please try again.');
        loadingSection.style.display = 'none';
        previewSection.style.display = 'block';
    }
}

function displayResults(result) {
    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.classList.add('animate-in');

    // Update verdict
    const resultIcon = document.getElementById('resultIcon');
    const resultVerdict = document.getElementById('resultVerdict');
    const isFake = result.prediction === 'Fake';

    if (isFake) {
        resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        resultIcon.className = 'result-icon fake';
        resultVerdict.textContent = 'FAKE IMAGE DETECTED';
        resultVerdict.className = 'result-verdict fake';
    } else {
        resultIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        resultIcon.className = 'result-icon real';
        resultVerdict.textContent = 'REAL IMAGE';
        resultVerdict.className = 'result-verdict real';
    }

    // Update confidence
    const confidence = (result.confidence * 100).toFixed(1);
    document.getElementById('confidenceValue').textContent = confidence + '%';

    // Update probability bars
    const realProb = (result.probabilities.real * 100).toFixed(1);
    const fakeProb = (result.probabilities.fake * 100).toFixed(1);

    const realBar = document.getElementById('realBar');
    const fakeBar = document.getElementById('fakeBar');
    const realValue = document.getElementById('realValue');
    const fakeValue = document.getElementById('fakeValue');

    // Animate bars
    setTimeout(() => {
        realBar.style.width = realProb + '%';
        fakeBar.style.width = fakeProb + '%';
        realValue.textContent = realProb + '%';
        fakeValue.textContent = fakeProb + '%';
    }, 100);

    // Update processing time
    document.getElementById('processingTime').textContent = 
        result.processing_time.toFixed(3) + 's';

    // Update model info
    if (result.model_info) {
        document.getElementById('modelInfo').textContent = 
            result.model_info.architecture || 'EfficientNet-B0';
    }

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// API Health Check on page load
async function checkAPIHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('API Health:', data);
    } catch (error) {
        console.error('API Health check failed:', error);
    }
}

// Initialize
checkAPIHealth();

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
