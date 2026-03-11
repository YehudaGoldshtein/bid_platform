"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Parameter {
  name: string;
  options: string[];
}

export default function CreateBidPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  const addParameter = () => {
    setParameters([...parameters, { name: "", options: [] }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
    const newInputs = { ...optionInputs };
    delete newInputs[index];
    setOptionInputs(newInputs);
  };

  const updateParameterName = (index: number, name: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], name };
    setParameters(updated);
  };

  const addOption = (paramIndex: number) => {
    const text = (optionInputs[paramIndex] || "").trim();
    if (!text) return;
    const updated = [...parameters];
    if (!updated[paramIndex].options.includes(text)) {
      updated[paramIndex] = {
        ...updated[paramIndex],
        options: [...updated[paramIndex].options, text],
      };
      setParameters(updated);
    }
    setOptionInputs({ ...optionInputs, [paramIndex]: "" });
  };

  const removeOption = (paramIndex: number, optionIndex: number) => {
    const updated = [...parameters];
    updated[paramIndex] = {
      ...updated[paramIndex],
      options: updated[paramIndex].options.filter((_, i) => i !== optionIndex),
    };
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const body = {
        title,
        description,
        deadline,
        parameters: parameters
          .filter((p) => p.name.trim() && p.options.length > 0)
          .map((p) => ({ name: p.name.trim(), options: p.options })),
      };

      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create bid");
      }

      const bid = await res.json();

      if (files && files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
        const uploadRes = await fetch(`/api/bids/${bid.id}/files`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          console.error("File upload failed, but bid was created");
        }
      }

      router.push("/customer");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'var(--bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '7px',
    padding: '9px 11px',
    color: 'var(--ink)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.84rem',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/customer" className="text-sm mb-4 inline-block transition-colors" style={{ color: 'var(--gold)' }}>&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: 'var(--ink)' }}>Create New Bid</h1>

        {error && (
          <div className="px-4 py-3 mb-6 text-sm" style={{ background: 'var(--red-bg)', border: '1px solid var(--red-b)', borderRadius: '8px', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '6px' }}>1</span>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink2)' }}>Title</label>
            </div>
            <div className="p-5">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Enter bid title"
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '6px' }}>2</span>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink2)' }}>Description</label>
            </div>
            <div className="p-5">
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '72px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Describe what you need..."
              />
            </div>
          </div>

          {/* Deadline */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '6px' }}>3</span>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink2)' }}>Deadline</label>
            </div>
            <div className="p-5">
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* File Upload */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '6px' }}>4</span>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ink2)' }}>Attachments</label>
            </div>
            <div className="p-5">
              <div className="text-center py-6 cursor-pointer transition-all" style={{ border: '2px dashed var(--border2)', borderRadius: '9px' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-bg)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div className="text-2xl mb-2">📎</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Click to upload</span> or drag files here
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ position: 'relative' }}
                />
              </div>
              {files && files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {Array.from(files).map((file, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px' }}>
                      <span style={{ color: 'var(--ink)' }}>{file.name}</span>
                      <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Parameters */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: 'var(--card2)', borderBottom: '1px solid var(--border)' }}>
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', borderRadius: '6px' }}>5</span>
              <label className="text-xs font-bold uppercase tracking-wider flex-1" style={{ color: 'var(--ink2)' }}>Parameters</label>
              <button
                type="button"
                onClick={addParameter}
                className="text-xs font-bold px-3 py-1.5 transition-all"
                style={{ background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: '7px', color: 'var(--ink2)' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-bg)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--ink2)'; e.currentTarget.style.background = 'transparent'; }}
              >
                + Add Parameter
              </button>
            </div>
            <div className="p-5">
              {parameters.length === 0 && (
                <p className="text-sm" style={{ color: 'var(--faint)' }}>No parameters added yet. Parameters let vendors price different options (e.g., Color, Size).</p>
              )}

              <div className="space-y-4">
                {parameters.map((param, paramIndex) => (
                  <div key={paramIndex} className="p-4" style={{ border: '1.5px solid var(--border)', borderRadius: '10px', background: 'var(--bg)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameterName(paramIndex, e.target.value)}
                        placeholder="Parameter name (e.g., Color)"
                        className="flex-1 text-sm"
                        style={{ ...inputStyle, background: '#fff' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => removeParameter(paramIndex)}
                        className="text-xs font-semibold transition-colors"
                        style={{ color: 'var(--red)' }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {param.options.map((option, optIndex) => (
                        <span
                          key={optIndex}
                          className="inline-flex items-center text-xs font-semibold px-2.5 py-1"
                          style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-b)', borderRadius: '100px' }}
                        >
                          {option}
                          <button
                            type="button"
                            onClick={() => removeOption(paramIndex, optIndex)}
                            className="ml-1.5 font-bold opacity-60 hover:opacity-100"
                            style={{ color: 'var(--gold)' }}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={optionInputs[paramIndex] || ""}
                        onChange={(e) => setOptionInputs({ ...optionInputs, [paramIndex]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOption(paramIndex);
                          }
                        }}
                        placeholder="Add an option..."
                        className="flex-1 text-sm"
                        style={{ ...inputStyle, background: '#fff', padding: '7px 11px' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--gold-bg)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => addOption(paramIndex)}
                        className="text-xs font-semibold px-3 py-1.5 transition-all"
                        style={{ background: 'transparent', border: '1.5px solid var(--border2)', borderRadius: '7px', color: 'var(--ink2)' }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--ink2)'; }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white py-3 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--gold)', borderRadius: '7px', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem' }}
            onMouseOver={(e) => { if (!submitting) { e.currentTarget.style.background = 'var(--gold-l)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,146,10,0.3)'; } }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--gold)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {submitting ? "Creating..." : "Create Bid Request"}
          </button>
        </form>
      </div>
    </main>
  );
}
