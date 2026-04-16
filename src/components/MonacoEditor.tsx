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
  theme = 'vs-dark',
  height = '500px',
  readOnly = false,
}) => {
  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          readOnly: readOnly,
          tabSize: 4,
          lineNumbers: 'on',
          roundedSelection: true,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
