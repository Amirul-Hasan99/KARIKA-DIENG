#!/usr/bin/env node

/**
 * Generate PDF Report from Markdown
 * Uses html2pdf library (or alternative method)
 */

import fs from "fs";
import path from "path";

const reportMarkdown = fs.readFileSync("docs/SECURITY_AND_CLEANUP_REPORT.md", "utf-8");

// Simple Markdown to HTML converter
function markdownToHtml(md) {
  let html = md
    // Headers
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Code blocks
    .replace(/```typescript\n([\s\S]*?)```/g, "<pre><code class='language-typescript'>$1</code></pre>")
    .replace(/```\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Tables
    .replace(/\| (.*?) \|\n\| ([-\s|:]+) \|\n((?:\| .*? \|\n)*)/g, (match, header, divider, rows) => {
      const headers = header.split("|").map((h) => h.trim()).filter(Boolean);
      const rowsArray = rows
        .split("\n")
        .filter((r) => r.trim())
        .map((r) => r.split("|").map((c) => c.trim()).filter(Boolean));
      let table = "<table><thead><tr>";
      headers.forEach((h) => (table += `<th>${h}</th>`));
      table += "</tr></thead><tbody>";
      rowsArray.forEach((row) => {
        table += "<tr>";
        row.forEach((cell) => (table += `<td>${cell}</td>`));
        table += "</tr>";
      });
      table += "</tbody></table>";
      return table;
    })
    // Lists
    .replace(/^\* (.*?)$/gm, "<li>$1</li>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, (match) => `<ul>${match}</ul>`)
    // Checkboxes
    .replace(/- \[x\] /g, '<li style="list-style: none;"><input type="checkbox" checked disabled> ')
    .replace(/- \[ \] /g, '<li style="list-style: none;"><input type="checkbox" disabled> ')
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|p|u|l|t])(.+)$/gm, "<p>$1</p>");

  return html;
}

const html = markdownToHtml(reportMarkdown);

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KARIKA Security & Clean Code Audit Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f8f7f2;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    
    h1 {
      color: #292a23;
      border-bottom: 4px solid #655700;
      padding-bottom: 15px;
      margin-bottom: 30px;
      font-size: 32px;
    }
    
    h2 {
      color: #292a23;
      margin-top: 40px;
      margin-bottom: 20px;
      font-size: 24px;
      border-left: 4px solid #938126;
      padding-left: 15px;
    }
    
    h3 {
      color: #57564d;
      margin-top: 25px;
      margin-bottom: 15px;
      font-size: 18px;
    }
    
    p {
      margin-bottom: 15px;
      text-align: justify;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    th {
      background-color: #f2f0e8;
      color: #292a23;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #e4e1d7;
    }
    
    td {
      padding: 12px;
      border: 1px solid #e4e1d7;
    }
    
    tr:nth-child(even) {
      background-color: #faf9f4;
    }
    
    code {
      background-color: #f5f3ed;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #c92c2c;
    }
    
    pre {
      background-color: #2d2d30;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 20px;
      border-left: 4px solid #655700;
    }
    
    pre code {
      background: none;
      color: #d4d4d4;
      padding: 0;
    }
    
    ul, ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    
    li {
      margin-bottom: 8px;
    }
    
    strong {
      color: #292a23;
      font-weight: 600;
    }
    
    em {
      color: #655700;
      font-style: italic;
    }
    
    a {
      color: #938126;
      text-decoration: none;
      border-bottom: 1px dotted #938126;
    }
    
    a:hover {
      background-color: #faf8ed;
      border-bottom: 1px solid #938126;
    }
    
    .status-box {
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #655700;
    }
    
    .status-green {
      background-color: #ecf9f3;
      border-left-color: #10b981;
    }
    
    .status-yellow {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
    }
    
    .status-red {
      background-color: #fee2e2;
      border-left-color: #ef4444;
    }
    
    .checklist {
      list-style: none;
    }
    
    .checklist li:before {
      content: "☐ ";
      margin-right: 8px;
      color: #655700;
      font-weight: bold;
    }
    
    .emoji {
      font-size: 1.2em;
      margin-right: 8px;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e4e1d7;
      text-align: center;
      color: #77766f;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 40px;
      }
      a {
        color: #0066cc;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${html}
    <footer>
      <p>Generated by KARIKA Security & Code Quality Audit System</p>
      <p>Date: 2026-11-14 | Status: Production Ready ✓</p>
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync("docs/SECURITY_AND_CLEANUP_REPORT.html", htmlContent, "utf-8");
console.log("✅ HTML report generated: docs/SECURITY_AND_CLEANUP_REPORT.html");

// Try to generate PDF using puppeteer if available
try {
  const { execSync } = require("child_process");
  // Try to use html2pdf CLI if installed globally
  execSync("npm list -g html2pdf 2>/dev/null || npm list html2pdf 2>/dev/null", { stdio: "ignore" });
  console.log("Note: To convert HTML to PDF, use a tool like:");
  console.log("  - Online: https://html2pdf.com/");
  console.log("  - CLI: npm install -g html2pdf");
  console.log("  - Puppeteer: npm install puppeteer");
} catch (e) {
  console.log("💡 Tip: HTML report generated. To create PDF:");
  console.log("   Option 1: Open docs/SECURITY_AND_CLEANUP_REPORT.html in browser, then Print > Save as PDF");
  console.log("   Option 2: npm install puppeteer && node generate-pdf.js");
}
