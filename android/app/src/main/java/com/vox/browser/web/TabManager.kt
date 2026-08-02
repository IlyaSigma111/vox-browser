package com.vox.browser.web

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.MimeTypeMap
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * One native WebView per tab, drawn on a layer aligned to the React `.main` rect
 * (setMainRect). WebViews are created lazily on activation; inactive tabs are just
 * lightweight URL records. Events are replayed to the React UI via window.voxNativeMessage.
 */
@SuppressLint("SetJavaScriptEnabled")
class TabManager(
    private val context: Context,
    private val appWebView: WebView,
    private val tabLayer: FrameLayout,
) {

    class Tab(val id: String, var url: String) {
        var title: String = ""
        var favicon: String = ""
        var loading: Boolean = false
        var zoom: Float = 1f
        var muted: Boolean = false
        var webView: WebView? = null
        val pendingInjection = mutableListOf<String>()
        var pendingNav: String? = null
    }

    private val ui = Handler(Looper.getMainLooper())
    private val tabs = LinkedHashMap<String, Tab>()
    private var activeId: String = ""

    @Volatile var themeBg: Int = Color.parseColor("#16161e")
    @Volatile var uaOverride: String = ""

    var onActiveTabChange: ((url: String, title: String) -> Unit)? = null
    var onDownloadStart: ((url: String, filename: String, total: Long) -> Unit)? = null
    var onMainRect: ((x: Double, y: Double, w: Double, h: Double) -> Unit)? = null

    // ─── Lifecycle from JS bridge ───────────────────────────────────────────

    fun createTab(id: String, url: String) {
        ui.post {
            val t = tabs[id] ?: Tab(id, url).also { tabs[id] = it }
            t.url = url
            if (id == activeId && isRealUrl(url)) ensureWebView(t)?.loadUrl(url)
        }
    }

    fun destroyTab(id: String) {
        ui.post {
            val t = tabs.remove(id) ?: return@post
            val wv = t.webView ?: return@post
            t.webView = null
            tabLayer.removeView(wv)
            wv.stopLoading()
            wv.clearHistory()
            wv.destroy()
            if (activeId == id) activeId = ""
        }
    }

    fun setActiveTab(id: String) {
        ui.post {
            val t = tabs[id] ?: return@post
            tabs.forEach { (k, v) -> if (k != id) v.webView?.visibility = View.GONE }
            activeId = id
            val wv = ensureWebView(t)
            wv.visibility = View.VISIBLE
            wv.bringToFront()
            t.pendingNav?.let {
                t.pendingNav = null
                wv.loadUrl(it)
            }
            fireBar()
        }
    }

    fun navigate(id: String, url: String) {
        ui.post {
            val t = tabs[id] ?: return@post
            t.url = url
            t.loading = true
            if (id == activeId && isRealUrl(url)) {
                val wv = ensureWebView(t)
                wv.loadUrl(url)
                fireBar()
            } else {
                t.pendingNav = url
            }
        }
    }

    fun reload(id: String) {
        ui.post { tabs[id]?.webView?.reload() }
    }

    fun goBack(id: String) {
        ui.post {
            val wv = tabs[id]?.webView ?: return@post
            if (wv.canGoBack()) wv.goBack()
        }
    }

    fun goForward(id: String) {
        ui.post {
            val wv = tabs[id]?.webView ?: return@post
            if (wv.canGoForward()) wv.goForward()
        }
    }

    fun setZoom(id: String, zoom: Float) {
        ui.post {
            val t = tabs[id] ?: return@post
            t.zoom = zoom
            val wv = t.webView ?: return@post
            wv.evaluateJavascript("document.body.style.zoom=" + zoom, null)
        }
    }

    fun setAudioMuted(id: String, muted: Boolean) {
        ui.post {
            val t = tabs[id] ?: return@post
            t.muted = muted
            val wv = t.webView ?: return@post
            try {
                wv.evaluateJavascript(
                    "(function(){var v=document.querySelectorAll('video,audio');for(var i=0;i<v.length;i++){v[i].muted=" + muted + "}})()",
                    null
                )
            } catch (_: Exception) {}
        }
    }

    /** Evaluate JS in a tab's page. Returns the JSON-encoded result ("null" when unavailable). */
    fun evaluate(id: String, js: String): String {
        val t = tabs[id]
        if (t == null) {
            tabs[id] = Tab(id, "").also { it.pendingInjection.add(js) }
            return "null"
        }
        val wv = t.webView
        if (wv == null) {
            // Page not created yet — queue the script; it runs on first load.
            t.pendingInjection.add(js)
            return "null"
        }
        var result = "null"
        val latch = CountDownLatch(1)
        ui.post { wv.evaluateJavascript(js) { r -> result = r ?: "null"; latch.countDown() } }
        try { latch.await(3, TimeUnit.SECONDS) } catch (_: InterruptedException) {}
        return result
    }

    // ─── Page injection ─────────────────────────────────────────────────────

    private fun runPendingInjection(t: Tab) {
        val wv = t.webView ?: return
        val list = t.pendingInjection.toList()
        t.pendingInjection.clear()
        for (js in list) {
            try { wv.evaluateJavascript(js, null) } catch (_: Exception) {}
        }
        if (t.muted) {
            try {
                wv.evaluateJavascript("(function(){var v=document.querySelectorAll('video,audio');for(var i=0;i<v.length;i++){v[i].muted=true}})()", null)
            } catch (_: Exception) {}
        }
        if (t.zoom != 1f) wv.evaluateJavascript("document.body.style.zoom=" + t.zoom, null)
    }

    // ─── WebView creation ───────────────────────────────────────────────────

    private fun ensureWebView(t: Tab): WebView {
        t.webView?.let { return it }
        val wv = WebView(context)
        val s = wv.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        s.databaseEnabled = true
        s.allowFileAccess = true
        s.allowContentAccess = true
        s.loadWithOverviewMode = true
        s.useWideViewPort = true
        s.setSupportZoom(true)
        s.builtInZoomControls = true
        s.displayZoomControls = false
        s.mediaPlaybackRequiresUserGesture = false
        s.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        s.cacheMode = WebSettings.LOAD_DEFAULT
        if (uaOverride.isNotEmpty()) s.userAgentString = uaOverride
        wv.setBackgroundColor(themeBg)
        wv.isVerticalScrollBarEnabled = false
        wv.isHorizontalScrollBarEnabled = false
        wv.webChromeClient = object : WebChromeClient() {
            override fun onReceivedTitle(view: WebView?, title: String?) {
                if (title.isNullOrEmpty()) return
                t.title = title
                dispatch("page-title-updated", t.id, mapOf("title" to title))
            }

            override fun onReceivedIcon(view: WebView?, icon: Bitmap?) {
                val url = view?.url ?: return
                if (icon == null) return
                try {
                    val data = "data:image/png;base64," + encodeBmp(icon)
                    t.favicon = data
                    dispatch("page-favicon-updated", t.id, mapOf("favicons" to JSONArray().put(data)))
                } catch (_: Exception) {}
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 100) {
                    t.loading = false
                    dispatch("did-stop-loading", t.id, emptyMap())
                }
            }
        }

        wv.webViewClient = AdBlock.wrap(object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                t.url = url ?: t.url
                t.loading = true
                dispatch("did-start-loading", t.id, mapOf("url" to t.url))
                dispatch("did-navigate", t.id, mapOf("url" to t.url))
                fireBar()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                if (url != null) {
                    t.url = url
                    dispatch("did-navigate", t.id, mapOf("url" to url))
                }
                runPendingInjection(t)
                dispatch("did-stop-loading", t.id, emptyMap())
                dispatch("dom-ready", t.id, mapOf("url" to (url ?: t.url)))
                fireBar()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: android.webkit.WebResourceError?) {
                if (request?.isForMainFrame == true) {
                    t.loading = false
                    dispatch("did-fail-load", t.id, mapOf(
                        "errorCode" to (error?.errorCode ?: -1),
                        "errorDescription" to (error?.description?.toString() ?: "error"),
                        "validatedURL" to (request.url?.toString() ?: ""),
                    ))
                }
            }
        })

        wv.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, contentLength ->
            try {
                val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                val filename = URLUtil.guessFileName(url, contentDisposition, mimetype)
                val req = DownloadManager.Request(Uri.parse(url))
                req.setMimeType(mimetype)
                req.addRequestHeader("User-Agent", userAgent ?: "")
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename)
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                dm.enqueue(req)
                onDownloadStart?.invoke(url, filename, contentLength)
            } catch (_: Exception) {}
        })

        tabLayer.addView(wv, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        t.webView = wv
        return wv
    }

    // ─── Events to React UI ─────────────────────────────────────────────────

    fun dispatch(event: String, tabId: String, data: Map<String, Any?>) {
        ui.post {
            val obj = JSONObject()
            obj.put("id", tabId)
            data.forEach { (k, v) ->
                when (v) {
                    is JSONArray -> obj.put(k, v)
                    null -> obj.put(k, JSONObject.NULL)
                    else -> obj.put(k, v)
                }
            }
            val js = "window.voxNativeMessage&&window.voxNativeMessage(" +
                JSONObject.quote(event) + "," + obj.toString() + ")"
            try { appWebView.evaluateJavascript(js, null) } catch (_: Exception) {}
            if (event == "page-title-updated" || event == "did-navigate") fireBar()
        }
    }

    /** Notify the native chrome bar about the active tab. */
    fun fireBar() {
        val t = tabs[activeId] ?: return
        onActiveTabChange?.invoke(t.url, t.title)
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private fun isRealUrl(u: String): Boolean = u.isNotEmpty() && u != "about:blank" && !u.startsWith("vox:")

    fun hasHistoryBack(): Boolean {
        val t = tabs[activeId] ?: return false
        val wv = t.webView ?: return false
        return wv.canGoBack()
    }

    fun goBackOrClose(): Boolean {
        val t = tabs[activeId] ?: return false
        val wv = t.webView ?: return false
        if (wv.canGoBack()) { wv.goBack(); return true }
        if (tabs.size > 1) {
            ui.post { destroyTab(activeId) }
            return true
        }
        return false
    }

    fun currentUrl(): String = tabs[activeId]?.url ?: ""

    fun currentActiveId(): String = activeId

    fun closeActive() {
        ui.post { destroyTab(activeId) }
    }

    fun reloadCurrent() {
        val t = tabs[activeId] ?: return
        t.webView?.reload() ?: navigate(t.id, t.url)
    }

    fun goHome() {
        // React decides the homepage; signal a nav-request to the active tab's blank state
        dispatchNavRequest("about:blank")
    }

    fun navigateActive(url: String) {
        val t = tabs[activeId] ?: return
        navigate(t.id, url)
    }

    fun dispatchNavRequest(text: String) {
        ui.post {
            val obj = JSONObject().put("text", text)
            val js = "window.voxNativeMessage&&window.voxNativeMessage(" +
                JSONObject.quote("nav-request") + "," + obj.toString() + ")"
            try { appWebView.evaluateJavascript(js, null) } catch (_: Exception) {}
        }
    }

    // ─── Cleanup ────────────────────────────────────────────────────────────

    fun shutdown() {
        ui.post {
            tabs.forEach { (_, t) ->
                t.webView?.let { wv ->
                    tabLayer.removeView(wv)
                    wv.stopLoading()
                    wv.destroy()
                }
                t.webView = null
            }
            tabs.clear()
            activeId = ""
        }
    }

    private fun encodeBmp(bmp: Bitmap): String {
        val out = java.io.ByteArrayOutputStream()
        bmp.compress(Bitmap.CompressFormat.PNG, 90, out)
        return android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP)
    }
}
