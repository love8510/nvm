# ⚙️ Supabase 연동 설정 가이드

## 전체 순서 (10분 소요)

```
1단계: Supabase SQL 스키마 실행
2단계: index.html에 URL·키 입력
3단계: 이메일 인증 설정
4단계: 실시간 구독 활성화
5단계: GitHub Pages 배포 (선택)
```

---

## 1단계 — Supabase SQL 스키마 실행

1. Supabase 대시보드 접속 → **SQL Editor** 클릭
2. `schema.sql` 파일 전체 내용 복사 → 붙여넣기 → **Run** 클릭
3. 하단에 `✅ 스키마 생성 완료` 메시지 확인

---

## 2단계 — index.html에 URL·키 입력

`index.html` 파일을 열어서 상단의 이 부분을 수정하세요:

```javascript
// ⚠️ 여기에 본인 Supabase 정보를 입력하세요
const SUPABASE_URL  = 'https://여기에-프로젝트-URL.supabase.co';
const SUPABASE_ANON = '여기에-anon-public-키를-붙여넣으세요';
```

**URL과 키 찾는 위치:**
- Supabase 대시보드 → **Project Settings** → **API**
- `Project URL` → SUPABASE_URL에 입력
- `anon public` 키 → SUPABASE_ANON에 입력

> ⚠️ `service_role` 키는 절대 여기 넣지 마세요. `anon` 키만 사용합니다.

---

## 3단계 — 이메일 인증 설정

**개발/테스트 중에는 인증 이메일을 끄는 것이 편합니다:**

Supabase 대시보드 → **Authentication** → **Providers** → **Email**
→ **Confirm email** 토글 **OFF**

**운영 시에는:**
→ **Confirm email** ON + **SMTP 설정** 권장

---

## 4단계 — 실시간 구독 활성화

Supabase 대시보드 → **Database** → **Replication**
→ `supabase_realtime` 섹션에서 아래 테이블 활성화:

| 테이블 | 활성화 여부 |
|--------|------------|
| `persons` | ✅ ON |
| `fall_checks` | ✅ ON |
| `staff_profiles` | 선택 |

---

## 5단계 — GitHub Pages 배포 (무료 호스팅)

```bash
# 저장소 생성 후
git init
git add index.html schema.sql
git commit -m "낙상예방 추적 시스템 초기 배포"
git remote add origin https://github.com/계정명/fall-prevention.git
git push -u origin main
```

GitHub 저장소 → **Settings** → **Pages**
→ Source: `main` 브랜치 → **Save**

배포 URL: `https://계정명.github.io/fall-prevention/`

---

## 직원 등록 방법

1. 앱 접속 → **직원 등록** 탭 클릭
2. 이름·이메일·비밀번호·권한 입력 후 등록
3. (이메일 확인 ON인 경우) 이메일 확인 링크 클릭
4. 로그인

**관리자(admin) 계정:** 모든 어르신 삭제 권한 보유  
**일반 직원(staff) 계정:** 본인이 등록한 어르신만 삭제 가능, 점검 입력 가능

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| 로그인 후 데이터가 안 보임 | RLS 정책 확인, schema.sql 재실행 |
| 실시간 동기화 안 됨 | Replication 탭에서 테이블 활성화 확인 |
| 이메일 인증 메일 안 옴 | Authentication → Email → Confirm email OFF |
| 저장 시 "permission denied" | RLS 정책 재확인, 로그인 상태 확인 |
| URL·키 오류 | Project Settings → API에서 재확인 |

---

## 다음 단계 (Cursor AI에 요청)

```
이 앱에 다음 기능을 추가해 줘:

1. WeasyPrint로 서버사이드 PDF 보고서 생성
   - Netlify Function 또는 Python FastAPI 엔드포인트
   - 기관 로고 삽입, A4 페이지 설정

2. 카카오 알림톡 연동
   - 고위험군 발생 시 담당 직원에게 자동 발송
   - 월간 점검 미완료 어르신 리마인더

3. 엑셀 내보내기
   - 기간별 점검 데이터 xlsx 다운로드
   - SheetJS 라이브러리 사용
```
