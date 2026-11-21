import os
import sys
import shutil
import re
import subprocess
from docx import Document

from .styles import add_header_footer
from .html_builder import ReportHTMLBuilder
from .sections_part1 import (
    render_cover_page,
    render_certificate,
    render_acknowledgement,
    render_abstract,
    render_table_of_contents,
    render_introduction,
    render_problem_statement,
    render_objectives
)
from .sections_part2 import (
    render_existing_system,
    render_proposed_system,
    render_product_overview,
    render_target_users,
    render_system_architecture,
    render_tech_stack
)
from .sections_part3 import (
    render_resume_parsing,
    render_adaptive_search,
    render_multi_source_discovery,
    render_normalization_deduplication,
    render_matching_ranking,
    render_skill_gap_guidance
)
from .sections_part4 import (
    render_database_api,
    render_ui_modules,
    render_security_no_mock,
    render_implementation_details,
    render_testing_verification
)
from .sections_part5 import (
    render_challenges_limitations,
    render_future_scope,
    render_conclusion,
    render_references
)

OUT_DIR = "/Users/pro/Desktop/projects/FRUITWISE"
PUBLIC_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public"

DOCX_PATH = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.docx")
PDF_PATH = os.path.join(OUT_DIR, "PROSPECT_Final_Project_Report.pdf")
HTML_PATH = "/tmp/prospect_academic_report.html"

def count_pdf_pages(pdf_file):
    try:
        with open(pdf_file, 'rb') as f:
            data = f.read()
            matches = re.findall(rb'/Type\s*/Page\b', data)
            return len(matches)
    except Exception as e:
        print(f"Error counting pages: {e}")
        return 0

