"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Wand2, ChevronDown } from "lucide-react";

const MODELS = [
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", tag: "Best" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash", tag: "Fast" },
  { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", tag: "Fastest" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", tag: "Stable" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", tag: "Stable" },
];

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [tone, setTone] = useState("Natural");
  const [selectedModel, setSelectedModel] = useState("gemini-3.1-pro-preview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError("");
    setOutputText("");

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, tone, model: selectedModel }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setOutputText(data.humanizedText);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tones = ["Natural", "Professional", "Casual", "Creative"];
  const currentModel = MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="main-container">
      <header>
        <h1>AI Text Humanizer</h1>
        <p>Breathe life into your AI-generated content</p>
      </header>

      <div className="app-layout">
        {/* Input Area */}
        <div className="glass-panel textarea-container">
          <div className="textarea-header">
            <h2>Input Text</h2>
            {/* Model Selector */}
            <div className="model-selector-wrapper">
              <button
                className="model-selector-btn"
                onClick={() => setShowModelMenu(!showModelMenu)}
                disabled={loading}
              >
                <span className="model-label">{currentModel?.label}</span>
                <span className="model-tag">{currentModel?.tag}</span>
                <ChevronDown size={14} />
              </button>
              {showModelMenu && (
                <div className="model-dropdown">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      className={`model-option ${selectedModel === m.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelMenu(false);
                      }}
                    >
                      <span className="model-option-label">{m.label}</span>
                      <span className="model-option-tag">{m.tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your AI-generated text here..."
            disabled={loading}
          />
          <div className="controls-bar">
            <div className="tone-selector">
              {tones.map((t) => (
                <button
                  key={t}
                  className={`tone-btn ${tone === t ? "active" : ""}`}
                  onClick={() => setTone(t)}
                  disabled={loading}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              className={`action-btn ${loading ? "loading" : ""}`}
              onClick={handleHumanize}
              disabled={loading || !inputText.trim()}
            >
              {loading ? (
                <>
                  <Wand2 className="spin-icon" size={18} />
                  Humanizing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Humanize Text
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="glass-panel textarea-container output-container">
          <div className="textarea-header">
            <h2>Humanized Result</h2>
            <button
              className="copy-btn"
              onClick={handleCopy}
              disabled={!outputText}
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="empty-state">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <p>Rewriting to sound more human...</p>
            </div>
          ) : outputText ? (
            <div className="output-text">{outputText}</div>
          ) : (
            <div className="empty-state">
              <Sparkles size={48} />
              <p>Your natural-sounding text will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
