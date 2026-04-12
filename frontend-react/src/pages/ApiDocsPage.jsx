import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiInfo, getHealth } from '../services/api.js'
import './ApiDocsPage.css'

const VeritasLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#e07b61"/>
    <path d="M8 10L16 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const sections = [
  { id: 'getting-started', icon: '🚀', label: 'Getting Started' },
  { id: 'authentication', icon: '🔑', label: 'Authentication' },
  { id: 'endpoints', icon: '🔌', label: 'Endpoints' },
  { id: 'errors', icon: '⚠️', label: 'Error Handling' },
  { id: 'examples', icon: '📝', label: 'Code Examples' },
  { id: 'rate-limits', icon: '⏱️', label: 'Rate Limits' },
]

export default function ApiDocsPage() {
  const [apiInfo, setApiInfo] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getApiInfo().then(setApiInfo).catch(() => {})
    getHealth().then(setHealth).catch(() => {})
  }, [])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="api-docs">
      {/* Header */}
      <header className="docs-header">
        <div className="docs-header__inner">
          <Link to="/" className="docs-header__brand">
            <VeritasLogo />
            <span className="docs-header__name">Veritas</span>
            <span className="docs-header__badge">API Docs</span>
          </Link>
          <div className="docs-header__right">
            <Link to="/" className="docs-header__link">Home</Link>
            <Link to="/app" className="docs-header__link">Analyzer</Link>
            {health && (
              <div className="docs-header__status">
                <span className={`status-dot ${health.status === 'healthy' ? 'status-dot--ok' : 'status-dot--off'}`} />
                {health.status === 'healthy' ? 'Online' : 'Offline'}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <nav className="docs-nav">
            <h4 className="docs-nav__title">Contents</h4>
            {sections.map((s) => (
              <button key={s.id} className="docs-nav__link" onClick={() => scrollTo(s.id)}>
                <span className="docs-nav__icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Live API info */}
          {apiInfo && (
            <div className="docs-sidebar__info">
              <h4>API Status</h4>
              <div className="docs-info-item">
                <span>Version</span>
                <strong>{apiInfo.version}</strong>
              </div>
              <div className="docs-info-item">
                <span>Formats</span>
                <strong>{apiInfo.supported_formats?.images?.join(', ')}</strong>
              </div>
              <div className="docs-info-item">
                <span>Max Upload</span>
                <strong>{apiInfo.max_upload_size ? `${(apiInfo.max_upload_size / 1048576).toFixed(0)}MB` : '10MB'}</strong>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="docs-content">
          {/* Title */}
          <div className="docs-hero">
            <h1>API Documentation</h1>
            <p>Complete reference for integrating Veritas deepfake detection into your applications.</p>
            <div className="docs-hero__base-url">
              <span className="docs-hero__label">Base URL</span>
              <code>http://localhost:5000/api</code>
            </div>
          </div>

          {/* Getting Started */}
          <section className="docs-section" id="getting-started">
            <h2>
              <span className="docs-section__icon">🚀</span>
              Getting Started
            </h2>
            <p>
              The Veritas API allows you to analyze images for authenticity and detect AI-generated or manipulated content.
              All endpoints return JSON responses and use standard HTTP response codes.
            </p>

            <h3>Installation</h3>
            <div className="code-block">
              <div className="code-block__header">
                <span className="code-block__lang">bash</span>
              </div>
              <pre className="code-block__body">{`# Clone the repository
git clone https://github.com/yourusername/deepfake-detector.git

# Install dependencies
pip install -r requirements.txt

# Start the API server
python run_api.py`}</pre>
            </div>
          </section>

          {/* Authentication */}
          <section className="docs-section" id="authentication">
            <h2>
              <span className="docs-section__icon">🔑</span>
              Authentication
            </h2>
            <p>
              Currently, the API does not require authentication for detection endpoints.
              The login endpoint accepts username/password for the web UI session.
            </p>

            <div className="docs-callout docs-callout--warning">
              <strong>Production Note:</strong> For production deployments, implement API key authentication
              using the <code>X-API-Key</code> header. Set <code>security.api_key_required: true</code> in
              the config file.
            </div>

            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--post">POST</span>
                <span className="endpoint-path">/login</span>
              </div>
              <p className="endpoint-desc">Authenticate a user session.</p>
              <h4>Request Body (JSON):</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "username": "user@example.com",
  "password": "your_password"
}`}</pre>
              </div>
              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "success": true,
  "message": "Login successful",
  "user": "user@example.com"
}`}</pre>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section className="docs-section" id="endpoints">
            <h2>
              <span className="docs-section__icon">🔌</span>
              API Endpoints
            </h2>

            {/* Health */}
            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--get">GET</span>
                <span className="endpoint-path">/api/health</span>
              </div>
              <p className="endpoint-desc">Check the health status of the API and model availability.</p>
              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}`}</pre>
              </div>
            </div>

            {/* Detect Image */}
            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--post">POST</span>
                <span className="endpoint-path">/api/detect/image</span>
              </div>
              <p className="endpoint-desc">Analyze a single image for deepfake detection.</p>

              <h4>Parameters:</h4>
              <table className="param-table">
                <thead>
                  <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>image</code></td>
                    <td>file</td>
                    <td><span className="badge badge--required">Required</span></td>
                    <td>Image file (JPEG, PNG, WEBP) — Max 10MB</td>
                  </tr>
                </tbody>
              </table>

              <h4>Request (cURL):</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">bash</span></div>
                <pre className="code-block__body">{`curl -X POST http://localhost:5000/api/detect/image \\
  -F "image=@/path/to/your/image.jpg"`}</pre>
              </div>

              <h4>Request (Python):</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">python</span></div>
                <pre className="code-block__body">{`import requests

url = "http://localhost:5000/api/detect/image"
files = {"image": open("image.jpg", "rb")}
response = requests.post(url, files=files)
result = response.json()
print(result)`}</pre>
              </div>

              <h4>Request (JavaScript):</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">javascript</span></div>
                <pre className="code-block__body">{`const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/detect/image', {
  method: 'POST',
  body: formData
});
const data = await response.json();
console.log(data);`}</pre>
              </div>

              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "success": true,
  "prediction": "Real",
  "confidence": 94.5,
  "real_prob": 94.5,
  "fake_prob": 5.5,
  "probabilities": {
    "real": 0.945,
    "fake": 0.055
  },
  "processing_time": 1.23,
  "model_info": {
    "architecture": "efficientnet_b0",
    "version": "1.0"
  }
}`}</pre>
              </div>
            </div>

            {/* Batch Detection */}
            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--post">POST</span>
                <span className="endpoint-path">/api/detect/batch</span>
              </div>
              <p className="endpoint-desc">Analyze multiple images in a single request.</p>

              <h4>Parameters:</h4>
              <table className="param-table">
                <thead>
                  <tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>images</code></td>
                    <td>file[]</td>
                    <td><span className="badge badge--required">Required</span></td>
                    <td>Array of image files — Max 10 images per request</td>
                  </tr>
                </tbody>
              </table>

              <h4>Request (cURL):</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">bash</span></div>
                <pre className="code-block__body">{`curl -X POST http://localhost:5000/api/detect/batch \\
  -F "images=@image1.jpg" \\
  -F "images=@image2.jpg" \\
  -F "images=@image3.jpg"`}</pre>
              </div>

              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "success": true,
  "total_images": 3,
  "results": [
    {
      "filename": "image1.jpg",
      "index": 0,
      "prediction": "Real",
      "confidence": 92.3,
      "real_prob": 92.3,
      "fake_prob": 7.7,
      "probabilities": { "real": 0.923, "fake": 0.077 },
      "processing_time": 0.85,
      "model_info": { "architecture": "efficientnet_b0", "version": "1.0" }
    }
  ]
}`}</pre>
              </div>
            </div>

            {/* API Info */}
            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--get">GET</span>
                <span className="endpoint-path">/api/info</span>
              </div>
              <p className="endpoint-desc">Get API version, supported formats, and available endpoints.</p>
              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "version": "v1",
  "title": "Deepfake Detection API",
  "description": "API for detecting AI-generated and manipulated media",
  "supported_formats": {
    "images": ["jpg", "jpeg", "png", "webp"],
    "audio": ["mp3", "wav", "ogg", "flac"]
  },
  "max_upload_size": 10485760,
  "endpoints": {
    "image_detection": "/api/detect/image",
    "batch_detection": "/api/detect/batch",
    "health": "/api/health",
    "stats": "/api/stats"
  }
}`}</pre>
              </div>
            </div>

            {/* Stats */}
            <div className="endpoint-card">
              <div className="endpoint-header">
                <span className="http-method http-method--get">GET</span>
                <span className="endpoint-path">/api/stats</span>
              </div>
              <p className="endpoint-desc">Get API usage statistics.</p>
              <h4>Response:</h4>
              <div className="code-block">
                <div className="code-block__header"><span className="code-block__lang">json</span></div>
                <pre className="code-block__body">{`{
  "total_predictions": 0,
  "fake_detected": 0,
  "real_detected": 0,
  "average_confidence": 0.0
}`}</pre>
              </div>
            </div>
          </section>

          {/* Error Handling */}
          <section className="docs-section" id="errors">
            <h2>
              <span className="docs-section__icon">⚠️</span>
              Error Handling
            </h2>
            <p>The API uses standard HTTP response codes to indicate success or failure.</p>

            <h3>HTTP Status Codes</h3>
            <table className="param-table">
              <thead>
                <tr><th>Code</th><th>Status</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>200</code></td><td>OK</td><td>Request succeeded</td></tr>
                <tr><td><code>400</code></td><td>Bad Request</td><td>Invalid request parameters or missing image</td></tr>
                <tr><td><code>500</code></td><td>Server Error</td><td>Server-side error during processing</td></tr>
              </tbody>
            </table>

            <h3>Error Response Format</h3>
            <div className="code-block">
              <div className="code-block__header"><span className="code-block__lang">json</span></div>
              <pre className="code-block__body">{`{
  "success": false,
  "error": "No image file provided"
}`}</pre>
            </div>
          </section>

          {/* Code Examples */}
          <section className="docs-section" id="examples">
            <h2>
              <span className="docs-section__icon">📝</span>
              Code Examples
            </h2>

            <h3>Python — Full Analysis Script</h3>
            <div className="code-block">
              <div className="code-block__header"><span className="code-block__lang">python</span></div>
              <pre className="code-block__body">{`import requests
import json

API_URL = "http://localhost:5000/api"

def analyze_image(image_path):
    """Analyze a single image for deepfake detection."""
    with open(image_path, 'rb') as img_file:
        files = {'image': img_file}
        response = requests.post(f"{API_URL}/detect/image", files=files)

    if response.status_code == 200:
        result = response.json()
        print(f"Prediction: {result['prediction']}")
        print(f"Confidence: {result['confidence']:.1f}%")
        print(f"Real Probability: {result['real_prob']:.1f}%")
        print(f"Fake Probability: {result['fake_prob']:.1f}%")
        print(f"Processing Time: {result['processing_time']:.3f}s")
        print(f"Model: {result['model_info']['architecture']}")
        return result
    else:
        print(f"Error: {response.status_code}")
        return None

# Usage
result = analyze_image("test_image.jpg")`}</pre>
            </div>

            <h3>JavaScript / Node.js</h3>
            <div className="code-block">
              <div className="code-block__header"><span className="code-block__lang">javascript</span></div>
              <pre className="code-block__body">{`const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function analyzeImage(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  try {
    const response = await axios.post(
      'http://localhost:5000/api/detect/image',
      form,
      { headers: form.getHeaders() }
    );

    const result = response.data;
    console.log(\`Prediction: \${result.prediction}\`);
    console.log(\`Confidence: \${result.confidence}%\`);
    console.log(\`Processing Time: \${result.processing_time}s\`);
    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeImage('test_image.jpg');`}</pre>
            </div>
          </section>

          {/* Rate Limits */}
          <section className="docs-section" id="rate-limits">
            <h2>
              <span className="docs-section__icon">⏱️</span>
              Rate Limits
            </h2>

            <div className="docs-callout docs-callout--info">
              <strong>Development Mode:</strong> No rate limits are currently enforced.
              For production, configure rate limiting in <code>configs/api_config.yaml</code>.
            </div>

            <h3>Recommended Limits (Production)</h3>
            <ul className="docs-list">
              <li>Single image detection: <strong>60 requests/minute</strong></li>
              <li>Batch detection: <strong>10 requests/minute</strong></li>
              <li>Maximum file size: <strong>10MB per image</strong></li>
              <li>Maximum batch size: <strong>10 images per request</strong></li>
              <li>Hourly limit: <strong>1,000 requests/hour</strong></li>
            </ul>
          </section>

          {/* Footer */}
          <footer className="docs-footer">
            <p>© 2024 Veritas Neural Systems. Built with PyTorch & Flask.</p>
            <div className="docs-footer__links">
              <Link to="/">Home</Link>
              <Link to="/app">Analyzer</Link>
              <Link to="/docs">API Docs</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
