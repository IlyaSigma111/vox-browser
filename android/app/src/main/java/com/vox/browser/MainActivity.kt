package com.vox.browser

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.PopupMenu
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.vox.browser.web.Bridge
import com.vox.browser.web.TabManager

@SuppressLint("SetJavaScriptEnabled")
class MainActivity : AppCompatActivity() {

    private lateinit var tabs: TabManager
    private lateinit var bridge: Bridge
    private lateinit var appWebView: WebView
    private lateinit var tabLayer: FrameLayout
    private lateinit var addressBar: EditText
    private lateinit var barBack: TextView
    private lateinit var barFwd: TextView

    private var externalUrlPending: String? = null
    private var appLoaded = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val density = resources.displayMetrics.density

        // ─── Root layout ──────────────────────────────────────────────────
        val root = FrameLayout(this)
        root.setBackgroundColor(Color.parseColor("#0d0f17"))

        // Native top chrome bar (landscape toolbar: nav + address + menu)
        val barH = (54 * density).toInt()
        val bar = LinearLayout(this)
        bar.orientation = LinearLayout.HORIZONTAL
        bar.gravity = Gravity.CENTER_VERTICAL
        bar.setBackgroundColor(Color.parseColor("#151823"))
        val barParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, barH)
        barParams.gravity = Gravity.TOP
        root.addView(bar, barParams)

        barBack = navButton("\u25C0", 40, "Назад")
        barFwd = navButton("\u25B6", 40, "Вперёд")
        bar.addView(barBack)
        bar.addView(barFwd)

        val home = navButton("\u2302", 40, "Домой")
        home.setOnClickListener {
            tabs.dispatchNavRequest("about:blank")
            hideKeyboard(addressBar)
        }
        bar.addView(home)

        addressBar = EditText(this)
        addressBar.hint = "Введите адрес или запрос"
        addressBar.setTextColor(Color.WHITE)
        addressBar.setHintTextColor(Color.parseColor("#8a93a8"))
        addressBar.textSize = 14f
        addressBar.typeface = Typeface.MONOSPACE
        addressBar.setBackgroundColor(Color.parseColor("#1f2333"))
        addressBar.setSingleLine(true)
        addressBar.imeOptions = EditorInfo.IME_ACTION_GO
        addressBar.inputType = EditorInfo.TYPE_CLASS_TEXT or EditorInfo.TYPE_TEXT_VARIATION_URI
        val pad = (12 * density).toInt()
        addressBar.setPadding(pad, 0, pad, 0)
        val addrParams = LinearLayout.LayoutParams(0, (38 * density).toInt(), 1f)
        addrParams.setMargins((6 * density).toInt(), 0, (6 * density).toInt(), 0)
        bar.addView(addressBar, addrParams)
        addressBar.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                submitAddress()
                true
            } else false
        }

        val menuBtn = navButton("\u22EE", 40, "Меню")
        menuBtn.setOnClickListener { showMenu(menuBtn) }
        bar.addView(menuBtn)

        // ─── App host (React UI) below the bar ────────────────────────────
        val appHost = FrameLayout(this)
        val appHostParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        appHostParams.topMargin = barH
        root.addView(appHost, appHostParams)

        appWebView = WebView(this)
        appWebView.settings.javaScriptEnabled = true
        appWebView.settings.domStorageEnabled = true
        appWebView.settings.databaseEnabled = true
        appWebView.settings.allowFileAccess = true
        appWebView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        appWebView.setBackgroundColor(Color.parseColor("#0d0f17"))
        appWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val u = request?.url?.toString() ?: return false
                if (u.startsWith("http://") || u.startsWith("https://")) {
                    tabs.dispatchNavRequest(u)
                    return true
                }
                if (u.startsWith("mailto:") || u.startsWith("tel:")) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u))) } catch (_: Exception) {}
                    return true
                }
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                appLoaded = true
                externalUrlPending?.let {
                    externalUrlPending = null
                    tabs.dispatchNavRequest(it)
                }
            }
        }
        appHost.addView(appWebView, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // Layer where tab WebViews are drawn, aligned to React `.main`
        tabLayer = FrameLayout(this)
        tabLayer.setBackgroundColor(Color.TRANSPARENT)
        appHost.addView(tabLayer, FrameLayout.LayoutParams(0, 0))

        setContentView(root)

        // ─── Managers ─────────────────────────────────────────────────────
        tabs = TabManager(this, appWebView, tabLayer)
        bridge = Bridge(this, appWebView, tabs)
        appWebView.addJavascriptInterface(bridge, "AndroidVox")

        tabs.onActiveTabChange = { url, title ->
            runOnUiThread {
                val focused = addressBar.hasFocus()
                if (!focused) {
                    addressBar.setText(if (url.isNotEmpty() && url != "about:blank") url else "")
                }
                if (url.isNotEmpty() && url != "about:blank") setActivityTitle(url, title)
                else this.title = "Vox"
            }
        }
        tabs.onMainRect = { x, y, w, h ->
            runOnUiThread {
                val lp = FrameLayout.LayoutParams((w * density).toInt(), (h * density).toInt())
                lp.leftMargin = (x * density).toInt()
                lp.topMargin = (y * density).toInt()
                tabLayer.layoutParams = lp
            }
        }
        tabs.onDownloadStart = { url, filename, total ->
            runOnUiThread {
                val name = filename.substringAfterLast('/').ifEmpty { filename }
                android.widget.Toast.makeText(this, "Скачивание: $name", android.widget.Toast.LENGTH_SHORT).show()
                bridgeDownloadEvent(url, name, total)
            }
        }

        barBack.setOnClickListener {
            tabs.goBack(tabs.currentActiveId())
            hideKeyboard(addressBar)
        }
        barFwd.setOnClickListener {
            tabs.goForward(tabs.currentActiveId())
            hideKeyboard(addressBar)
        }

        // Dark edge tint
        window.statusBarColor = Color.parseColor("#0d0f17")
        window.navigationBarColor = Color.parseColor("#0d0f17")

        // ─── Load the React UI ────────────────────────────────────────────
        appWebView.loadUrl("file:///android_asset/app/index.html")

        // External VIEW intents (opened as browser)
        handleIntent(intent)
    }

    private fun submitAddress() {
        val text = addressBar.text.toString().trim()
        if (text.isEmpty()) return
        hideKeyboard(addressBar)
        tabs.dispatchNavRequest(text)
    }

    private fun showMenu(anchor: View) {
        val menu = PopupMenu(this, anchor)
        menu.menu.add(0, 1, 0, "Новая вкладка")
        menu.menu.add(0, 2, 1, "Закрыть вкладку")
        menu.menu.add(0, 3, 2, "Настройки")
        menu.menu.add(0, 4, 3, "Магазин")
        menu.menu.add(0, 5, 4, "Выйти")
        menu.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                1 -> tabs.dispatchNavRequest("about:blank")
                2 -> tabs.closeActive()
                3 -> tabs.dispatchNavRequest("vox:settings")
                4 -> tabs.dispatchNavRequest("vox:store")
                5 -> bridge.quit()
            }
            true
        }
        menu.show()
    }

    private fun navButton(text: String, sizeDp: Int, desc: String): TextView {
        val density = resources.displayMetrics.density
        val btn = TextView(this)
        btn.text = text
        btn.setTextColor(Color.parseColor("#c6cbd9"))
        btn.textSize = 17f
        btn.gravity = Gravity.CENTER
        btn.typeface = Typeface.DEFAULT_BOLD
        btn.setBackgroundColor(Color.TRANSPARENT)
        btn.contentDescription = desc
        btn.isClickable = true
        val sz = (sizeDp * density).toInt()
        val lp = LinearLayout.LayoutParams(sz, sz)
        btn.layoutParams = lp
        return btn
    }

    private fun setActivityTitle(url: String, title: String) {
        val host = runCatching { Uri.parse(url).host }.getOrNull()
        this.title = (if (host != null) "$title — $host" else title).take(80)
    }

    private fun hideKeyboard(view: View) {
        val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as android.view.inputmethod.InputMethodManager
        imm.hideSoftInputFromWindow(view.windowToken, 0)
    }

    private fun bridgeDownloadEvent(url: String, filename: String, total: Long) {
        val js = "window.voxDlStart&&window.voxDlStart(" +
            "JSON.parse('" + "{\"url\":\"${url.replace("\"", "\\\"")}\",\"filename\":\"${filename.replace("\"", "\\\"")}\",\"totalBytes\":$total,\"id\":\"dl-${System.currentTimeMillis()}\"}".replace("'", "\\'") + "'))"
        try { appWebView.evaluateJavascript(js, null) } catch (_: Exception) {}
    }

    override fun onBackPressed() {
        if (tabs.goBackOrClose()) return
        if (!appWebView.canGoBack()) {
            moveTaskToBack(true)
            return
        }
        super.onBackPressed()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        val url = intent?.data?.toString() ?: return
        if (!url.startsWith("http://") && !url.startsWith("https://")) return
        if (appLoaded) tabs.dispatchNavRequest(url)
        else externalUrlPending = url
    }

    override fun onDestroy() {
        try { tabs.shutdown() } catch (_: Exception) {}
        super.onDestroy()
    }
}
