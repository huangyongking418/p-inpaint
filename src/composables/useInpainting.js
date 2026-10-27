import { ref } from "vue"
import * as ort from "onnxruntime-web"

const MODEL_URL = "https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx"
const MODEL_BACKUP = "https://worker-share-proxy-01f5.lxfater.workers.dev/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx"

// ---- IndexedDB 缓存 ----
const DB_NAME = "p-inpaint-cache"
const STORE_NAME = "models"
const MODEL_KEY = "migan_pipeline_v2"
const EXPECTED_SIZE = 20 * 1024 * 1024 // 20MB min

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function getCachedModel() {
  try {
    const db = await openDB()
    return new Promise(r => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const req = tx.objectStore(STORE_NAME).get(MODEL_KEY)
      req.onsuccess = () => {
        const buf = req.result
        if (buf && buf.byteLength > EXPECTED_SIZE) r(buf)
        else { r(null); if (buf) console.warn("[p-inpaint] cached model too small, ignoring") }
      }
      req.onerror = () => r(null)
    })
  } catch { return null }
}
async function saveModel(buffer) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(buffer, MODEL_KEY)
  } catch (e) { console.warn("[p-inpaint] cache fail:", e) }
}
async function clearModelCache() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).delete(MODEL_KEY)
  } catch {}
}

// ---- Vue composable ----
export function useInpainting() {
  const modelLoaded = ref(false)
  const modelLoading = ref(false)
  const isRunning = ref(false)
  const downloadProgress = ref(0)
  const downloadStatus = ref("")
  const errorMessage = ref("")

  let session = null
  let modelBuffer = null

  function setError(msg) {
    errorMessage.value = msg
    downloadStatus.value = "error"
    console.error("[p-inpaint]", msg)
  }

  // ---- 配置 ONNX Runtime 环境 ----
  function configEnv() {
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/"
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4
    ort.env.wasm.simd = true
    ort.env.wasm.proxy = false
    console.log("[p-inpaint] env configured, threads:", ort.env.wasm.numThreads)
  }

  // ---- 下载模型 ----
  async function downloadAndCacheModel() {
    downloadStatus.value = "downloading"
    downloadProgress.value = 0

    const cached = await getCachedModel()
    if (cached) {
      modelBuffer = cached
      downloadStatus.value = "done"
      downloadProgress.value = 100
      console.log("[p-inpaint] use cached", Math.round(cached.byteLength / 1024 / 1024) + "MB")
      return cached
    }

    async function fetchStream(url, signal) {
      console.log("[p-inpaint] fetch:", url)
      const r = await fetch(url, { signal })
      if (!r.ok) throw new Error("HTTP " + r.status)
      const total = parseInt(r.headers.get("content-length") || "0", 10)
      const reader = r.body.getReader()
      const chunks = []; let dl = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) { chunks.push(value); dl += value.length }
        if (total) downloadProgress.value = Math.round((dl / total) * 100)
      }
      const buf = new Uint8Array(dl); let off = 0
      for (const c of chunks) { buf.set(c, off); off += c.length }
      return buf.buffer
    }

    const ctrl = new AbortController()
    // 5 分钟超时
    const timer = setTimeout(() => ctrl.abort(), 300000)

    try { modelBuffer = await fetchStream(MODEL_URL, ctrl.signal) }
    catch (e) {
      console.warn("[p-inpaint] primary fail:", e.message)
      clearTimeout(timer)
      try { modelBuffer = await fetchStream(MODEL_BACKUP) }
      catch (e2) { throw new Error("下载失败: " + e2.message) }
    }
    clearTimeout(timer)

    await saveModel(modelBuffer)
    downloadStatus.value = "done"
    downloadProgress.value = 100
    console.log("[p-inpaint] downloaded", Math.round(modelBuffer.byteLength / 1024 / 1024) + "MB")
    return modelBuffer
  }

  // ---- 加载模型 ----
  async function loadModel() {
    if (session) { modelLoaded.value = true; return session }

    modelLoading.value = true
    console.time("[p-inpaint] loadModel")

    try {
      configEnv()
      if (!modelBuffer) modelBuffer = await downloadAndCacheModel()

      // 先试一次,如果失败清缓存重试
      try {
        console.log("[p-inpaint] creating session...")
        session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ["wasm"],
        })
      } catch (e) {
        console.warn("[p-inpaint] session create failed, clear cache and retry:", e.message)
        await clearModelCache()
        modelBuffer = await downloadAndCacheModel()
        session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ["wasm"],
        })
      }

      console.log("[p-inpaint] session ready | inputs:", session.inputNames, "outputs:", session.outputNames)
      console.timeEnd("[p-inpaint] loadModel")
      modelLoaded.value = true
      modelLoading.value = false
      return session
    } catch (e) {
      modelLoading.value = false
      setError("模型加载失败: " + e.message)
      throw e
    }
  }

  // ---- 预处理 ----
  function preprocessImage(imageData, w, h) {
    const data = imageData.data, chw = new Uint8Array(3 * h * w)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4
      for (let c = 0; c < 3; c++) chw[c * h * w + y * w + x] = data[si + c]
    }
    return chw
  }
  function preprocessMask(maskData, w, h) {
    const data = maskData.data, chw = new Uint8Array(h * w)
    for (let i = 0; i < h * w; i++) chw[i] = data[i * 4] > 200 ? 0 : 255
    return chw
  }

  // ---- 后处理 ----
  function postprocess(outsData, w, h) {
    const res = new Uint8ClampedArray(w * h * 4), sz = w * h
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        let v = Math.round(outsData[c * sz + y * w + x])
        res[idx + c] = Math.max(0, Math.min(255, v))
      }
      res[idx + 3] = 255
    }
    return new ImageData(res, w, h)
  }

  // ---- 推理 ----
  async function runInpainting(imageData, maskData, width, height) {
    if (!session) await loadModel()
    isRunning.value = true
    console.time("[p-inpaint] inference")

    try {
      if (width * height > 4000000) throw new Error("图片过大，建议 ≤ 2000×2000")

      const imageTensor = new ort.Tensor("uint8", preprocessImage(imageData, width, height), [1, 3, height, width])
      const maskTensor = new ort.Tensor("uint8", preprocessMask(maskData, width, height), [1, 1, height, width])

      const feeds = {}
      feeds[session.inputNames[0]] = imageTensor
      feeds[session.inputNames[1]] = maskTensor

      const results = await session.run(feeds)
      console.timeEnd("[p-inpaint] inference")
      return postprocess(results[session.outputNames[0]].data, width, height)
    } catch (e) {
      setError("推理失败: " + e.message)
      throw e
    } finally {
      isRunning.value = false
    }
  }

  return { modelLoaded, modelLoading, isRunning, downloadProgress, downloadStatus, errorMessage, loadModel, runInpainting }
}
