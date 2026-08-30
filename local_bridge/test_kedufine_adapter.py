import unittest
import kedufine_adapter as K


class EdufineAdapterTests(unittest.TestCase):
    def test_approval_aggregate(self):
        r = K.analyze('K-에듀파인_결재대기.xlsx', '기안문 결재대기 미결재 완료')
        self.assertIsNotNone(r)
        self.assertEqual(r.kind, 'approval')
        self.assertEqual(r.category, 'admin')
        self.assertEqual(r.issue_count, 2)
        self.assertIn('확인 필요 2건', r.title)

    def test_finance_aggregate(self):
        r = K.analyze('에듀파인_예산지출.csv', '예산 지출 품의 정산 미완료')
        self.assertEqual(r.kind, 'finance')
        self.assertEqual(r.issue_count, 1)
        self.assertIn('예산·지출', r.title)

    def test_document_box_aggregate(self):
        r = K.analyze('업무관리_공문함.xlsx', '공문 접수 미처리 시행')
        self.assertEqual(r.kind, 'document_box')
        self.assertEqual(r.issue_count, 1)
        self.assertIn('공문함', r.title)

    def test_non_edufine_document_ignored(self):
        self.assertIsNone(K.analyze('일반수업자료.txt', '수업자료 메모'))

    def test_raw_names_and_approval_body_do_not_escape(self):
        r = K.analyze('K-에듀파인_결재.xlsx', '홍길동 기안 결재대기 김철수 검토 의견 민감한 본문')
        self.assertNotIn('홍길동', r.title)
        self.assertNotIn('김철수', r.title)
        self.assertNotIn('민감한 본문', r.title)


if __name__ == '__main__':
    unittest.main()
