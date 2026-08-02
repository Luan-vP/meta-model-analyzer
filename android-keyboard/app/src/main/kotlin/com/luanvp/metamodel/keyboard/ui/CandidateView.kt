package com.luanvp.metamodel.keyboard.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.text.SpannableString
import android.text.style.ReplacementSpan
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.View
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
    }

    /**
     * Update the candidate bar with new annotations.
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
     * Format the annotation text as a "spelling error" — red underline drawn
     * below the text using a custom ReplacementSpan.
     */
    private fun formatChipText(text: String): CharSequence {
        val spannable = SpannableString(text)
        spannable.setSpan(
            object : ReplacementSpan() {
                override fun getSize(
                    paint: Paint,
                    text: CharSequence,
                    start: Int,
                    end: Int,
                    fm: Paint.FontMetricsInt?,
                ): Int {
                    val width = paint.measureText(text, start, end).toInt()
                    fm?.let {
                        val baseline = fm.descent - fm.ascent
                        it.top = fm.ascent - 4
                        it.bottom = fm.descent + 4
                    }
                    return width
                }

                override fun draw(
                    canvas: Canvas,
                    text: CharSequence,
                    start: Int,
                    end: Int,
                    x: Float,
                    top: Int,
                    baseline: Int,
                    bottom: Int,
                    paint: Paint,
                ) {
                    // Draw the text normally
                    canvas.drawText(text, start, end, x, baseline.toFloat(), paint)

                    // Draw a red wavy underline
                    val underlinePaint = Paint(paint).apply {
                        color = Color.RED
                        strokeWidth = 2f
                        style = Paint.Style.STROKE
                    }

                    val bounds = Rect()
                    paint.getTextBounds(text.toString(), start, end - start, bounds)
                    val underlineY = baseline.toFloat() + 6f

                    // Simple dashed underline
                    canvas.drawLine(x, underlineY, x + paint.measureText(text.toString(), start, end - start), underlineY, underlinePaint)
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
