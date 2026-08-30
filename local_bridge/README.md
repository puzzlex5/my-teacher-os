# Teacher OS Desktop Bridge v0.37

Teacher OS가 닫혀 있어도 PC에서 `Teacher OS Inbox`와 `Downloads` 폴더를 주기적으로 확인하는 로컬 전용 작업자입니다. v0.37부터 NEIS 내보내기 파일을 별도 Adapter로 인식해 학생 이름/원문 행을 보내지 않고 **미입력·누락·미완료 건수만 집계**합니다.

## 보안 원칙

- `127.0.0.1:43135`에만 바인딩합니다. LAN/인터넷에는 열지 않습니다.
- 브라우저 요청 Origin은 `https://puzzlex5.github.io`만 허용합니다.
- Snapshot/재검사는 기기별 pairing token이 있어야 합니다.
- HWPX/XLSX/CSV/TXT는 PC 안에서만 파싱합니다.
- PDF는 `pypdf`가 설치된 경우에만 PC 안에서 텍스트를 추출합니다.
- 구형 `.hwp`는 파일명/메타데이터만 분석합니다.
- 원문과 원문 텍스트는 Teacher OS/GitHub/외부 서버로 전송하지 않습니다.
- 브라우저에는 업무분류, 마감일, 파일명 기반 제목, 신뢰도, 집계 건수 같은 최소 파생정보만 제공합니다.
- NEIS 비밀번호·인증서 비밀번호를 저장하거나 로그인 보안을 우회하지 않습니다.

## Windows 최초 1회 설치

1. Python 3.11 이상을 설치합니다.
2. 이 폴더를 PC에 내려받습니다.
3. PowerShell에서 `install_windows.ps1`을 실행합니다.
4. 설치가 끝나면 `%USERPROFILE%\.teacher-os\bridge-config.json`에 기기별 token이 생성됩니다.
5. Teacher OS → `백업·점검` → `로컬 자동화 연결`에 token을 한 번 저장합니다.

설치 스크립트는 Windows 시작프로그램에 `TeacherOSDesktopBridge.cmd`를 만들어 로그인 시 `bridge_v37.py`가 자동 실행되게 합니다. 관리자 권한이나 NEIS/K-에듀파인 로그인정보를 요구하지 않습니다.

## 직접 실행

```powershell
python bridge_v37.py
```

PDF 텍스트 추출도 원하면 선택적으로:

```powershell
python -m pip install -r requirements-optional.txt
```

## 기본 감시 폴더

- `%USERPROFILE%\Teacher OS Inbox`
- `%USERPROFILE%\Downloads` (존재할 경우)

`bridge-config.json`의 `watchDirs`를 수정하면 학교에서 지정한 다운로드 폴더를 추가할 수 있습니다. 설정파일과 SQLite 상태 DB는 모두 `%USERPROFILE%\.teacher-os`에 있습니다.

## NEIS Local Adapter v0.37

파일명이나 로컬 추출 내용에서 NEIS 관련 자료임이 확인되면 다음 유형으로 집계합니다.

- 학생부/생활기록부/세특 → `NEIS 학생부 점검`
- 출결/결석/지각/조퇴 → `NEIS 출결 점검`
- 수행평가/지필평가/성적처리 → `NEIS 평가·성적 점검`
- 교과진도/수업진도 → `NEIS 수업 진도 점검`

`미입력`, `미완료`, `미처리`, `누락`, `미확인` 같은 상태의 **총 건수만** Teacher OS 업무 제목에 반영합니다. 원문에 포함된 학생 이름이나 개별 행은 브라우저로 전달하지 않습니다.

## 현재 자동화 범위

- 새 CSV/TXT/MD/XLSX/HWPX/PDF/HWP 감지
- 일반 업무 분류: 평가 / 행정 / 일정 / 학생부 / 일반 문서
- NEIS 내보내기 자동 식별 및 집계
- 마감일 후보 추출
- 이메일·전화번호·주민등록번호 패턴 로컬 제거
- 중복 파일 해시 방지
- 실패 기록 후 다음 스캔에서 재시도
- Teacher OS가 열리면 안전한 파생 업무 자동 반영

v0.37은 NEIS 내부 API 역분석이나 자동 로그인을 하지 않습니다. 정상적인 NEIS 사용 과정에서 내려받은 파일 또는 공식 Open API를 대상으로 합니다.
