import React, { useState } from 'react';
import { rewriteContent } from '../api';
import './AiRewriteModal.css';

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Standard business tone' },
  { id: 'punchy',       label: 'Punchy',       desc: 'Concise & high impact' },
  { id: 'quantified',   label: 'Results',      desc: 'Focus on numbers' },
];

const AiRewriteModal = ({ originalContent, onAccept, onClose }) => {
  const [rewritten, setRewritten] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('professional');

  const handleRewrite = async (selectedTone = tone) => {
    if (!originalContent.trim()) return;
    setLoading(true);
    setError("");

    try {
      const toneInstructions = {
        professional: "Maintain a formal, executive tone.",
        punchy: "Make it extremely concise and high-impact.",
        quantified: "Focus heavily on results, numbers, and metrics."
      };

      const prompt = `Rewrite this resume content. Tone: ${selectedTone}. ${toneInstructions[selectedTone] || ""} Content: ${originalContent}`;

      // DIRECT CALL TO OPENROUTER (Bypassing Backend to fix 401 issues) - secured via env variable
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "VRESIQ"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5-8b:free",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Error: ${response.status}`);
      }

      const rewrittenText = data.choices[0].message.content.trim();
      setRewritten(rewrittenText);
    } catch (err) {
      console.error("AI Rewrite Failed:", err);
      setError(err.message || "Failed to rewrite content. Please check your API key and connection.");
    } finally {
      setLoading(false);
    }
  };

  const changeTone = (newTone) => {
    setTone(newTone);
    handleRewrite(newTone);
  };

  // Run rewrite on mount
  React.useEffect(() => {
    if (originalContent && !rewritten && !loading && !error) {
      handleRewrite();
    }
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal rewrite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <p>AI Writing Assistant</p>
          <h2>Magic Rewrite</h2>
        </div>

        {/* Tone Selector */}
        <div className="tone-selector">
          <label className="section-label">SELECT TONE</label>
          <div className="tone-chips">
            {TONES.map((t) => (
              <button
                key={t.id}
                className={`tone-chip ${tone === t.id ? 'active' : ''}`}
                onClick={() => changeTone(t.id)}
                disabled={loading}
              >
                <span className="tone-label">{t.label}</span>
                <span className="tone-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rewrite-content-grid">
          <div className="rewrite-block">
            <label>Original</label>
            <div className="content-box original">{originalContent}</div>
          </div>
          <div className="rewrite-block">
            <label>AI Suggested</label>
            <div className="content-box rewritten">
              {loading ? (
                <div className="rewrite-loading">
                  <span className="spinner"></span>
                  Crafting professional bullets...
                </div>
              ) : error ? (
                <div className="rewrite-error">{error}</div>
              ) : (
                rewritten
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Discard</button>
          <div className="main-actions">
            <button onClick={() => handleRewrite()} className="btn-outline-sm" disabled={loading}>
              Regenerate
            </button>
            <button 
              onClick={() => onAccept(rewritten)} 
              className="btn-create" 
              disabled={loading || !rewritten}
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiRewriteModal;
