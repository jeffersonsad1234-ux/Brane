import React, { useState, useCallback } from "react";

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);
  return (
    <div style={{
      margin: "6px 0", borderRadius: 8, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.06)",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px", background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontSize: 10, color: "rgba(255,255,255,0.3)",
      }}>
        <span>{language || "code"}</span>
        <button onClick={handleCopy}
          style={{
            padding: "2px 6px", borderRadius: 3, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
            fontSize: 10, fontFamily: "inherit",
          }}
          className="cs-hover-soft"
        >{copied ? "Copiado!" : "Copiar"}</button>
      </div>
      <pre style={{
        margin: 0, padding: "8px 10px", overflowX: "auto",
        background: "rgba(0,0,0,0.3)",
        lineHeight: "1.5", tabSize: 2,
      }}><code>{code}</code></pre>
    </div>
  );
}

function parseMarkdown(text) {
  if (!text) return [];
  const tokens = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      tokens.push({ type: "code", code: codeLines.join("\n"), language: lang });
      continue;
    }

    // Empty line
    if (!line.trim()) {
      tokens.push({ type: "empty" });
      i++;
      continue;
    }

    // Header
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      tokens.push({ type: "header", level: headerMatch[1].length, text: headerMatch[2] });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ""));
        i++;
      }
      tokens.push({ type: "list", items, ordered: false });
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      tokens.push({ type: "list", items, ordered: true });
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && /^[\s:|]+-[\s:|]+$/.test(lines[i + 1])) {
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length > 0) rows.push(cells);
        i++;
      }
      tokens.push({ type: "table", headers: headerCells, rows });
      continue;
    }

    // Regular paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i]) && !/^#{1,3}\s+/.test(lines[i]) && !/^[-*+]\s+/.test(lines[i]) && !/^\d+[.)]\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    tokens.push({ type: "paragraph", text: paraLines.join("\n") });
  }

  return tokens;
}

function renderInline(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.9);font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:rgba(255,255,255,0.7)">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(59,130,246,0.1);padding:1px 4px;border-radius:3px;font-size:11px;color:rgba(59,130,246,0.7);font-family:monospace">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:rgba(59,130,246,0.6);text-decoration:none;border-bottom:1px solid rgba(59,130,246,0.15)">$1</a>');
}

export default function MarkdownRenderer({ content }) {
  const tokens = parseMarkdown(content);

  return (
    <div style={{ lineHeight: "1.6" }}>
      {tokens.map((token, i) => {
        switch (token.type) {
          case "code":
            return <CodeBlock key={i} code={token.code} language={token.language} />;
          case "empty":
            return <div key={i} style={{ height: 8 }} />;
          case "header":
            return <div key={i} style={{
              fontSize: token.level === 1 ? 15 : token.level === 2 ? 14 : 13,
              fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: "8px 0 4px",
            }} dangerouslySetInnerHTML={{ __html: renderInline(token.text) }} />;
          case "list":
            return (
              <div key={i} style={{ margin: "4px 0", paddingLeft: 16 }}>
                {token.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 6, marginBottom: 2, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: "rgba(59,130,246,0.5)" }}>{token.ordered ? `${j + 1}.` : "•"}</span>
                    <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <div key={i} style={{ margin: "6px 0", overflowX: "auto", fontSize: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {token.headers.map((h, j) => (
                        <th key={j} style={{ padding: "4px 8px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontWeight: 500, background: "rgba(255,255,255,0.02)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {token.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k} style={{ padding: "3px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "paragraph":
            return (
              <div key={i} style={{ margin: "4px 0", fontSize: 13, color: "rgba(255,255,255,0.7)" }} dangerouslySetInnerHTML={{ __html: renderInline(token.text) }} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
