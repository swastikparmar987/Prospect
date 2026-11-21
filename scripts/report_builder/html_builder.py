import os
import html

ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"

class ReportHTMLBuilder:
    def __init__(self, title="PROSPECT — Capstone Project Report"):
        self.title = title
        self.body_parts = []
        
    def add_raw(self, html_snippet):
        self.body_parts.append(html_snippet)
        
    def add_page_break(self):
        self.body_parts.append('<div class="page-break"></div>')
        
    def add_h1(self, text, page_break=False):
        pb = '<div class="page-break"></div>' if page_break else ''
        self.body_parts.append(f'{pb}<h1 class="chapter-h1">{html.escape(text)}</h1>')
        
    def add_h2(self, text):
        self.body_parts.append(f'<h2 class="section-h2">{html.escape(text)}</h2>')
        
    def add_h3(self, text):
        self.body_parts.append(f'<h3 class="sub-h3">{html.escape(text)}</h3>')
        
    def add_p(self, text, bold_prefix=None):
        bp = f'<strong>{html.escape(bold_prefix)}</strong> ' if bold_prefix else ''
        self.body_parts.append(f'<p class="report-p">{bp}{html.escape(text)}</p>')
        
    def add_bullet(self, text, bold_prefix=None):
        bp = f'<strong>{html.escape(bold_prefix)}</strong> ' if bold_prefix else ''
        self.body_parts.append(f'<li class="report-bullet">{bp}{html.escape(text)}</li>')
        
    def start_bullet_list(self):
        self.body_parts.append('<ul class="report-ul">')
        
    def end_bullet_list(self):
        self.body_parts.append('</ul>')
        
    def add_callout(self, title, text):
        self.body_parts.append(f'''
        <div class="callout-card">
            <div class="callout-title">⚡ {html.escape(title)}</div>
            <div class="callout-body">{html.escape(text)}</div>
        </div>
        ''')
        
    def add_code(self, code_str, caption=None):
        cap_html = f'<div class="code-caption">Listing: {html.escape(caption)}</div>' if caption else ''
        self.body_parts.append(f'''
        <div class="code-container">
            {cap_html}
            <pre class="code-block"><code>{html.escape(code_str.strip())}</code></pre>
        </div>
        ''')
        
    def add_figure(self, img_path, caption_text):
        if os.path.exists(img_path):
            file_url = f"file://{img_path}"
            self.body_parts.append(f'''
            <div class="figure-container">
                <img src="{file_url}" alt="{html.escape(caption_text)}" class="figure-img" />
                <div class="figure-caption">{html.escape(caption_text)}</div>
            </div>
            ''')
            
    def add_table(self, headers, rows):
        hdr_html = "".join([f"<th>{html.escape(h)}</th>" for h in headers])
        rows_html = []
        for r_idx, row in enumerate(rows):
            cls = "even-row" if r_idx % 2 == 1 else "odd-row"
            cells = "".join([f"<td>{html.escape(str(c))}</td>" for c in row])
            rows_html.append(f'<tr class="{cls}">{cells}</tr>')
            
        self.body_parts.append(f'''
        <div class="table-container">
            <table class="report-table">
                <thead>
                    <tr>{hdr_html}</tr>
                </thead>
                <tbody>
                    {"".join(rows_html)}
                </tbody>
            </table>
        </div>
        ''')

    def render(self):
        body_content = "\n".join(self.body_parts)
        return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{html.escape(self.title)}</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 20mm 18mm 20mm 18mm;
    @top-left {{
      content: "PROSPECT : AI CAREER INTELLIGENCE PLATFORM";
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 0.08em;
    }}
    @bottom-right {{
      content: "Page " counter(page);
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8.5pt;
      color: #64748B;
    }}
    @bottom-left {{
      content: "Academic Engineering Report • Confidential";
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 7.5pt;
      color: #94A3B8;
    }}
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #1E293B;
    background-color: #FFFFFF;
    margin: 0;
    padding: 0;
  }}

  .page-break {{
    page-break-before: always;
    break-before: page;
  }}

  /* Typography */
  h1.chapter-h1 {{
    font-size: 14pt;
    font-weight: 800;
    color: #111111;
    border-bottom: 2.5px solid #111111;
    padding-bottom: 6px;
    margin-top: 26px;
    margin-bottom: 14px;
    letter-spacing: -0.02em;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h2.section-h2 {{
    font-size: 11.5pt;
    font-weight: 700;
    color: #111111;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h3.sub-h3 {{
    font-size: 10pt;
    font-weight: 600;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 5px;
    page-break-after: avoid;
    break-after: avoid;
  }}

  p.report-p {{
    font-size: 9.3pt;
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
    color: #2D3748;
  }}

  ul.report-ul {{
    margin-top: 4px;
    margin-bottom: 10px;
    padding-left: 22px;
  }}

  li.report-bullet {{
    font-size: 9.2pt;
    margin-bottom: 4px;
    color: #2D3748;
  }}

  /* Cover Page Styling */
  .cover-container {{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 250mm;
    padding: 20mm 15mm;
    background: #F8F6F1;
    border: 1px solid #D6D3CD;
    border-radius: 4px;
  }}

  .cover-badge {{
    display: inline-block;
    background-color: #111111;
    color: #DFFF43;
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 3px;
    margin-bottom: 24px;
  }}

  .cover-title {{
    font-size: 26pt;
    font-weight: 900;
    line-height: 1.15;
    color: #111111;
    letter-spacing: -0.03em;
    margin-bottom: 16px;
  }}

  .cover-subtitle {{
    font-size: 12pt;
    font-weight: 500;
    line-height: 1.45;
    color: #4A5568;
    max-width: 90%;
    margin-bottom: 30px;
    border-left: 3px solid #DFFF43;
    padding-left: 14px;
  }}

  .cover-meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 40px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    padding: 20px;
    border-radius: 4px;
  }}

  .cover-meta-item {{
    font-size: 9pt;
  }}

  .cover-meta-label {{
    text-transform: uppercase;
    font-size: 7.5pt;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }}

  .cover-meta-val {{
    font-weight: 700;
    color: #111111;
  }}

  /* Callout Card */
  .callout-card {{
    background: #F8F6F1;
    border-left: 4.5px solid #DFFF43;
    border-top: 1px solid #E2E8F0;
    border-right: 1px solid #E2E8F0;
    border-bottom: 1px solid #E2E8F0;
    padding: 10px 14px;
    margin: 12px 0 14px 0;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .callout-title {{
    font-size: 9.3pt;
    font-weight: 800;
    color: #111111;
    margin-bottom: 4px;
  }}

  .callout-body {{
    font-size: 8.8pt;
    color: #334155;
    line-height: 1.45;
  }}

  /* Code Block */
  .code-container {{
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .code-caption {{
    font-size: 8pt;
    font-style: italic;
    color: #64748B;
    margin-bottom: 4px;
  }}

  .code-block {{
    background: #181B1E;
    color: #DFFF43;
    font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
    font-size: 8pt;
    line-height: 1.4;
    padding: 12px 14px;
    border-radius: 4px;
    overflow-x: auto;
    border-left: 3px solid #DFFF43;
    margin: 0;
  }}

  /* Tables */
  .table-container {{
    margin: 14px 0 18px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .report-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8.3pt;
  }}

  .report-table th {{
    background-color: #111111;
    color: #DFFF43;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #334155;
  }}

  .report-table td {{
    padding: 6px 10px;
    border: 1px solid #D6D3CD;
    color: #1E293B;
    vertical-align: top;
  }}

  .report-table tr.odd-row {{
    background-color: #FFFFFF;
  }}

  .report-table tr.even-row {{
    background-color: #FAF9F5;
  }}

  /* Figures */
  .figure-container {{
    margin: 14px 0 18px 0;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .figure-img {{
    max-width: 95%;
    height: auto;
    border: 1px solid #E2E8F0;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }}

  .figure-caption {{
    font-size: 8.2pt;
    font-style: italic;
    color: #64748B;
    margin-top: 6px;
  }}
</style>
</head>
<body>
{body_content}
</body>
</html>'''
