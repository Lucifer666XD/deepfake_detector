/**
 * API Service - Veritas Deepfake Detector
 * 
 * Centralized API layer that maps to all Flask backend endpoints.
 * All backend params are properly mapped and typed.
 * 
 * Backend endpoints:
 *   POST /login                  - User login
 *   GET  /api/health             - Health check
 *   GET  /api/info               - API info
 *   GET  /api/stats              - API statistics
 *   POST /api/detect/image       - Single image detection
 *   POST /api/detect/batch       - Batch image detection
 */

const API_BASE = ''  // Vite proxy handles forwarding to localhost:5000

// ─── Auth ────────────────────────────────────────────────

/**
 * Login to the application
 * @param {string} username
 * @param {string} password
 * @param {boolean} remember
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function login(username, password, remember = false) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, remember }),
  })
  return response.json()
}

// ─── Health & Info ───────────────────────────────────────

/**
 * Check API health status
 * @returns {Promise<{status: string, model_loaded: boolean, device: string}>}
 */
export async function getHealth() {
  const response = await fetch(`${API_BASE}/api/health`)
  return response.json()
}

/**
 * Get API information (version, supported formats, endpoints)
 * @returns {Promise<{
 *   version: string,
 *   title: string,
 *   description: string,
 *   supported_formats: {images: string[], audio: string[]},
 *   max_upload_size: number,
 *   endpoints: {image_detection: string, batch_detection: string, health: string, stats: string}
 * }>}
 */
export async function getApiInfo() {
  const response = await fetch(`${API_BASE}/api/info`)
  return response.json()
}

/**
 * Get API statistics
 * @returns {Promise<{
 *   total_predictions: number,
 *   fake_detected: number,
 *   real_detected: number,
 *   average_confidence: number
 * }>}
 */
export async function getStats() {
  const response = await fetch(`${API_BASE}/api/stats`)
  return response.json()
}

// ─── Detection ───────────────────────────────────────────

/**
 * Detect deepfake in a single image.
 * Sends via multipart/form-data with 'image' field.
 * 
 * @param {File} imageFile - The image file to analyze
 * @returns {Promise<{
 *   success: boolean,
 *   prediction: 'Real' | 'Fake',
 *   confidence: number,          // percentage (0-100)
 *   real_prob: number,            // percentage (0-100)
 *   fake_prob: number,            // percentage (0-100)
 *   probabilities: {
 *     real: number,               // ratio (0-1)
 *     fake: number                // ratio (0-1)
 *   },
 *   processing_time: number,      // in seconds
 *   model_info: {
 *     architecture: string,
 *     version: string
 *   },
 *   error?: string
 * }>}
 */
export async function detectImage(imageFile) {
  const formData = new FormData()
  formData.append('image', imageFile)

  const response = await fetch(`${API_BASE}/api/detect/image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Detection failed (HTTP ${response.status})`)
  }

  return response.json()
}

/**
 * Detect deepfakes in multiple images (batch).
 * Sends via multipart/form-data with multiple 'images' fields.
 * 
 * @param {File[]} imageFiles - Array of image files
 * @returns {Promise<{
 *   success: boolean,
 *   results: Array<{
 *     success: boolean,
 *     prediction: 'Real' | 'Fake',
 *     confidence: number,
 *     real_prob: number,
 *     fake_prob: number,
 *     probabilities: {real: number, fake: number},
 *     processing_time: number,
 *     model_info: {architecture: string, version: string},
 *     filename: string,
 *     index: number
 *   }>,
 *   total_images: number
 * }>}
 */
export async function detectBatch(imageFiles) {
  const formData = new FormData()
  imageFiles.forEach((file) => {
    formData.append('images', file)
  })

  const response = await fetch(`${API_BASE}/api/detect/batch`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Batch detection failed (HTTP ${response.status})`)
  }

  return response.json()
}
