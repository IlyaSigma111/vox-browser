package com.vox.browser.web

import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import android.widget.Toast
import org.json.JSONObject
import java.io.File

/**
 * `window.AndroidVox` — the native side of the React UI bridge.
 * Mirrors the Electron preload's `window.onyx` surface.
 */
class Bridge(
    private val context: Context,
    private val appWebView: WebView,
    private val tabs: TabManager,
) {

    private val dataDir: File = File(context.filesDir, "vox-data")

    init {
        dataDir.mkdirs()
    }

    // ─── Data (settings/bookmarks/history persist, same files as Electron) ───

    @android.webkit.JavascriptInterface
    fun readData(file: String): String {
        return try {
            val f = File(dataDir, file)
            if (f.exists()) f.readText() else ""
        } catch (_: Exception) { "" }
    }

    @android.webkit.JavascriptInterface
    fun writeData(file: String, data: String) {
        try {
            val f = File(dataDir, file)
            f.parentFile?.mkdirs()
            f.writeText(data)
        } catch (_: Exception) {}
    }

    // ─── Tabs ───────────────────────────────────────────────────────────────

    @android.webkit.JavascriptInterface
    fun createTab(id: String, url: String) = tabs.createTab(id, url)

    @android.webkit.JavascriptInterface
    fun destroyTab(id: String) = tabs.destroyTab(id)

    @android.webkit.JavascriptInterface
    fun setActiveTab(id: String) = tabs.setActiveTab(id)

    @android.webkit.JavascriptInterface
    fun navigate(id: String, url: String) = tabs.navigate(id, url)

    @android.webkit.JavascriptInterface
    fun reload(id: String) = tabs.reload(id)

    @android.webkit.JavascriptInterface
    fun goBack(id: String) = tabs.goBack(id)

    @android.webkit.JavascriptInterface
    fun goForward(id: String) = tabs.goForward(id)

    @android.webkit.JavascriptInterface
    fun setZoom(id: String, zoom: Double) = tabs.setZoom(id, zoom.toFloat())

    @android.webkit.JavascriptInterface
    fun setAudioMuted(id: String, muted: Boolean) = tabs.setAudioMuted(id, muted)

    @android.webkit.JavascriptInterface
    fun setInjections(id: String, js: String) = tabs.evaluate(id, js)

    @android.webkit.JavascriptInterface
    fun evaluate(id: String, js: String): String = tabs.evaluate(id, js)

    @android.webkit.JavascriptInterface
    fun setAdblock(enabled: Boolean) {
        AdBlock.adblockEnabled = enabled
    }

    @android.webkit.JavascriptInterface
    fun setPrivacy(cfgJson: String) {
        try {
            val cfg = JSONObject(cfgJson)
            val ua = cfg.optString("ua").ifEmpty { null }
            tabs.uaOverride = ua ?: ""
            AdBlock.trackhideEnabled = cfg.optBoolean("trackhide")
        } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun setThemeBg(color: String) {
        try { tabs.themeBg = Color.parseColor(color) } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun openExternal(url: String) {
        try {
            val i = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(i)
        } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun quit() {
        android.os.Process.killProcess(android.os.Process.myPid())
    }

    // ─── Rect / overlay ─────────────────────────────────────────────────────

    @android.webkit.JavascriptInterface
    fun setMainRect(x: Double, y: Double, w: Double, h: Double) {
        tabs.onMainRect?.invoke(x, y, w, h)
    }

    // ─── Clipboard ──────────────────────────────────────────────────────────

    @android.webkit.JavascriptInterface
    fun readClipboard(): String {
        return try {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.primaryClip?.getItemAt(0)?.text?.toString() ?: ""
        } catch (_: Exception) { "" }
    }

    @android.webkit.JavascriptInterface
    fun writeClipboard(s: String) {
        try {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(android.content.ClipData.newPlainText("vox", s))
        } catch (_: Exception) {}
    }

    // ─── Shots ──────────────────────────────────────────────────────────────

    @android.webkit.JavascriptInterface
    fun saveShot(b64: String, name: String) {
        try {
            val bytes = android.util.Base64.decode(b64, android.util.Base64.DEFAULT)
            val dir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: context.filesDir
            dir.mkdirs()
            File(dir, name).writeBytes(bytes)
            appWebView.post { Toast.makeText(context, "Снимок: " + name, Toast.LENGTH_SHORT).show() }
        } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun copyImage(b64: String) {
        try {
            val bytes = android.util.Base64.decode(b64, android.util.Base64.DEFAULT)
            val bmp = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(android.content.ClipData.newUri(context.contentResolver, "vox-shot", saveToMedia(bytes, "vox-shot-${System.currentTimeMillis()}.png")))
        } catch (_: Exception) {}
    }

    private fun saveToMedia(bytes: ByteArray, name: String): Uri {
        val dir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: context.filesDir
        dir.mkdirs()
        val f = File(dir, name)
        f.writeBytes(bytes)
        return Uri.fromFile(f)
    }

    // ─── Cookies / cache ────────────────────────────────────────────────────

    @android.webkit.JavascriptInterface
    fun getCookies(): String {
        return try {
            val cm = CookieManager.getInstance()
            val url = tabs.currentUrl()
            if (url.isNullOrBlank() || url == "about:blank") return "[]"
            val raw = cm.getCookie(url) ?: return "[]"
            val arr = org.json.JSONArray()
            for (pair in raw.split(";")) {
                val kv = pair.trim().split("=", limit = 2)
                if (kv.size == 2) {
                    arr.put(JSONObject().put("name", kv[0]).put("domain", Uri.parse(url).host).put("expires", 0))
                }
            }
            arr.toString()
        } catch (_: Exception) { "[]" }
    }

    @android.webkit.JavascriptInterface
    fun clearSiteData(origin: String) {
        try {
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
            WebStorage.getInstance().deleteAllData()
            appWebView.post { appWebView.clearCache(true) }
        } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun clearAllCookies() {
        try {
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
        } catch (_: Exception) {}
    }

    @android.webkit.JavascriptInterface
    fun clearCache() {
        try {
            appWebView.post { appWebView.clearCache(true) }
        } catch (_: Exception) {}
    }

    // ─── External URL handling ───────────────────────────────────────────────

    fun navFromIntent(url: String) {
        tabs.dispatchNavRequest(url)
    }
}
