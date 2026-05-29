"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ExercisePage from "@/components/motor/ExercisePage";

const defaultExercise = {
  id: "shoulder_flexion",
  name: "Upper Limb Mobility Test",
  description: "Guided shoulder flexion task used as a quick motor screening proxy.",
  ailments: ["motor screening"],
  video_url: "/exercises/reference-exercise.mp4",
  tracked_joint: "leftShoulder",
  resting_angle: 0,
  target_angle: 85,
  tolerance: 20,
  phases: [
    { name: "ready" as const, duration: 5 },
    { name: "raise" as const, duration: 1 },
    { name: "hold" as const, duration: 5 },
    { name: "lower" as const, duration: 2 },
  ],
  instructions: "Raise your LEFT arm to shoulder height, hold, and lower as guided.",
};

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Audio", "Motor", "Dashboard"];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, background: done ? '#0f4db8' : active ? '#e8f1ff' : '#fff', color: done ? '#fff' : active ? '#0f4db8' : '#7a8da1', border: `1px solid ${active || done ? '#0f4db8' : '#dbe7f1'}` }}>{idx}</div>
            <span style={{ color: active ? '#15324d' : '#6f8397', fontWeight: active ? 700 : 500, fontSize: 12 }}>{label}</span>
            {idx < 3 && <div style={{ width: 18, height: 2, background: '#dbe7f1', borderRadius: 99 }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function MotorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [latestScore, setLatestScore] = useState<number>(50);
  const [sawScoreChange, setSawScoreChange] = useState(false);
  const demoMode = (searchParams.get('demo') || '').toLowerCase();

  const audioExists = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('cic_audio_exam');
  }, []);

  const handleScoreUpdate = (score: number) => {
    setLatestScore(score);
    if (Math.abs(score - 50) > 0.1) setSawScoreChange(true);
  };

  const finishMotorExam = () => {
    let formScore = Number(latestScore);

    // Demo smoothing: if the motor model wasn't really run (stays near default 50),
    // seed a more realistic form score using hidden demo mode for cleaner demo flow.
    if (!sawScoreChange && Math.abs(formScore - 50) <= 0.1) {
      if (demoMode === 'healthy') formScore = 88;
      else if (demoMode === 'high' || demoMode === 'risky' || demoMode === 'pd') formScore = 32;
    }

    formScore = Math.max(0, Math.min(100, Math.round(formScore * 10) / 10));
    const motorRiskPercent = Math.max(0, Math.min(100, Math.round((100 - formScore) * 10) / 10));

    localStorage.setItem('cic_motor_exam', JSON.stringify({
      completedAt: new Date().toISOString(),
      formScore,
      motorRiskPercent,
      exerciseId: defaultExercise.id,
      source: sawScoreChange ? 'cv_motor_exam' : 'demo_seed',
    }));
    const q = demoMode ? `?demo=${demoMode}` : '';
    router.push(`/dashboard${q}`);
  };

  return (
    <div style={{ background: '#f6fbff', minHeight: '100vh', position: 'relative' }}>
      {!audioExists && (
        <div style={{ padding: 16, background: '#fff4d8', borderBottom: '1px solid #f0d38a', color: '#6e5600' }}>
          Vocal exam not found in this browser session. You can still test the motor exam, but dashboard may be incomplete.
        </div>
      )}
      <ExercisePage exercise={defaultExercise} onBack={() => router.push(demoMode ? `/?demo=${demoMode}` : '/')} onScoreUpdate={handleScoreUpdate} />

      <div style={{ position: 'fixed', bottom: 20, left: 20, right: 20, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.95)', border: '1px solid #dbe7f1', borderRadius: 16, padding: '12px 16px', boxShadow: '0 8px 30px rgba(13,38,76,0.12)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ color: '#5d7389', fontSize: 12 }}>Step 2 of 3 · Motor / physio exam</div>
          <StepProgress step={2} />
          <div style={{ color: '#415a72', fontSize: 13 }}>
            Current motor / form score: <strong>{Math.round(latestScore)}</strong>
            {demoMode ? <span style={{ marginLeft: 8, color: '#0f4db8' }}>Demo mode: {demoMode}</span> : null}
          </div>
        </div>
        <button onClick={finishMotorExam} style={{ border: 'none', background: '#0f4db8', color: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>
          Finish motor exam & view dashboard →
        </button>
      </div>
    </div>
  );
}
