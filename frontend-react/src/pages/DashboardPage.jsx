import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { detectImage, getHealth, getStats } from '../services/api.js'
import './DashboardPage.css'

const VeritasLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#e07b61"/>
    <path d="M8 10L16 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function DashboardPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // States: 'upload' | 'preview' | 'loading' | 'results'
  const [view, setView] = useState('upload')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [results, setResults] = useState(null)
  const [apiStatus, setApiStatus] = useState(null) // backend health
  const [apiStats, setApiStats] = useState(null)   // backend stats
  const [analysisError, setAnalysisError] = useState(null)

  const user = sessionStorage.getItem('user') || 'User'

  // ──── Check backend health + load stats on mount ────
  useEffect(() => {
    async function checkBackend() {
      try {
        const health = await getHealth()
        setApiStatus(health)
      } catch {
        setApiStatus({ status: 'offline', model_loaded: false, device: 'unknown' })
      }

      try {
        const stats = await getStats()
        setApiStats(stats)
      } catch {
        // stats endpoint optional
      }
    }
    checkBackend()
  }, [])

  // ──── File handling ────
  const handleFile = useCallback((file) => {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP)')
      return
    }

    // 10MB limit matching backend config api.max_upload_size
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setAnalysisError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setView('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }, [handleFile])

  // ──── Analysis — calls POST /api/detect/image ────
  const handleAnalyze = async () => {
    if (!selectedFile) return
    setView('loading')
    setAnalysisError(null)

    try {
      /**
       * Backend returns:
       * {
       *   success: boolean,
       *   prediction: 'Real' | 'Fake',
       *   confidence: number (0-100),
       *   real_prob: number (0-100),
       *   fake_prob: number (0-100),
       *   probabilities: { real: number (0-1), fake: number (0-1) },
       *   processing_time: number (seconds),
       *   model_info: { architecture: string, version: string }
       * }
       */
      const data = await detectImage(selectedFile)

      if (!data.success) {
        throw new Error(data.error || 'Analysis returned unsuccessful')
      }

      // Map all backend params into results state
      setResults({
        // Core verdict
        prediction: data.prediction,                           // 'Real' | 'Fake'
        confidence: data.confidence,                           // e.g. 98.7

        // Probabilities (percentage form)
        realProb: data.real_prob,                               // e.g. 98.7
        fakeProb: data.fake_prob,                               // e.g. 1.3

        // Probabilities (ratio form 0-1)
        probabilitiesRaw: data.probabilities,                   // {real: 0.987, fake: 0.013}

        // Timing
        processingTime: data.processing_time.toFixed(3),        // e.g. "0.842"

        // Model metadata
        modelArchitecture: data.model_info?.architecture || 'EfficientNet-B0',
        modelVersion: data.model_info?.version || '1.0',

        // File info
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      })
      setView('results')

    } catch (err) {
      console.error('Analysis error:', err)
      setAnalysisError(err.message || 'Failed to analyze image')
      setView('preview') // go back to preview so user can retry
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResults(null)
    setAnalysisError(null)
    setView('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('isLoggedIn')
    navigate('/')
  }

  const isAuthentic = results?.prediction === 'Real'

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header__inner">
          <Link to="/" className="dash-header__brand">
            <VeritasLogo />
            <span className="dash-header__name">Veritas</span>
          </Link>
          <div className="dash-header__right">
            {/* API Status indicator */}
            <div className="dash-header__status" title={`Backend: ${apiStatus?.status || 'checking...'}`}>
              <span className={`status-dot ${apiStatus?.status === 'healthy' ? 'status-dot--ok' : 'status-dot--off'}`} />
              <span className="status-label">
                {apiStatus?.status === 'healthy' ? 'Online' : 'Offline'}
              </span>
            </div>
            <Link to="/docs" className="dash-header__link">Docs</Link>
            <div className="dash-header__user">
              <div className="dash-header__avatar">
                {user[0]?.toUpperCase()}
              </div>
              <span className="dash-header__username">{user}</span>
              <button className="dash-header__logout" onClick={handleLogout} title="Logout">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M7 15H4a1 1 0 01-1-1V4a1 1 0 011-1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11 12l3-3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 9H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dash-main">
        <div className="dash-main__inner">
          {/* Page Header */}
          <div className="dash-page-header">
            <h1 className="dash-page-title">Deepfake Analysis</h1>
            <p className="dash-page-desc">
              Upload any media to verify authenticity with our neural detection engine.
            </p>
          </div>

          {/* Backend offline banner */}
          {apiStatus && apiStatus.status !== 'healthy' && (
            <div className="offline-banner fade-in">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>
                Backend server is not running. Start it with <code>python run_api.py</code> to enable real analysis.
              </span>
            </div>
          )}

          {/* Upload State */}
          {view === 'upload' && (
            <div className="dash-content fade-in">
              <div
                className={`upload-zone ${dragOver ? 'upload-zone--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="upload-zone__input"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <div className="upload-zone__icon">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M30 25V30C30 31.1 29.1 32 28 32H12C10.9 32 10 31.1 10 30V25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 17L20 12L25 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 12V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="upload-zone__title">Drop your image here</h3>
                <p className="upload-zone__desc">or click to browse from your computer</p>
                <span className="upload-zone__formats">Supports JPG, PNG, WEBP · Max 10MB</span>
              </div>

              {/* Stats from backend /api/stats */}
              {apiStats && (
                <div className="api-stats">
                  <div className="api-stat">
                    <span className="api-stat__value">{apiStats.total_predictions}</span>
                    <span className="api-stat__label">Total Scans</span>
                  </div>
                  <div className="api-stat">
                    <span className="api-stat__value">{apiStats.real_detected}</span>
                    <span className="api-stat__label">Real Detected</span>
                  </div>
                  <div className="api-stat">
                    <span className="api-stat__value">{apiStats.fake_detected}</span>
                    <span className="api-stat__label">Fake Detected</span>
                  </div>
                  <div className="api-stat">
                    <span className="api-stat__value">
                      {apiStats.average_confidence ? `${apiStats.average_confidence.toFixed(1)}%` : '—'}
                    </span>
                    <span className="api-stat__label">Avg Confidence</span>
                  </div>
                </div>
              )}

              {/* Model info from health check */}
              {apiStatus?.model_loaded && (
                <div className="model-info-bar">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Model loaded on <strong>{apiStatus.device || 'cpu'}</strong>
                </div>
              )}
            </div>
          )}

          {/* Preview State */}
          {view === 'preview' && (
            <div className="dash-content fade-in">
              <div className="preview-panel">
                <div className="preview-panel__header">
                  <h2>Image Preview</h2>
                  <p>Review your upload before processing</p>
                </div>

                {/* Error banner */}
                {analysisError && (
                  <div className="analysis-error">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="8" cy="11" r="0.5" fill="currentColor"/>
                    </svg>
                    <span>{analysisError}</span>
                    <button onClick={() => setAnalysisError(null)}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                <div className="preview-panel__image-wrap">
                  <img
                    src={previewUrl}
                    alt="Upload preview"
                    className="preview-panel__image"
                  />
                  <button className="preview-panel__remove" onClick={handleReset}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 4L14 14M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
                <div className="preview-panel__info">
                  <div className="preview-panel__detail">
                    <span className="preview-panel__detail-label">File</span>
                    <span className="preview-panel__detail-value">{selectedFile?.name}</span>
                  </div>
                  <div className="preview-panel__detail">
                    <span className="preview-panel__detail-label">Size</span>
                    <span className="preview-panel__detail-value">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '—'}
                    </span>
                  </div>
                  <div className="preview-panel__detail">
                    <span className="preview-panel__detail-label">Type</span>
                    <span className="preview-panel__detail-value">{selectedFile?.type}</span>
                  </div>
                </div>
                <div className="preview-panel__actions">
                  <button className="btn btn--outline" onClick={handleReset}>Cancel</button>
                  <button className="btn btn--primary" onClick={handleAnalyze}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Analyze Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {view === 'loading' && (
            <div className="dash-content fade-in">
              <div className="loading-panel">
                <div className="loading-ring">
                  <div className="loading-ring__circle" />
                </div>
                <h3>Analyzing image...</h3>
                <p>Running deep neural network inference</p>
                <div className="loading-steps">
                  <div className="loading-step loading-step--done">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Image preprocessing
                  </div>
                  <div className="loading-step loading-step--active">
                    <div className="loading-step__spinner" />
                    Model inference ({apiStatus?.device || 'cpu'})
                  </div>
                  <div className="loading-step">
                    <div className="loading-step__dot" />
                    Generating report
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results State */}
          {view === 'results' && results && (
            <div className="dash-content fade-in">
              <div className="results-panel">
                {/* Verdict */}
                <div className={`verdict ${isAuthentic ? 'verdict--authentic' : 'verdict--fake'}`}>
                  <div className="verdict__icon">
                    {isAuthentic ? (
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M8 16L14 22L24 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path d="M16 10V18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <circle cx="16" cy="23" r="1.5" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                  <div className="verdict__label">Verdict</div>
                  <h2 className="verdict__title">
                    {isAuthentic ? 'Authentic' : 'Deepfake Detected'}
                  </h2>
                  <div className="verdict__confidence">
                    <span className="verdict__confidence-value">
                      {results.confidence.toFixed(1)}%
                    </span>
                    <span className="verdict__confidence-label">confidence</span>
                  </div>
                </div>

                {/* Probability Bars — mapped from real_prob / fake_prob */}
                <div className="prob-section">
                  <h3 className="prob-section__title">Probability Analysis</h3>
                  <div className="prob-bar">
                    <div className="prob-bar__header">
                      <span className="prob-bar__label">Real Probability</span>
                      <span className="prob-bar__value">{results.realProb.toFixed(1)}%</span>
                    </div>
                    <div className="prob-bar__track">
                      <div
                        className="prob-bar__fill prob-bar__fill--real"
                        style={{ width: `${results.realProb}%` }}
                      />
                    </div>
                  </div>
                  <div className="prob-bar">
                    <div className="prob-bar__header">
                      <span className="prob-bar__label">Fake Probability</span>
                      <span className="prob-bar__value">{results.fakeProb.toFixed(1)}%</span>
                    </div>
                    <div className="prob-bar__track">
                      <div
                        className="prob-bar__fill prob-bar__fill--fake"
                        style={{ width: `${results.fakeProb}%` }}
                      />
                    </div>
                  </div>
                  {/* Raw probability ratios from probabilities object */}
                  <div className="prob-raw">
                    <span>Raw: real={results.probabilitiesRaw?.real?.toFixed(4)}, fake={results.probabilitiesRaw?.fake?.toFixed(4)}</span>
                  </div>
                </div>

                {/* Detailed metadata — maps ALL backend response fields */}
                <div className="result-details-panel">
                  <h3 className="result-details-panel__title">Analysis Details</h3>
                  <div className="result-detail">
                    <span className="result-detail__label">Prediction</span>
                    <span className={`result-detail__value result-detail__value--${isAuthentic ? 'real' : 'fake'}`}>
                      {results.prediction}
                    </span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">Confidence</span>
                    <span className="result-detail__value">{results.confidence.toFixed(2)}%</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">Processing Time</span>
                    <span className="result-detail__value">{results.processingTime}s</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">Model Architecture</span>
                    <span className="result-detail__value">{results.modelArchitecture}</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">Model Version</span>
                    <span className="result-detail__value">v{results.modelVersion}</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">Device</span>
                    <span className="result-detail__value">{apiStatus?.device || 'cpu'}</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">File Name</span>
                    <span className="result-detail__value">{results.filename}</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">File Size</span>
                    <span className="result-detail__value">{(results.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="result-detail">
                    <span className="result-detail__label">File Type</span>
                    <span className="result-detail__value">{results.fileType}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="results-actions">
                  <button className="btn btn--outline" onClick={handleReset}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8a6 6 0 0111.5-2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M14 8a6 6 0 01-11.5 2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M13 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Analyze Another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="dash-footer">
        <p>© 2024 Veritas Neural Systems. All rights reserved.</p>
      </footer>
    </div>
  )
}
