import React, { useState } from 'react';

const CHUNK_SIZE = 100;

export default function Insights({ data, headers, codebook }) {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(false);

  const applyCodebookToRow = (row) => {
    if (!codebook) return row;
    const mappedRow = {};
    headers.forEach((h, idx) => {
      mappedRow[h] = codebook[h]?.[row[idx]] ?? row[idx];
    });
    return mappedRow;
  };

  const chunkData = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const handleAnalyze = async () => {
    if (!data || data.length === 0) return;

    setLoading(true);
    const finalSummaries = [];

    const chunks = chunkData(data, CHUNK_SIZE);
    for (const chunk of chunks) {
      const chunkText = chunk.map(row => JSON.stringify(applyCodebookToRow(row))).join('\n');
      const prompt = `Summarize insights for the following VA records:\n${chunkText}`;
      try {
        const summary = await window.electronAPI.askGPT(prompt);
        finalSummaries.push(summary);
      } catch (err) {
        console.error('Chunk AI error:', err);
      }
    }

    const finalPrompt = `Combine these summaries into a single concise insight report:\n${finalSummaries.join('\n')}`;
    const finalInsight = await window.electronAPI.askGPT(finalPrompt);

    setInsights(finalInsight);
    setLoading(false);
  };

  return (
    <div>
      <h3>AI Insights</h3>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Generate Insights'}
      </button>
      {insights && (
        <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap', background: '#111', color: '#fff', padding: '1rem', borderRadius: '8px' }}>
          {insights}
        </div>
      )}
    </div>
  );
}
