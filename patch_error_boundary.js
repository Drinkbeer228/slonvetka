import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Add ErrorBoundary at the top of the file
const ebCode = `
import React, { Component, ErrorInfo, ReactNode } from 'react';
class LocalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#fee' }}>
          <h2>Упс! Ошибка отрисовки</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre style={{fontSize: 10}}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

// replace "import React, { useState, useEffect } from 'react';" with the new code
code = code.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';\n" + ebCode);

// wrap the return statement
code = code.replace(/return \(\s*<div className="pb-24 pt-4 sm:pt-6 space-y-6 max-w-lg mx-auto">/g, "return (\n<LocalErrorBoundary>\n<div className=\"pb-24 pt-4 sm:pt-6 space-y-6 max-w-lg mx-auto\">");

// find the last `  );` before `}` and add `</LocalErrorBoundary>`
code = code.replace(/  \);\n\}/, "  </LocalErrorBoundary>\n  );\n}");

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Injected ErrorBoundary');
