"""
PROSPECT — Academic Project Report Generator
Builds both:
1. PROSPECT_Final_Project_Report.docx (Word Document with native styles, tables, callout boxes, and figures)
2. PROSPECT_Final_Project_Report.pdf (Print-ready PDF with A4 margins, headers, footers, and diagrams)
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

OUT_DIR = "/Users/pro/Desktop/projects/FRUITWISE"
PUBLIC_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public"
ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"

DOCX_PATH = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.docx")
PDF_PATH = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.pdf")
HTML_PATH = "/tmp/prospect_report_full.html"

# Color definitions
HEX_IVORY = "F8F6F1"
HEX_CHARCOAL = "111111"
HEX_LIME = "DFFF43"
HEX_LAVENDER = "EAE3FF"
HEX_MUTED_GREEN = "70B93F"
HEX_BORDER = "D6D3CD"
HEX_WHITE = "FFFFFF"

RGB_CHARCOAL = RGBColor(17, 17, 17)
RGB_DARK_GRAY = RGBColor(51, 51, 51)
RGB_MUTED = RGBColor(100, 116, 139)
RGB_LIME = RGBColor(223, 255, 67)
RGB_LAVENDER = RGBColor(234, 227, 255)

def set_cell_background(cell, hex_color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D6D3CD"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

print("Report generator framework initialized.")
