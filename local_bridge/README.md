# Teacher OS Desktop Bridge v0.46

Teacher OS가 닫혀 있어도 PC에서 `Teacher OS Inbox`와 `Downloads` 폴더를 주기적으로 확인하는 로컬 전용 작업자입니다. NEIS와 K-에듀파인에서 정상적으로 내려받은 파일을 로컬에서 집계해 교사가 확인해야 할 업무만 Teacher OS에 전달합니다.

v0.45의 **로컬 watchdog 자동복구**와 v0.44의 **복사 없는 자동 페어링**을 유지하면서, v0.46은 학생 개인정보가 파일명·업무 제목·감사로그를 통해 브라우저로 넘어갈 가능성을 한 단계 더 줄입니다.

## 보안 원칙

- `127.0.0.1:43135`에만 바인딩합니다. LAN/인터넷에는 열지 않습니다.
- 브라우저 요청 Origin은 `https://puzzlex5.github.io`만 허용합니다.
- Snapshot/재검사는 기기별 장기 pairing token이 있어야 합니다.
- 설치 과정에서는 장기 token을 화면이나 URL에 노출하지 않습니다. 5분 동안 한 번만 쓸 수 있는 임시 nonce를 브라우저에 전달하고, 로컬 Bridge에서 장기 token으로 교환한 즉시 nonce를 폐기합니다.
- watchdog은 문서 원문, pairing token, NEIS/K-에듀파인 로그인정보를 읽지 않습니다. 공개 loopback health 상태만 확인하고 Bridge 프로세스만 재시작합니다.
- HWPX/XLSX/CSV/TXT는 PC 안에서만 파싱합니다.
- PDF는 `pypdf`가 설치된 경우에만 PC 안에서 텍스트를 추출합니다.
- 구형 `.hwp`는 파일명/메타데이터만 분석합니다.
- 원문과 원문 텍스트는 Teacher OS/GitHub/외부 서버로 전송하지 않습니다.
- 브라우저에는 업무분류, 마감일, 집계 건수 같은 최소 파생정보만 제공합니다.
- NEIS/K-에듀파인 비밀번호·인증서 비밀번호를 저장하거나 로그인 보안을 우회하지 않습니다.

## v0.46 학생 개인정보 보호

브라우저에 전달하기 직전에 다시 개인정보 최소화 계층을 적용합니다. 이전 버전의 로컬 SQLite에 이미 저장된 파생 신호도 Snapshot 응답 시 동일하게 정제됩니다.

- 이메일, 전화번호, 주민등록번호 패턴을 마스킹합니다.
- `학생명`, `성명`, `학생 이름`, `이름`처럼 명시적으로 표시된 학생 이름을 `[이름]`으로 바꿉니다.
- `학번`, `학생번호`, `출석번호` 뒤의 숫자를 `[학생번호]`로 바꿉니다.
- `김민수_학생부.xlsx`, `김민수_수행평가.xlsx`처럼 학생 이름과 민감 업무가 결합된 전형적인 파일명은 `[학생]`으로 정제합니다.
- 학생부 계열 자료의 `sourceName`은 원래 파일명 대신 `학생부 자료.xlsx` 같은 일반화된 이름으로 전달합니다.
- 감사로그의 원본 파일명은 `로컬 문서.xlsx`처럼 일반화하며 로컬 경로·token·nonce·password·secret은 브라우저에 전달하지 않습니다.
- 브라우저 자체도 Desktop Bridge와 Google 자동동기화 결과를 다시 정제하므로 구형 백엔드에서 넘어온 값에 대해서도 방어 계층이 하나 더 있습니다.

교과명처럼 정상 업무 문구가 사람 이름으로 오인되지 않도록 모든 2~4글자 한글을 무차별 마스킹하지 않고, 명시적 이름 표기 또는 민감 업무 문맥이 있는 경우만 제한적으로 처리합니다.

## Windows 최초 1회 설치

