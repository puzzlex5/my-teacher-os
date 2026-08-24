# Teacher OS Migration Package

이 폴더는 MY TEACHER OS를 ChatGPT, Claude 또는 미래의 다른 AI/개발자에게 인수인계하기 위한 **제품 지식의 공식 패키지**다.

## 목적

AI의 대화 기억에 제품 지식을 묶어 두지 않는다. 새 AI는 이 폴더와 저장소의 실제 코드를 읽고 현재 개발을 이어가야 한다.

## 읽는 순서

1. `00_PROJECT_MASTER.md`
2. `01_PRODUCT_PRINCIPLES.md`
3. `02_ARCHITECTURE_AND_RUNTIME.md`
4. `03_DATA_AND_STORAGE.md`
5. `04_PRIVACY_SECURITY.md`
6. `05_FEATURE_MAP.md`
7. `06_DOCUMENT_INTELLIGENCE.md`
8. `07_TEACHING_AND_STUDENT_WORKFLOWS.md`
9. `08_TESTING_AND_QUALITY.md`
10. `09_VERSION_AND_DECISIONS.md`
11. `10_KNOWN_ISSUES.md`
12. `11_ROADMAP_TO_1_0.md`
13. `12_AUTOMATION_AND_OPERATIONS.md`
14. `13_AI_HANDOFF_PROMPT.md`
15. `14_PRIVATE_CONTEXT_GUIDE.md`

## Source of truth 우선순위

충돌할 경우 아래 순서를 따른다.

1. 현재 저장소의 실제 코드와 테스트
2. 최신 공식 교육부·교육청·학교 자료
3. 이 Migration Package의 최신 문서
4. 과거 대화 요약
5. AI의 추론 또는 기억

코드와 문서가 다르면 문서를 맹신하지 말고 실제 코드를 확인한 뒤 문서를 갱신한다.

## 현재 제품 상태

- 제품: MY TEACHER OS
- 배포: GitHub Pages 기반 웹앱
- 공개 저장소: `puzzlex5/my-teacher-os`
- 공개 주소: `https://puzzlex5.github.io/my-teacher-os/`
- 공개 런타임: v0.32 계열
- 통합 작업 브랜치: `v1-consolidation`
- 목표: 안정적인 Teacher OS 1.0

## 중요 보안 규칙

이 폴더는 공개 저장소에 존재하므로 다음을 절대 기록하지 않는다.

- 실제 학생 개인정보
- 상담/학교폭력 원문
- 교직원 연락처 원문
- 학교 내부문서 원문 또는 추출 원문
- 녹음 파일
- 비밀번호·토큰·계정 식별정보
- 사용자의 개인적인 다른 대화 내용

민감한 ChatGPT 대화 export나 실제 학교 자료는 `14_PRIVATE_CONTEXT_GUIDE.md`에 따라 별도의 비공개 전달물로 취급한다.

## 인수인계 원칙

새 AI는 먼저 모든 문서를 읽고 저장소를 검사한 뒤 작업한다. 기존 기능을 이해하지 못한 상태에서 대규모 재작성하지 않는다. 정확도와 데이터 보존을 기능 추가보다 우선한다.

## 유지 규칙

Migration Package는 일회성 문서가 아니다. 다음 변화가 생기면 같은 작업에서 관련 문서를 함께 갱신한다.

- 공개 버전 또는 1.0 통합 구조 변경
- 데이터/저장소 스키마 변경
- 개인정보 경계 변경
- 핵심 기능 추가·삭제·동작 변경
- 알려진 결함 해결 또는 새로운 중대 결함 발견
- 테스트/릴리스 기준 변경
- 자동화 운영정책 변경

특히 1.0 Release Candidate와 1.0 공개 전환 직전에는 전체 패키지를 실제 코드·테스트와 다시 대조한다.
