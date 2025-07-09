// src/components/CodeEditor.jsx
import { useEffect } from 'react';
import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, setCode, language }) {
  return (
    <div className="border rounded overflow-hidden">
      <Editor
        height="400px"
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={value => setCode(value)}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
}
