package com.luanvp.metamodel.keyboard

import android.app.Application
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

/**
 * Application entry point. Configures the shared OkHttp client used by
 * the analysis pipeline to talk to the on-device LLM server.
 */
class KeyboardApplication : Application() {

    val httpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor()
        logging.level = if (BuildConfig.DEBUG)
            HttpLoggingInterceptor.Level.BODY
        else
            HttpLoggingInterceptor.Level.HEADERS

        OkHttpClient.Builder()
            .connectTimeout(5, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .addInterceptor(logging)
            .build()
    }
}
