package com.luanvp.metamodel.keyboard.settings

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.luanvp.metamodel.keyboard.R
import com.luanvp.metamodel.keyboard.databinding.SettingsLayoutBinding

/**
 * Settings screen for the Meta-Model keyboard.
 *
 * Allows the user to configure:
 * - On-device LLM server URL (default: localhost:11434/v1 for Ollama)
 * - Model name
 * - API key (optional, for servers that require auth)
 * - Analysis debounce delay
 */
class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: SettingsLayoutBinding
    private val settings by lazy { KeyboardSettings(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = SettingsLayoutBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadSettings()
        setupSaveButton()
    }

    private fun loadSettings() {
        binding.serverUrlEditText.setText(settings.getServerUrl())
        binding.modelNameEditText.setText(settings.getModelName())
        binding.apiKeyEditText.setText(settings.getApiKey() ?: "")
        binding.debounceEditText.setText(settings.getDebounceMs().toString())
    }

    private fun setupSaveButton() {
        binding.saveButton.setOnClickListener {
            val serverUrl = binding.serverUrlEditText.text.toString().trim()
            val modelName = binding.modelNameEditText.text.toString().trim()
            val apiKey = binding.apiKeyEditText.text.toString().trim()
            val debounceText = binding.debounceEditText.text.toString().trim()

            if (serverUrl.isEmpty()) {
                binding.serverUrlEditText.error = "Required"
                return@setOnClickListener
            }
            if (modelName.isEmpty()) {
                binding.modelNameEditText.error = "Required"
                return@setOnClickListener
            }

            settings.setServerUrl(serverUrl)
            settings.setModelName(modelName)
            settings.setApiKey(apiKey.ifEmpty { null })

            debounceText.toIntOrNull()?.let { ms ->
                if (ms in 200..5000) {
                    settings.setDebounceMs(ms.toLong())
                }
            }

            Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
}
