package com.ashirwadtech.apnavyaapar;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

/**
 * Apna Vyaapar Native Android App
 * Directly connected to the shared MongoDB Atlas Cloud Database via https://ashirwad-computer.vercel.app
 * Supports real-time multi-device sync, WhatsApp invoice sharing, UPI intents, PDF downloads, and camera OCR.
 */
public class MainActivity extends AppCompatActivity {

    private static final String APP_URL = "https://ashirwad-computer.vercel.app";
    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ValueCallback<Uri[]> uploadMessage;
    private static final int FILE_CHOOSER_RESULT_CODE = 1001;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Deep Navy Status Bar matching Apna Vyaapar design system (#0f172a)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("#0f172a"));
        }

        swipeRefreshLayout = new SwipeRefreshLayout(this);
        webView = new WebView(this);
        swipeRefreshLayout.addView(webView);
        setContentView(swipeRefreshLayout);

        // Configure persistent cookies so login sessions stay active
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUserAgentString(settings.getUserAgentString() + " ApnaVyaaparAndroid/2.0");

        // Pull-to-refresh triggers instant cloud database sync
        swipeRefreshLayout.setColorSchemeColors(Color.parseColor("#2563eb"));
        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('cloudDataSynced')); location.reload();",
                null
            );
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Native handling for WhatsApp, UPI payments, Phone calls, and Email
                if (url.startsWith("whatsapp:") ||
                    url.startsWith("https://wa.me/") ||
                    url.startsWith("https://api.whatsapp.com/") ||
                    url.startsWith("upi:") ||
                    url.startsWith("tel:") ||
                    url.startsWith("mailto:")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Required app not installed on phone", Toast.LENGTH_SHORT).show();
                    }
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                swipeRefreshLayout.setRefreshing(false);
                CookieManager.getInstance().flush();
                super.onPageFinished(view, url);
            }
        });

        // Support Camera / Gallery selection for Supplier Bill AI OCR & Product Images
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (uploadMessage != null) {
                    uploadMessage.onReceiveValue(null);
                }
                uploadMessage = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE);
                } catch (Exception e) {
                    uploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        // Native PDF Invoice & Backup Download Manager
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    if (url.startsWith("blob:")) {
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setData(Uri.parse(url));
                        startActivity(i);
                        return;
                    }
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    String cookies = CookieManager.getInstance().getCookie(url);
                    request.addRequestHeader("cookie", cookies);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading Apna Vyaapar Invoice...");
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                    request.setTitle(fileName);
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(getApplicationContext(), "Downloading " + fileName, Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                }
            }
        });

        webView.loadUrl(APP_URL);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            // Trigger immediate cloud sync whenever user switches back to the Android app
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('cloudDataSynced'));", null);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (uploadMessage == null) return;
            uploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            uploadMessage = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
