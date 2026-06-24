-- ================================================================
-- 낙상예방 위험도 추적 시스템 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor에 이 파일을 그대로 붙여넣고 실행
-- ================================================================

-- ── 1. 직원 프로필 테이블 (Supabase Auth 연동) ──────────────────
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff',   -- 'admin' | 'staff'
  center_name TEXT NOT NULL DEFAULT '소양강댐노인복지관',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. 대상 어르신 테이블 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.persons (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  birth       DATE,
  gender      TEXT,
  staff_id    UUID REFERENCES public.staff_profiles(id),
  staff_name  TEXT,
  service     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id)
);

-- ── 3. 낙상위험 점검 기록 테이블 ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fall_checks (
  id           BIGSERIAL PRIMARY KEY,
  person_id    BIGINT NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  check_date   DATE NOT NULL,
  total_score  INTEGER NOT NULL,
  answers      JSONB,                          -- 항목별 답변 저장
  intervention TEXT,
  memo         TEXT,
  checked_by   UUID REFERENCES auth.users(id), -- 입력한 직원
  checked_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS(행 수준 보안) 활성화 ─────────────────────────────────
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fall_checks     ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS 정책 — 같은 기관 직원은 모두 읽기 가능 ───────────────
-- staff_profiles: 본인만 수정, 전체 읽기
CREATE POLICY "profiles_select" ON public.staff_profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON public.staff_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.staff_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- persons: 로그인한 직원 전체 읽기/쓰기
CREATE POLICY "persons_select" ON public.persons
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "persons_insert" ON public.persons
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "persons_update" ON public.persons
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "persons_delete" ON public.persons
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- fall_checks: 로그인한 직원 전체 읽기, 본인 작성만 수정/삭제
CREATE POLICY "checks_select" ON public.fall_checks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "checks_insert" ON public.fall_checks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "checks_update" ON public.fall_checks
  FOR UPDATE USING (auth.uid() = checked_by);

CREATE POLICY "checks_delete" ON public.fall_checks
  FOR DELETE USING (
    auth.uid() = checked_by
    OR EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 6. 실시간 구독 활성화 ────────────────────────────────────────
-- Supabase 대시보드 > Database > Replication > supabase_realtime
-- 아래 테이블 3개를 Realtime 활성화 목록에 추가하세요:
-- ✅ persons
-- ✅ fall_checks
-- (staff_profiles는 선택)

-- ── 7. 인덱스 ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_checks_person ON public.fall_checks(person_id);
CREATE INDEX IF NOT EXISTS idx_checks_date   ON public.fall_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_persons_staff ON public.persons(staff_id);

-- ── 완료 메시지 ──────────────────────────────────────────────────
SELECT '✅ 스키마 생성 완료' AS result;
