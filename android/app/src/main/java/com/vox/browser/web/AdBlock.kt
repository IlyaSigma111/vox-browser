package com.vox.browser.web

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Mirrors the Electron ad/tracker blocking (electron/main.js AD_HOSTS / TRACK_HOSTS).
 * Blocks by registrable-domain suffix on both subresources and navigations.
 */
object AdBlock {

    private val AD_DOMAINS = setOf(
        "doubleclick.net", "googlesyndication.com", "googleadservices.com", "google-analytics.com",
        "googletagmanager.com", "facebook.com", "facebook.net", "twitter.com", "x.com", "t.co",
        "adnxs.com", "adsrvr.org", "taboola.com", "outbrain.com", "criteo.com", "rubiconproject.com",
        "moatads.com", "advertising.com", "yieldmo.com", "pubmatic.com", "openx.net", "amazon-adsystem.com",
        "scorecardresearch.com", "quantserve.com", "sharethrough.com", "teads.tv", "spotxchange.com",
        "adroll.com", "bing.com", "adform.net", "casalemedia.com", "sovrn.com", "media.net",
        "analytics.yahoo.com", "flurry.com", "branch.io", "segment.com", "mixpanel.com", "hotjar.com",
        "fullstory.com", "crazyegg.com", "newrelic.com", "amplitude.com", "intercom.io", "drift.com",
        "optimizely.com", "vwo.com", "mouseflow.com", "smartadserver.com", "undertone.com",
    )

    private val TRACK_DOMAINS = setOf(
        "hubspot.com", "pardot.com", "salesloft.com", "outreach.io", "liveperson.com", "genesys.com",
        "evergage.com", "insightgrit.com", "clarity.ms", "adobe.com", "demandbase.com", "6sense.com",
        "zoominfo.com", "bombora.com", "g2crowd.com", "trustpilot.com", "reviews.io", "pricepirates.com",
        "appsflyer.com", "adjust.com", "kochava.com", "singular.net", "attribution-app.com",
    )

    @Volatile var adblockEnabled = false
    @Volatile var trackhideEnabled = false

    private fun domainOf(host: String): String {
        val parts = host.split('.')
        return if (parts.size >= 2) parts.slice(parts.size - 2 until parts.size).joinToString(".") else host
    }

    fun shouldBlock(url: String?): Boolean {
        if ((!adblockEnabled && !trackhideEnabled) || url.isNullOrEmpty()) return false
        val host = runCatching { android.net.Uri.parse(url).host }.getOrNull()?.lowercase() ?: return false
        if (host.isEmpty()) return false
        val domain = domainOf(host)
        if (adblockEnabled && AD_DOMAINS.contains(domain)) return true
        if (trackhideEnabled && TRACK_DOMAINS.contains(domain)) return true
        return false
    }

    /** Client whose shouldInterceptRequest blocks known ad/tracker domains. */
    fun wrap(base: WebViewClient): WebViewClient = object : WebViewClient() {
        override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
            if (request != null && shouldBlock(request.url?.toString())) {
                return WebResourceResponse("text/plain", "utf-8", java.io.ByteArrayInputStream(ByteArray(0)))
            }
            return super.shouldInterceptRequest(view, request)
        }
    }
}
