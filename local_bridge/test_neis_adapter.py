import unittest
import neis_adapter as N


class NeisAdapterTests(unittest.TestCase):
    def test_assessment_aggregate(self):
        r = N.analyze('나이스_수행평가_입력현황.xlsx', '수행평가 미입력 미입력 완료 완료')
        self.assertIsNotNone(r)
        self.assertEqual(r.kind, 'assessment')
        self.assertEqual(r.category, 'assessment')
        self.assertEqual(r.issue_count, 2)
        self.assertIn('확인 필요 2건', r.title)
        self.assertNotIn('완료 완료', r.title)

    def test_student_record_aggregate(self):
        r = N.analyze('생활기록부 점검.csv', '학생부 세특 미완료 누락')
        self.assertEqual(r.kind, 'student_record')
        self.assertEqual(r.category, 'student_record')
        self.assertEqual(r.issue_count, 2)

    def test_attendance_aggregate(self):
        r = N.analyze('NEIS 출결확인.xlsx', '출결 결석 미확인')
        self.assertEqual(r.kind, 'attendance')
        self.assertEqual(r.category, 'student_record')

    def test_non_neis_document_ignored(self):
        self.assertIsNone(N.analyze('일반수업자료.txt', '기타 메모'))

    def test_raw_names_do_not_escape(self):
        r = N.analyze('나이스 학생부.xlsx', '홍길동 학생부 미입력 김철수 학생부 완료')
        self.assertNotIn('홍길동', r.title)
        self.assertNotIn('김철수', r.title)


if __name__ == '__main__':
    unittest.main()