1. Python 3.11 이상을 설치합니다.
2. `install_windows.ps1`을 실행합니다.
3. 설치 프로그램이 최신 Bridge와 watchdog 파일을 `%LOCALAPPDATA%\TeacherOS\bridge`에 설치하고 시작프로그램에 등록합니다.
4. 기본 브라우저에서 Teacher OS가 열리며 자동으로 페어링됩니다. **pairing token을 복사해 붙여 넣을 필요가 없습니다.**

설치 프로그램은 기존 Bridge가 실행 중이면 교체 후 v0.46 개인정보 보호 Bridge를 watchdog으로 다시 시작합니다. 관리자 권한, 업무포털 로그인정보, NEIS/K-에듀파인 비밀번호를 요구하지 않습니다.

자동 페어링은 다음 순서로 작동합니다.

1. 설치 프로그램이 암호학적으로 안전한 임시 nonce를 생성합니다.
2. nonce는 `%USERPROFILE%\.teacher-os\bridge-config.json`에 5분 만료시간과 함께 저장됩니다.
3. 브라우저 URL fragment에는 장기 token 대신 nonce만 전달됩니다. fragment는 서버 요청에 포함되지 않습니다.
4. Teacher OS가 `127.0.0.1`의 `/v1/pair`에 nonce를 보냅니다.
5. Bridge가 nonce·만료시간·Origin을 검증하고 장기 token을 한 번만 반환합니다.
6. nonce는 즉시 삭제되고 Teacher OS도 URL fragment를 즉시 제거합니다.

## 자동복구

- watchdog은 약 20초 간격으로 Bridge health를 확인합니다.
- Bridge가 죽거나 v0.46보다 오래된 Bridge가 떠 있으면 `bridge_v46.py`를 다시 실행합니다.
- 연속 실패 시 5초부터 최대 5분까지 지수 백오프로 재시도합니다.
- 중복 watchdog 실행은 Windows named mutex로 차단합니다.
- 자동복구 기록은 `%USERPROFILE%\.teacher-os\watchdog-v45.jsonl`에 최소 정보만 기록하며, 약 256KB를 넘으면 회전합니다.
- 로그에는 token, nonce, password, secret 값을 기록하지 않습니다.

직접 실행은 `python %LOCALAPPDATA%\TeacherOS\bridge\watchdog_v45.py`입니다. PDF 텍스트 추출이 필요하면 `python -m pip install pypdf`를 선택적으로 실행할 수 있습니다.

## 기본 감시 폴더

- `%USERPROFILE%\Teacher OS Inbox`
- `%USERPROFILE%\Downloads` (존재할 경우)

`bridge-config.json`의 `watchDirs`에 학교에서 사용하는 다운로드 폴더를 추가할 수 있습니다. 설정과 SQLite 상태 DB는 `%USERPROFILE%\.teacher-os`에만 저장됩니다.

## NEIS Local Adapter

- 학생부/생활기록부/세특 → `NEIS 학생부 점검`
- 출결/결석/지각/조퇴 → `NEIS 출결 점검`
- 수행평가/지필평가/성적처리 → `NEIS 평가·성적 점검`
- 교과진도/수업진도 → `NEIS 수업 진도 점검`

`미입력`, `미완료`, `누락`, `미확인` 등의 총 건수만 집계합니다. 학생 이름과 개별 행은 브라우저로 전달하지 않습니다.

## K-에듀파인 Local Adapter

- 문서함/공문/접수/시행 → `K-에듀파인 공문함 점검`
- 결재/기안/검토/협조/전결 → `K-에듀파인 결재 점검`
- 예산/지출/품의/정산/회계 → `K-에듀파인 예산·지출 점검`

`미처리`, `결재대기`, `미결재`, `반려`, `보완`, `미완료`, `누락` 등의 총 건수만 집계합니다. 문서 본문, 결재 의견, 개인 이름, 원문 행은 브라우저로 전달하지 않습니다.

Bridge는 내부 API 역분석이나 자동 로그인을 하지 않습니다. 공식 Open API 또는 사용자가 정상적으로 시스템을 사용하면서 내려받은 파일만 대상으로 합니다.
