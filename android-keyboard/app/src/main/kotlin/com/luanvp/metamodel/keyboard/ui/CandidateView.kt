package com.luanvp.metamodel.keyboard.ui

import android.content.Context
import android.graphics.Color
import android.graphics.Paint
import android.text.SpannableString
import android.text.style.UnderlineSpan
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.luanvp.metamodel.keyboard.R
import com.luanvp.metamodel.keyboard.analysis.Annotation

/**
 * Candidate suggestion bar displayed above the keyboard keys.
 *
 * Shows Meta-Model violations as red-underlined chips. Tapping a chip
 * triggers the callback with the corresponding annotation (challenge question).
 *
 * Mirrors the "spelling error" UI pattern — each chip looks like a misspelled
 * word with a red squiggle underneath.
 */
class CandidateView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0,
) : HorizontalScrollView(context, attrs, defStyleAttr) {

    private val chipContainer: LinearLayout
    var onChipClickListener: ((Annotation) -> Unit)? = null

    init {
        LayoutInflater.from(context).inflate(R.layout.candidate_bar, this, true)
        chipContainer = findViewById(R.id.chipContainer)
        fillViewport = true
    }

    /**
     * Update the candidate bar with new annotations.
     * Clears existing chips and creates new ones.
     */
    fun updateChips(annotations: List<Annotation>) {
        chipContainer.removeAllViews()

        if (annotations.isEmpty()) {
            visibility = View.GONE
            return
        }

        visibility = View.VISIBLE

        for (annotation in annotations) {
            val chip = createChip(annotation)
            chipContainer.addView(chip)
        }
    }

    /**
     * Clear all chips from the candidate bar.
     */
    fun clear() {
        chipContainer.removeAllViews()
        visibility = View.GONE
    }

    private fun createChip(annotation: Annotation): TextView {
        val textView = TextView(context).apply {
            text = formatChipText(annotation.text)
            setPadding(
                dpToPx(8),
                dpToPx(4),
                dpToPx(8),
                dpToPx(4),
            )
            background = context.getDrawable(R.drawable.candidate_chip_background)
            textSize = 14f
            setSingleLine(true)
            ellipsize = android.text.TextUtils.TruncateAt.END
            maxWidth = dpToPx(200)
        }

        textView.setOnClickListener {
            onChipClickListener?.invoke(annotation)
        }

        return textView
    }

    /**
     * Format the annotation text as a "spelling error" — red wavy underline.
     * Uses a custom span that draws the red underline independently of text color.
     */
    private fun formatChipText(text: String): CharSequence {
        val spannable = SpannableString(text)
        spannable.setSpan(
            object : android.text.style.MetricAffectingSpan() {
                override fun updateDrawState(ds: TextPaint) {
                    ds.flags = ds.flags or Paint.UnderlineText_FLAG
                    // Underline inherits the paint color; we draw our own below
                }

                override fun updateMeasureState(paint: TextPaint) {
                    paint.flags = paint.flags or Paint.UnderlineText_FLAG
                }
            },
            0,
            text.length,
            android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
        // Set the text color to the violation red so the underline matches
        spannable.setSpan(
            object : android.text.style.CharacterStyle() {
                override fun updateDrawState(ds: TextPaint) {
                    ds.color = Color.rgb(220, 53, 69) // Bootstrap danger red
                    ds.flags = ds.flags or Paint.UnderlineText_FLAG
                }

                override fun updateMeasureState(paint: TextPaint) {
                    paint.flags = paint.flags or Paint.UnderlineText_FLAG
                }
            },
            0,
            text.length,
            android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
        return spannable
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
