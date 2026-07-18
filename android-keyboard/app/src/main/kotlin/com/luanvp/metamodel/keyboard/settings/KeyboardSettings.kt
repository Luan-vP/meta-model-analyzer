package com.luanvp.metamodel.keyboard.settings

import android.content.Context
import android.inputmethodservice.Keyboard
import android.inputmethodservice.Keyboard.Key

/**
 * UserDefaults-backed keyboard settings storage.
 *
 * Persists server URL, model name, and API key across sessions.
 */
class KeyboardSettings(context: Context) {

    private val prefs = context.getSharedPreferences(
        KEYBOARD_PREFS_NAME,
        Context.MODE_PRIVATE,
    )

    companion object {
        private const val KEYBOARD_PREFS_NAME = "metamodel_keyboard_settings"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_MODEL_NAME = "model_name"
        private const val KEY_API_KEY = "api_key"
        private const val KEY_DEBOUNCE_MS = "debounce_ms"

        const val DEFAULT_SERVER_URL = "http://localhost:11434/v1"
        const val DEFAULT_MODEL_NAME = "llama3.1:8b"
        const val DEFAULT_DEBOUNCE_MS = 800
    }

    fun getServerUrl(): String = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL)!!

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getModelName(): String = prefs.getString(KEY_MODEL_NAME, DEFAULT_MODEL_NAME)!!

    fun setModelName(name: String) {
        prefs.edit().putString(KEY_MODEL_NAME, name).apply()
    }

    fun getApiKey(): String? = prefs.getString(KEY_API_KEY, null)

    fun setApiKey(key: String?) {
        prefs.edit().putString(KEY_API_KEY, key).apply()
    }

    fun getDebounceMs(): Long = prefs.getLong(KEY_DEBOUNCE_MS, DEFAULT_DEBOUNCE_MS.toLong())

    fun setDebounceMs(ms: Long) {
        prefs.edit().putLong(KEY_DEBOUNCE_MS, ms).apply()
    }

    /**
     * Get the keyboard layout. For now returns the default QWERTY layout
     * defined in res/xml/keyboard_qwerty.xml.
     */
    fun getKeyboardLayout(): Keyboard {
        return Keyboard(context, com.luanvp.metamodel.keyboard.R.xml.keyboard_qwerty)
    }
}
