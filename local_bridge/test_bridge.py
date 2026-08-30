import tempfile
import unittest
import zipfile
from pathlib import Path
from datetime import datetime

import bridge


class BridgeTests(unittest.TestCase):
    def test_classification_and_due(self):
        category, confidence = bridge.classify('2학기 수행평가계획.hwpx', '수행평가 계획 제출 마감 2026.09.10')
        self.assertEqual(category, 'assessment')
        self.assertGreaterEqual(confidence, 0.7)
        due = bridge.extract_due('제출 마감 2026.09.10', datetime(2026, 8, 30).timestamp())
        self.assertEqual(due, '2026-09-10')

    def test_redaction(self):
        x = bridge.sanitize_text('test@school.kr 010-1234-5678 900101-1234567')
        self.assertNotIn('test@school.kr', x)
        self.assertNotIn('010-1234-5678', x)
        self.assertNotIn('900101-1234567', x)

    def test_hwpx_local_text_extraction(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / '계획.hwpx'
            with zipfile.ZipFile(p, 'w') as z:
                z.writestr('Contents/section0.xml', '<hp:sec xmlns:hp="urn:test"><hp:t>공문 제출 마감 2026.09.11</hp:t></hp:sec>')
            text = bridge.extract_hwpx(p)
            self.assertIn('공문 제출', text)

    def test_xlsx_shared_string_extraction(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / '업무.xlsx'
            with zipfile.ZipFile(p, 'w') as z:
                z.writestr('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>제출 마감</t></si></sst>')
                z.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row><c t="s"><v>0</v></c></row></sheetData></worksheet>')
            self.assertIn('제출 마감', bridge.extract_xlsx(p))

    def test_title_contains_no_raw_text(self):
        p = Path('/tmp/학교업무_공문.pdf')
        title = bridge.derive_title(p, 'admin', '2026-09-10')
        self.assertIn('학교업무 공문', title)
        self.assertNotIn('@', title)


if __name__ == '__main__':
    unittest.main()
