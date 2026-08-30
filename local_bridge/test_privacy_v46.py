#!/usr/bin/env python3
import unittest

import privacy_v46 as R


class PrivacyV46Tests(unittest.TestCase):
    def test_explicit_student_identifiers_are_redacted(self):
        raw = '학생명: 김민수 학번 20315 010-1234-5678 090101-3123456 kid@example.com'
        out = R.redact(raw)
        for secret in ['김민수','20315','010-1234-5678','090101-3123456','kid@example.com']:
            self.assertNotIn(secret, out)
        self.assertIn('[이름]', out)
        self.assertIn('[학생번호]', out)
        self.assertIn('[주민번호]', out)

    def test_student_record_source_name_is_generic(self):
        self.assertEqual(R.safe_source_name('김민수_학생부.xlsx', 'student_record'), '학생부 자료.xlsx')
        self.assertEqual(R.redact('김민수_수행평가.xlsx'), '[학생]_수행평가.xlsx')
        self.assertEqual(R.redact('음악과_수행평가.xlsx'), '음악과_수행평가.xlsx')

    def test_audit_details_do_not_export_filename_or_secret_keys(self):
        d = R.safe_audit_details({
            'name': '김민수_학생부.xlsx',
            'category': 'student_record',
            'token': 'secret-token',
            'path': r'C:\Users\teacher\김민수_학생부.xlsx',
            'error': r'cannot open C:\Users\teacher\김민수_학생부.xlsx',
        })
        self.assertEqual(d['name'], '로컬 문서.xlsx')
        self.assertEqual(d['path'], '[local-path]')
        self.assertNotIn('token', d)
        self.assertNotIn('김민수', str(d))


if __name__ == '__main__':
    unittest.main()
