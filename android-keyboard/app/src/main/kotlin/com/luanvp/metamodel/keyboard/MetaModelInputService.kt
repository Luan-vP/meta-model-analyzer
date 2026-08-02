package com.luanvp.metamodel.keyboard

import android.inputmethodservice.Keyboard
import android.inputmethodservice.KeyboardView
import android.inputmethodservice.InputMethodService
import android.view.LayoutInflater
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.ExtractedTextRequest
import com.luanvp.metamodel.keyboard.analysis.Annotation
import com.luanvp.metamodel.keyboard.analysis.MetaModelAnalyzer
import com.luanvp.metamodel.keyboard.settings.KeyboardSettings
import com.luanvp.metamodel.keyboard.ui.CandidateView
import kotlinx.coroutines.*

/**
 * Core InputMethodService for the Meta-Model keyboard.
 *
 * Renders a QWERTY keyboard with a candidate bar above it. The candidate bar
 * displays Meta-Model violations as red-underlined "spelling error" chips.
 * Tapping a chip shows the challenge question.
 *
 * Analysis is debounced (800ms default) and runs on IO dispatcher. The
 * analysis text is extracted from the host app's input field via
 * InputConnection.getExtractedText().
 */
class MetaModelInputService : InputMethodService(),
    KeyboardView.OnKeyboardActionListener {

    private val settings by lazy { KeyboardSettings(this) }
    private val analyzer by lazy {
        MetaModelAnalyzer(
            (application as KeyboardApplication).httpClient,
            settings,
        )
    }

    private var keyboardView: KeyboardView? = null
    private var candidateView: CandidateView? = null
    private var keyboard: Keyboard? = null

    // Debounce state
    private val serviceScope = CoroutineScope(SupervisorJob())
    private var debounceJob: Job? = null
    private val debounceDelayMs: Long
        get() = settings.getDebounceMs()

    // ── InputMethodService lifecycle ─────────────────────────────────

    override fun onCreateInputView(): View {
        val root = LayoutInflater.from(this)
            .inflate(R.layout.keyboard_main, null)

        keyboardView = root.findViewById<KeyboardView>(R.id.keyboard)
        keyboardView?.apply {
            setKeyboard(getKeyboard())
            setOnKeyboardActionListener(this@MetaModelInputService)
        }

        candidateView = root.findViewById<CandidateView>(R.id.candidateView)
        candidateView?.onChipClickListener = { annotation: Annotation ->
            onChipClicked(annotation)
        }

        return root
    }

    override fun onCreateCandidatesView(): View {
        // Candidate bar is embedded in keyboard_main.xml
        return View(this)
    }

    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        candidateView?.clear()
    }

    override fun onFinishInputView(finishingInput: Boolean) {
        super.onFinishInputView(finishingInput)
        cancelPendingAnalysis()
    }

    // ── Keyboard key handling ────────────────────────────────────────

    private fun getKeyboard(): Keyboard {
        if (keyboard != null) return keyboard!!
        keyboard = Keyboard(this, R.xml.keyboard_qwerty)
        return keyboard!!
    }

    override fun onKey(primaryCode: Int, keyCodes: IntArray?) {
        val ic = currentInputConnection ?: return

        when (primaryCode) {
            -1 -> {
                // Shift
                ic.sendKeyEvent(android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN,
                    android.view.KeyEvent.KEYCODE_SHIFT_LEFT
                ))
            }
            -2 -> {
                // Right shift
                ic.sendKeyEvent(android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN,
                    android.view.KeyEvent.KEYCODE_SHIFT_RIGHT
                ))
            }
            -3 -> {
                // 123 — symbol mode (not implemented in v1)
            }
            -4 -> {
                // Done / Enter
                ic.sendKeyEvent(android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN,
                    android.view.KeyEvent.KEYCODE_ENTER
                ))
                scheduleAnalysis()
            }
            -5 -> {
                // Backspace
                ic.deleteSurroundingText(1, 0)
                scheduleAnalysis()
            }
            32 -> {
                // Space
                ic.commitText(" ", 1)
                scheduleAnalysis()
            }
            else -> {
                // Regular character
                ic.commitText(primaryCode.toChar().toString(), 1)
                scheduleAnalysis()
            }
        }
    }

    override fun onPress(primaryCode: Int) {}
    override fun onRelease(primaryCode: Int) {}
    override fun onText(text: CharSequence?) {}
    override fun swipeLeft() {}
    override fun swipeRight() {}
    override fun swipeDown() {}
    override fun swipeUp() {}

    // ── Analysis pipeline ────────────────────────────────────────────

    private fun scheduleAnalysis() {
        cancelPendingAnalysis()
        debounceJob = serviceScope.launch {
            delay(debounceDelayMs)
            performAnalysis()
        }
    }

    private fun cancelPendingAnalysis() {
        debounceJob?.cancel()
        debounceJob = null
    }

    private fun performAnalysis() {
        val text = getCurrentText() ?: return
        if (text.length < 10) {
            candidateView?.clear()
            return
        }

        serviceScope.launch(Dispatchers.IO) {
            try {
                val annotations = analyzer.analyze(text)
                withContext(Dispatchers.Main) {
                    candidateView?.updateChips(annotations)
                }
            } catch (e: Exception) {
                android.util.Log.e("MetaModelIME", "Analysis failed", e)
                withContext(Dispatchers.Main) {
                    candidateView?.clear()
                }
            }
        }
    }

    /**
     * Extract current text from the host app's input field.
     */
    private fun getCurrentText(): String? {
        val ic = currentInputConnection ?: return null
        val request = ExtractedTextRequest().apply {
            // Get a large window around the cursor
            flags = 0
        }
        val extracted = ic.getExtractedText(request, 0) ?: return null
        return extracted.text.toString()
    }

    // ── Chip interaction ─────────────────────────────────────────────

    private fun onChipClicked(annotation: Annotation) {
        android.widget.Toast.makeText(
            this,
            annotation.challengeQuestion,
            android.widget.Toast.LENGTH_LONG,
        ).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
