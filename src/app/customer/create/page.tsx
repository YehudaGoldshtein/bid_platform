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

  // Track the current option input text per parameter
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

      // Upload files if any
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

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/customer" className="text-sm text-indigo-500 hover:text-indigo-700 mb-4 inline-block">&larr; Back to Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Bid</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter bid title"
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              placeholder="Describe what you need..."
            />
          </div>

          {/* Deadline */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Parameters</label>
              <button
                type="button"
                onClick={addParameter}
                className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
              >
                + Add Parameter
              </button>
            </div>

            {parameters.length === 0 && (
              <p className="text-gray-400 text-sm">No parameters added yet. Parameters let vendors price different options (e.g., Color, Size).</p>
            )}

            <div className="space-y-4">
              {parameters.map((param, paramIndex) => (
                <div key={paramIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParameterName(paramIndex, e.target.value)}
                      placeholder="Parameter name (e.g., Color)"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeParameter(paramIndex)}
                      className="text-red-400 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Options chips */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {param.options.map((option, optIndex) => (
                      <span
                        key={optIndex}
                        className="inline-flex items-center bg-indigo-100 text-indigo-800 text-sm px-2.5 py-1 rounded-full"
                      >
                        {option}
                        <button
                          type="button"
                          onClick={() => removeOption(paramIndex, optIndex)}
                          className="ml-1.5 text-indigo-400 hover:text-indigo-700 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add option input */}
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
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => addOption(paramIndex)}
                      className="text-sm bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Bid"}
          </button>
        </form>
      </div>
    </main>
  );
}