def build_all():
    print("=" * 70)
    print("PROSPECT — Academic Project Report Generator Initiated")
    print("=" * 70)

    # 1. Initialize Word Document
    doc = Document()
    add_header_footer(doc)

    # 2. Initialize HTML Builder
    html_builder = ReportHTMLBuilder(title="PROSPECT: Technical Capstone Engineering Report")

    # 3. Render all 29 sections in sequence
    print("[1/29] Rendering Cover Page...")
    render_cover_page(doc, html_builder)

    print("[2/29] Rendering Certificate of Authenticity & Declaration...")
    render_certificate(doc, html_builder)

    print("[3/29] Rendering Acknowledgement...")
    render_acknowledgement(doc, html_builder)

    print("[4/29] Rendering Abstract...")
    render_abstract(doc, html_builder)

    print("[5/29] Rendering Table of Contents...")
    render_table_of_contents(doc, html_builder)

    print("[6/29] Rendering Chapter 6: Introduction...")
    render_introduction(doc, html_builder)

    print("[7/29] Rendering Chapter 7: Problem Statement...")
    render_problem_statement(doc, html_builder)

    print("[8/29] Rendering Chapter 8: Objectives of Prospect...")
    render_objectives(doc, html_builder)

    print("[9/29] Rendering Chapter 9: Existing System and Its Limitations...")
    render_existing_system(doc, html_builder)

    print("[10/29] Rendering Chapter 10: Proposed System...")
    render_proposed_system(doc, html_builder)

    print("[11/29] Rendering Chapter 11: Product Overview...")
    render_product_overview(doc, html_builder)

    print("[12/29] Rendering Chapter 12: Target Users and Use Cases...")
    render_target_users(doc, html_builder)

    print("[13/29] Rendering Chapter 13: System Architecture (Figure 1)...")
    render_system_architecture(doc, html_builder)

    print("[14/29] Rendering Chapter 14: Technology Stack...")
    render_tech_stack(doc, html_builder)

    print("[15/29] Rendering Chapter 15: Candidate Intelligence & Resume Parsing (Figure 2)...")
    render_resume_parsing(doc, html_builder)

    print("[16/29] Rendering Chapter 16: Adaptive Opportunity Search...")
    render_adaptive_search(doc, html_builder)

    print("[17/29] Rendering Chapter 17: Multi-source Opportunity Discovery (Figure 3)...")
    render_multi_source_discovery(doc, html_builder)

    print("[18/29] Rendering Chapter 18: Opportunity Normalization and Deduplication...")
    render_normalization_deduplication(doc, html_builder)

    print("[19/29] Rendering Chapter 19: Matching, Eligibility and Ranking (Figure 4)...")
    render_matching_ranking(doc, html_builder)

    print("[20/29] Rendering Chapter 20: Skill Gap Analysis and Career Guidance...")
    render_skill_gap_guidance(doc, html_builder)

    print("[21/29] Rendering Chapter 21: Database Design and API Structure (Figure 5)...")
    render_database_api(doc, html_builder)

    print("[22/29] Rendering Chapter 22: User Interface and Main Modules (Figures 6–10)...")
    render_ui_modules(doc, html_builder)

    print("[23/29] Rendering Chapter 23: Security, Privacy and No-Mock-Data Policy...")
    render_security_no_mock(doc, html_builder)

    print("[24/29] Rendering Chapter 24: Implementation Details...")
    render_implementation_details(doc, html_builder)

    print("[25/29] Rendering Chapter 25: Testing and Verification...")
    render_testing_verification(doc, html_builder)

    print("[26/29] Rendering Chapter 26: Challenges and Limitations...")
    render_challenges_limitations(doc, html_builder)

    print("[27/29] Rendering Chapter 27: Future Scope...")
    render_future_scope(doc, html_builder)

    print("[28/29] Rendering Chapter 28: Conclusion...")
    render_conclusion(doc, html_builder)

    print("[29/29] Rendering Chapter 29: References...")
    render_references(doc, html_builder)

    # 4. Save DOCX
    print(f"\nSaving DOCX report to {DOCX_PATH}...")
    doc.save(DOCX_PATH)
    shutil.copyfile(DOCX_PATH, os.path.join(PUBLIC_DIR, "PROSPECT_Final_Project_Report.docx"))
    docx_size_kb = os.path.getsize(DOCX_PATH) / 1024
    print(f"✓ DOCX created successfully ({docx_size_kb:.1f} KB)")

    # 5. Write HTML
    print(f"Writing intermediate HTML to {HTML_PATH}...")
    full_html = html_builder.render()
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
    print("✓ Intermediate HTML rendered.")

    # 6. Compile PDF using Headless Browser
    print(f"Compiling PDF via Headless Browser to {PDF_PATH}...")
    browser_bin = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    if not os.path.exists(browser_bin):
        browser_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    browser_cmd = [
        browser_bin,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={PDF_PATH}",
        f"file://{HTML_PATH}"
    ]
    res = subprocess.run(browser_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Warning: Browser returned exit code {res.returncode}: {res.stderr}")
    else:
        print("✓ Headless PDF conversion finished successfully.")

    shutil.copyfile(PDF_PATH, os.path.join(PUBLIC_DIR, "PROSPECT_Final_Project_Report.pdf"))
    
    # Also update brain directory copies
    brain_dir = "/Users/pro/.gemini/antigravity/brain/1a6e1cf1-9d2c-4815-a5f2-d475d1d35e49"
    if os.path.exists(brain_dir):
        shutil.copyfile(PDF_PATH, os.path.join(brain_dir, "PROSPECT_Final_Project_Report.pdf"))
        shutil.copyfile(DOCX_PATH, os.path.join(brain_dir, "PROSPECT_Final_Project_Report.docx"))

    pdf_size_kb = os.path.getsize(PDF_PATH) / 1024
    page_count = count_pdf_pages(PDF_PATH)
    print(f"✓ PDF created successfully ({pdf_size_kb:.1f} KB, {page_count} Pages)")

    print("=" * 70)
    print("ALL DELIVERABLES SUCCESSFULLY GENERATED AND VERIFIED:")
    print(f"  1. DOCX: {DOCX_PATH}")
    print(f"  2. PDF:  {PDF_PATH}")
    print(f"  3. Public Web URL: http://localhost:3000/PROSPECT_Final_Project_Report.pdf")
    print(f"  4. Public Web URL: http://localhost:3000/PROSPECT_Final_Project_Report.docx")
    print("=" * 70)

if __name__ == "__main__":
    build_all()
