# Teacher OS Google Autopilot v0.34

이 Gateway는 **개인 Google 계정 안에서만** Gmail·Drive·Calendar를 읽고 Teacher OS에 전달합니다. 공개 GitHub 저장소에는 Gmail 본문, Drive 원본, Calendar 내용이 저장되지 않습니다.

## 최초 1회 설정

1. `script.google.com`에서 새 Apps Script 프로젝트를 만듭니다.
2. 이 폴더의 `Code.gs` 내용을 프로젝트의 `Code.gs`에 붙여 넣습니다.
3. 프로젝트 설정에서 `appsscript.json` 표시를 켠 뒤 이 폴더의 `appsscript.json` 내용으로 교체합니다.
4. **배포 → 새 배포 → 웹 앱**을 선택합니다.
   - 실행 사용자: **나**
   - 액세스 권한: 가능하면 **나만**
5. 처음 권한 요청에서 Gmail 읽기, Drive, Calendar, Apps Script 트리거 권한을 승인합니다.
6. 배포 후 `https://script.google.com/macros/s/.../exec` 형식의 Web App 주소를 복사합니다.
7. Teacher OS → **백업·점검 → 완전 자동화 연결**에 주소를 한 번 붙여 넣고 `연결 저장`을 누릅니다.
8. `Gateway 열어 승인`을 한 번 눌러 같은 Google 계정으로 Web App이 정상 열리는지 확인합니다.

이후에는 Apps Script가 15분마다 자동으로 스캔합니다. 사이트를 닫아도 백그라운드 감지는 계속됩니다.

## v0.42 동기화 안정성 보강

Gateway 상태에 한꺼번에 많은 새 항목이 쌓여도 오래된 미동기화 항목부터 250건씩 순서대로 전달합니다. Teacher OS 브라우저는 한 번의 동기화에서 최대 5페이지를 연속으로 받고, 더 남아 있으면 10초 뒤 자동으로 이어 받습니다. 따라서 250건을 넘는 변경이 생겨도 cursor가 마지막 항목으로 먼저 뛰어 누락되는 방식은 사용하지 않습니다.

서버 보관량도 500건에서 2,000건으로 확대했습니다. 이미 이전 `Code.gs`를 배포한 경우 이 저장소의 최신 `Code.gs`로 교체하고 **새 버전으로 웹 앱을 다시 배포**해야 이 보강이 Google Gateway에도 적용됩니다. Web App `/exec` 주소를 유지하는 새 버전 배포라면 Teacher OS에 주소를 다시 입력할 필요는 없습니다.

## 자동으로 만들어지는 Google 자원

첫 연결 시 Apps Script가 사용자 Google 계정 안에 다음을 만듭니다.

- Drive 폴더 `Teacher OS Automation`
- 그 안의 `Teacher OS Inbox`
- 비공개 상태 파일 `teacher-os-private-state.json`
- 전용 Calendar `Teacher OS`
- 15분 간격 Apps Script 시간 트리거

학교 문서를 `Teacher OS Inbox`에 넣으면 Google Docs와 텍스트 파일은 본문까지 읽고, PDF·이미지·기타 파일은 현재 버전에서는 파일명과 메타데이터를 중심으로 판단합니다.

## 자동화 정책

### 자동 실행 가능

- Gmail/Drive에서 기한·업무 후보 감지
- Google Calendar 일정의 Teacher OS 미러링
- 고신뢰도 행정 마감의 Teacher OS 행정업무 생성
- `Teacher OS Inbox`의 명확한 평가계획 문서에서 평가 항목 생성
- 전용 `Teacher OS` Calendar에 비파괴 알림 생성
- Teacher OS 임시 할 일 생성
- 오류 시 지수 백오프 재시도
- 누락된 시간 트리거 자동 복구

### 반드시 사용자 승인

- 기존 Google Calendar 일정 변경 또는 삭제
- Gmail 외부 발송
- Drive 파일 이동·삭제·공유
- 기존 Teacher OS 핵심 데이터 삭제·덮어쓰기

v0.34 Gateway는 안전을 위해 위 고위험 작업을 **승인해도 자동 실행하지 않는 보수적 기본값**으로 시작합니다. 승인 기록만 남기며, 실제 외부 변경 커맨드는 이후 별도 테스트를 거쳐 활성화하도록 설계되어 있습니다.

## 개인정보

- Gmail 전체 본문을 상태 파일에 보관하지 않습니다. 일정·업무 판단에 필요한 짧은 문장만 저장합니다.
- 이메일 주소와 전화번호 패턴은 저장 전에 마스킹합니다.
- 상태 파일은 사용자의 Google Drive에만 존재합니다.
- Teacher OS 사이트에는 구조화 결과와 감사 로그 일부만 브라우저 로컬 저장소에 남습니다.
- 공개 GitHub에는 사용자 데이터가 기록되지 않습니다.

## 기본 Gmail 감지 검색식

```text
newer_than:7d (공문 OR 제출 OR 마감 OR 회신 OR 수행평가 OR 지필평가 OR 일정 OR 업무 OR 협조)
```

Teacher OS 설정 화면에서 검색식을 변경할 수 있습니다.
