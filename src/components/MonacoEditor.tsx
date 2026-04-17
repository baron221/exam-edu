'use client';

import React from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: 'light' | 'vs-dark';
  height?: string;
  readOnly?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'cpp',
  theme = 'light',
  height = '500px',
  readOnly = false,
}) => {
  return (
    <div style={{ 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1.5px solid #e2e8f0',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
    }}>
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        options={{
          fontSize: 15,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20, bottom: 20 },
          readOnly: readOnly,
          tabSize: 4,
          lineNumbers: 'on',
          roundedSelection: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'smooth',
          renderLineHighlight: 'all',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto'
          }
        }}
      />
    </div>
  );
};



export default MonacoEditor;
