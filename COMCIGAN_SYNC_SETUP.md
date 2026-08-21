# 컴시간 자동동기화 — 최초 1회 설정

Teacher OS는 공개 GitHub 저장소이므로 학교코드와 교사 선택값을 코드에 직접 넣지 않습니다.

Repository → **Settings → Secrets and variables → Actions → New repository secret** 에 다음 3개를 등록합니다.

- `COMCIGAN_SCHOOL_CODE` — 컴시간 교사용 화면의 학교코드
- `COMCIGAN_TEACHER_INDEX` — 컴시간 교사 선택 목록에서 본인 앞에 표시되는 번호
- `TEACHEROS_SYNC_KEY` — 본인만 아는 충분히 긴 임의 문자열

그 다음 Teacher OS → **시간표 → 자동동기화 연결**에서 `TEACHEROS_SYNC_KEY`와 동일한 값을 한 번 입력합니다.

이후 GitHub Actions가 평일 **07:20 KST**에 컴시간 교사용 시간표를 확인합니다. 학교코드·교사번호·동기화 키는 GitHub Secrets에서만 사용되며, 공개 저장소에는 AES-256-GCM으로 암호화된 시간표 파일만 저장됩니다.

컴시간 데이터 파싱은 비공식 라이브러리를 사용하므로 컴시간 서비스 구조 변경 시 일시적으로 동기화가 실패할 수 있습니다. 이 경우 Teacher OS의 기본 시간표와 이미지/문서 일괄 업로드 기능을 fallback으로 사용합니다.
