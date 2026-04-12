import { useNavigate } from 'react-router-dom'
import './LandingPage.css'

const VeritasLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#e07b61"/>
    <path d="M8 10L16 22L24 10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__inner">
          <div className="landing-nav__brand">
            <VeritasLogo />
            <span className="landing-nav__name">Veritas</span>
          </div>
          <div className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#how-it-works" className="landing-nav__link">How It Works</a>
            <a href="#api" className="landing-nav__link">API</a>
            <button
              className="landing-nav__cta"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            AI-Powered Detection
          </div>
          <h1 className="hero__title">
            Verify the authenticity<br />of any image.
          </h1>
          <p className="hero__subtitle">
            AI-powered deepfake detection with confidence scores in seconds.
            Protect your digital integrity with forensic-grade neural analysis.
          </p>
          <div className="hero__actions">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/app')}
            >
              Start Analyzing
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <a href="#features" className="btn btn--outline btn--lg">Learn more</a>
          </div>
        </div>
        <div className="hero__visual">
          <div className="hero__card">
            <div className="hero__card-header">
              <div className="hero__card-dot hero__card-dot--green" />
              <div className="hero__card-dot hero__card-dot--yellow" />
              <div className="hero__card-dot hero__card-dot--red" />
            </div>
            <div className="hero__card-body">
              <div className="hero__scan-line" />
              <div className="hero__result-badge hero__result-badge--authentic">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10L9 14L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Authentic — 98.7%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="features__inner">
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 className="section-title">Engineered for clarity.</h2>
            <p className="section-desc">
              Our sophisticated neural networks provide industry-leading analysis for
              digital media with simple, actionable results.
            </p>
          </div>
          <div className="features__grid">
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-card__title">Upload & Scan</h3>
              <p className="feature-card__desc">
                Simply drag and drop any image. Our system supports high-resolution
                RAW, JPEG, and PNG formats with instant processing.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-card__title">AI Analysis</h3>
              <p className="feature-card__desc">
                Multi-layered forensic analysis detects even the most subtle
                synthetic manipulations, GAN artifacts, and lighting inconsistencies.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-card__title">Confidence Report</h3>
              <p className="feature-card__desc">
                Receive a detailed breakdown and probability score of the media's
                authenticity. Exportable reports for legal and professional use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works__inner">
          <div className="section-header">
            <span className="section-label">Process</span>
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step__number">01</div>
              <div className="step__content">
                <h3>Upload your image</h3>
                <p>Drag and drop or browse to upload any image for analysis. We support JPG, PNG, and WebP formats up to 10MB.</p>
              </div>
            </div>
            <div className="step__connector" />
            <div className="step">
              <div className="step__number">02</div>
              <div className="step__content">
                <h3>Neural analysis</h3>
                <p>Our EfficientNet-B0 model analyzes pixel patterns, compression artifacts, and neural signatures in real-time.</p>
              </div>
            </div>
            <div className="step__connector" />
            <div className="step">
              <div className="step__number">03</div>
              <div className="step__content">
                <h3>Get your report</h3>
                <p>Receive instant results with confidence scores, detailed probability breakdown, and a clear authenticity verdict.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="api-section" id="api">
        <div className="api-section__inner">
          <div className="api-section__content">
            <span className="section-label">Developer API</span>
            <h2 className="section-title" style={{ textAlign: 'left' }}>Integrate with your platform</h2>
            <p className="section-desc" style={{ textAlign: 'left' }}>
              RESTful API with comprehensive documentation allows seamless integration
              into your applications, workflows, and automated systems.
            </p>
            <button
              className="btn btn--primary"
              onClick={() => navigate('/docs')}
            >
              View API Docs
            </button>
          </div>
          <div className="api-section__code">
            <div className="code-window">
              <div className="code-window__header">
                <div className="code-window__dots">
                  <span /><span /><span />
                </div>
                <span className="code-window__title">terminal</span>
              </div>
              <pre className="code-window__body">
{`curl -X POST http://localhost:5000/api/detect/image \\
  -F "image=@your_image.jpg"

# Response:
{
  "success": true,
  "prediction": "Real",
  "confidence": 98.7,
  "probabilities": {
    "real": 0.987,
    "fake": 0.013
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-section__inner">
          <h2>Ready to verify?</h2>
          <p>
            Join thousands of journalists, legal firms, and digital investigators
            using Veritas to protect the truth.
          </p>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => navigate('/app')}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <VeritasLogo />
            <span>Veritas</span>
          </div>
          <div className="landing-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
          <p className="landing-footer__copy">
            © 2024 Veritas Neural Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
