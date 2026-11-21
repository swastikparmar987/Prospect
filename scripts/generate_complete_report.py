import os
import sys
import subprocess
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"
OUT_DIR = "/Users/pro/Desktop/projects/FRUITWISE"
PUBLIC_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public"

DOCX_OUT = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.docx")
PDF_OUT = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.pdf")
HTML_OUT = "/tmp/prospect_academic_report.html"

# Colors
C_CHARCOAL = RGBColor(17, 17, 17)
C_DARK = RGBColor(30, 41, 59)
C_MUTED = RGBColor(100, 116, 139)
C_LIME = RGBColor(160, 200, 20)

HEX_IVORY = "F8F6F1"
HEX_CHARCOAL = "111111"
HEX_LIME = "DFFF43"
HEX_LAVENDER = "EAE3FF"
HEX_WHITE = "FFFFFF"
HEX_BORDER = "D6D3CD"
HEX_LIGHT_ROW = "FAF9F5"

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_padding(cell, top=120, bottom=120, left=160, right=160):
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    cell._tc.get_or_add_tcPr().append(tcMar)

def set_table_borders(table, color="D6D3CD"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_styled_heading1(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(18)
    h.paragraph_format.space_after = Pt(8)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.bold = True
    run.font.size = Pt(14)
    run.font.color.rgb = C_CHARCOAL
    
    pPr = h._p.get_or_add_pPr()
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="14" w:space="4" w:color="{HEX_CHARCOAL}"/></w:pBdr>')
    pPr.append(pBdr)
    return h

def add_styled_heading2(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(13)
    h.paragraph_format.space_after = Pt(5)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.bold = True
    run.font.size = Pt(11.5)
    run.font.color.rgb = C_CHARCOAL
    return h

def add_styled_heading3(doc, text):
    h = doc.add_paragraph()
    h.paragraph_format.space_before = Pt(9)
    h.paragraph_format.space_after = Pt(3)
    h.paragraph_format.keep_with_next = True
    run = h.add_run(text)
    run.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = C_DARK
    return h

def add_body_p(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4.5)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.size = Pt(9.5)
        r_pre.font.color.rgb = C_CHARCOAL
    r_body = p.add_run(text)
    r_body.font.size = Pt(9.5)
    r_body.font.color.rgb = C_DARK
    return p

def add_bullet_item(doc, text, bold_title=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    if bold_title:
        r_t = p.add_run(bold_title)
        r_t.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = C_CHARCOAL
    r_b = p.add_run(text)
    r_b.font.size = Pt(9.5)
    r_b.font.color.rgb = C_DARK
    return p

def add_callout(doc, title, text, bg_color=HEX_IVORY, border_color=HEX_LIME):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_padding(cell, top=120, bottom=120, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}")
    run_t.bold = True
    run_t.font.size = Pt(9.5)
    run_t.font.color.rgb = C_CHARCOAL
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.15
    run_b = p2.add_run(text)
    run_b.font.size = Pt(9)
    run_b.font.color.rgb = C_DARK

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(1)
    p_after.paragraph_format.space_after = Pt(3)

def add_code_snippet(doc, code_str, caption=None):
    if caption:
        p_cap = doc.add_paragraph()
        p_cap.paragraph_format.space_before = Pt(4)
        p_cap.paragraph_format.space_after = Pt(2)
        r_c = p_cap.add_run(f"Listing: {caption}")
        r_c.font.size = Pt(8.5)
        r_c.italic = True
        r_c.font.color.rgb = C_MUTED

    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "1E2226")
    set_cell_padding(cell, top=100, bottom=100, left=140, right=140)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(code_str.strip())
    r.font.name = "Courier New"
    r.font.size = Pt(8.0)
    r.font.color.rgb = RGBColor(223, 255, 67) # Electric Lime text

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(1)
    p_after.paragraph_format.space_after = Pt(3)

def add_image_figure(doc, img_path, caption_text, width_inches=5.8):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(6)
        p_img.paragraph_format.space_after = Pt(2)
        run = p_img.add_run()
        run.add_picture(img_path, width=Inches(width_inches))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(0)
        p_cap.paragraph_format.space_after = Pt(8)
        r_cap = p_cap.add_run(caption_text)
        r_cap.font.size = Pt(8.5)
        r_cap.italic = True
        r_cap.font.color.rgb = C_MUTED
    else:
        print(f"Warning: Image not found at {img_path}")

def add_custom_table(doc, headers, data, col_widths=None):
    tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl, HEX_BORDER)
    
    # Header row
    hdr_row = tbl.rows[0]
    hdr_row._tr.get_or_add_trPr().append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    for idx, heading in enumerate(headers):
        cell = hdr_row.cells[idx]
        set_cell_background(cell, HEX_CHARCOAL)
        set_cell_padding(cell, top=80, bottom=80, left=120, right=120)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(heading)
        r.bold = True
        r.font.size = Pt(8.6)
        r.font.color.rgb = RGBColor(223, 255, 67)
        if col_widths and idx < len(col_widths):
            cell.width = Inches(col_widths[idx])

    # Data rows
    for r_idx, row_values in enumerate(data):
        row = tbl.rows[r_idx + 1]
        bg = HEX_LIGHT_ROW if r_idx % 2 == 1 else HEX_WHITE
        for c_idx, val in enumerate(row_values):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_padding(cell, top=70, bottom=70, left=120, right=120)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.12
            r = p.add_run(str(val))
            r.font.size = Pt(8.4)
            r.font.color.rgb = C_DARK
            if col_widths and c_idx < len(col_widths):
                cell.width = Inches(col_widths[c_idx])

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(1)
    p_after.paragraph_format.space_after = Pt(5)

print("Base generator routines verified.")
