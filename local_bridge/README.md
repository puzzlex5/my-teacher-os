# Teacher OS Desktop Bridge v0.36

Teacher OS가 닫혀 있어도 PC에서 `Teacher OS Inbox`와 `Downloads` 폴더를 주기적으로 확인하는 로컬 전용 작업자입니다.

## 보안 원칙

- `127.0.0.1:43135`에만 바인딩합니다. LAN/인터넷에는 열지 않습니다.
- 브라우저 요청 Origin은 `https://puzzlex5.github.io`만 허용합니다.
- Snapshot/재검사는 기기별 pairing token이 있어야 합니다.
- HWPX/XLSX/CSV/TXT는 PC 안에서만 파싱합니다.
- PDF는 `pypdf`가 설치된 경우에만 PC 안에서 텍스트를 추출합니다.
- 구형 `.hwp`는 v0.36에서 파일명/메타데이터만 분석합니다.
- 원문과 원문 텍스트는 Teacher OS/GitHub/외부 서버로 전송하지 않습니다.
- 브라우저에는 업무분류, 마감일, 파일명 기반 제목, 신뢰도 같은 최소 파생정보만 제공합니다.

## Windows 최초 1회 설치

1. Python 3.11 이상을 설치합니다.
2. 이 폴더를 PC에 내려받습니다.
3. PowerShell에서 `install_windows.ps1`을 실행합니다.
4. 설치가 끝나면 `%USERPROFILE%\.teacher-os\bridge-config.json`에 기기별 token이 생성됩니다.
5. `python bridge.py`를 한 번 실행하면 화면에도 `Pairing token`이 표시됩니다.
6. Teacher OS → `백업·점검` → `로컬 자동화 연결`에 token을 한 번 저장합니다.

설치 스크립트는 Windows 시작프로그램에 `TeacherOSDesktopBridge.cmd`를 만들어 로그인 시 자동 실행되게 합니다. 관리자 권한이나 인증서/NEIS 비밀번호를 요구하지 않습니다.

## 직접 실행

```powershell
python bridge.py
```

PDF 텍스트 추출도 원하면 선택적으로:

```powershell
python -m pip install -r requirements-optional.txt
```

## 기본 감시 폴더

- `%USERPROFILE%\Teacher OS Inbox`
- `%USERPROFILE%\Downloads` (존재할 경우)

`bridge-config.json`의 `watchDirs`를 수정하면 학교에서 지정한 다운로드 폴더를 추가할 수 있습니다. 설정파일과 SQLite 상태 DB는 모두 `%USERPROFILE%\.teacher-os`에 있습니다.

## 현재 자동화 범위

- 새 CSV/TXT/MD/XLSX/HWPX/PDF/HWP 감지
- 업무 종류 분류: 평가 / 행정 / 일정 / 학생부 / 일반 문서
- 마감일 후보 추출
- 이메일·전화번호·주민등록번호 패턴 로컬 제거
- 중복 파일 해시 방지
- 실패 기록 후 다음 스캔에서 재시도
- Teacher OS가 열리면 안전한 파생 업무 자동 반영

v0.36은 NEIS/K-에듀파인 로그인이나 내부 API를 우회하지 않습니다. 이후 Adapter는 사용자가 정상 로그인한 세션 또는 공식 내보내기 파일만 사용하도록 이 Bridge 위에 분리해서 추가합니다.
