"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function bucketFromRisk(risk: number) {
  if (risk >= 90) return { label: 'Very High', color: '#b42318', bg: '#fef3f2' };
  if (risk >= 70) return { label: 'High', color: '#b54708', bg: '#fffaeb' };
  if (risk >= 30) return { label: 'Moderate', color: '#175cd3', bg: '#eff8ff' };
  if (risk >= 10) return { label: 'Low', color: '#027a48', bg: '#ecfdf3' };
  return { label: 'Very Low', color: '#065f46', bg: '#ecfdf3' };
}

function combineRisk(audioRisk: number, motorRisk: number) {
  // Weighted average is okay for demo, but we add a light escalation rule so a strong signal isn't overly diluted.
  let combined = audioRisk * 0.55 + motorRisk * 0.45;
  const maxRisk = Math.max(audioRisk, motorRisk);
  const minRisk = Math.min(audioRisk, motorRisk);
  if (maxRisk >= 80 && minRisk >= 35) combined = Math.max(combined, maxRisk - 5);
  if (maxRisk <= 20 && minRisk <= 20) combined = Math.min(combined, 20);
  return Math.round(combined * 10) / 10;
}

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Audio", "Motor", "Dashboard"];
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
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

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const demoMode = (searchParams.get('demo') || '').toLowerCase();

  const data = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const audio = JSON.parse(localStorage.getItem('cic_audio_exam') || 'null');
    const motor = JSON.parse(localStorage.getItem('cic_motor_exam') || 'null');

    let audioRisk = Number(audio?.riskPercent ?? 50);
    if (demoMode === 'healthy') audioRisk = Number(audio?.riskPercent ?? 12);
    if (demoMode === 'high' || demoMode === 'risky' || demoMode === 'pd') audioRisk = Number(audio?.riskPercent ?? 92);

    let motorRisk = Number(motor?.motorRiskPercent ?? 50);
    if ((!motor || motor?.source === 'demo_seed') && demoMode === 'healthy') motorRisk = Number(motor?.motorRiskPercent ?? 12);
    if ((!motor || motor?.source === 'demo_seed') && (demoMode === 'high' || demoMode === 'risky' || demoMode === 'pd')) motorRisk = Number(motor?.motorRiskPercent ?? 68);

    const combined = combineRisk(audioRisk, motorRisk);
    return { audio, motor, audioRisk, motorRisk, combined };
  }, [demoMode]);

  const combinedRisk = data?.combined ?? 50;
  const bucket = bucketFromRisk(combinedRisk);
  const showEscalation = combinedRisk >= 70;
  const showExercises = combinedRisk >= 30;

  return (
    <main style={{ minHeight: '100vh', background: '#f6fbff', padding: '28px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, color: '#0e2f4d', fontSize: '2rem' }}>Cues in Conversation</h1>
          <p style={{ margin: '8px 0 0', color: '#5d7389' }}>Step 3 of 3 · Combined screening dashboard</p>
          <StepProgress step={3} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 20 }}>
          <section style={{ background: '#fff', border: '1px solid #dbe7f1', borderRadius: 18, padding: 22, boxShadow: '0 6px 24px rgba(13,38,76,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
              <div>
                <div style={{ color: '#5d7389', fontSize: 13, marginBottom: 8 }}>RISK SCORE</div>
                <div style={{ fontSize: '3rem', lineHeight: 1, color: '#15324d', fontWeight: 800 }}>{combinedRisk.toFixed(1)}%</div>
              </div>
              <div style={{ background: bucket.bg, color: bucket.color, border: `1px solid ${bucket.color}22`, borderRadius: 999, padding: '8px 12px', fontWeight: 700 }}>
                {bucket.label}
              </div>
            </div>

            {showEscalation && (
              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                <a href="https://www.nhs.uk/conditions/parkinsons-disease/" target="_blank" rel="noreferrer" style={ctaLink}>Find out more (NHS Parkinson's page)</a>
                <a href="https://calendly.com/tzeynepnazli/30min" target="_blank" rel="noreferrer" style={{ ...ctaLink, background: '#0f4db8', color: '#fff', borderColor: '#0f4db8' }}>Book a screening</a>
              </div>
            )}

            {showExercises ? (
              <div style={{ marginTop: 22 }}>
                <h3 style={{ margin: '0 0 10px', color: '#15324d' }}>Exercises for management</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: '#52677c', lineHeight: 1.7 }}>
                  <li>Gentle shoulder flexion / range-of-motion repetitions</li>
                  <li>Sit-to-stand practice (controlled, safe pace)</li>
                  <li>Short daily walking routine with posture focus</li>
                  <li>Balance drills near support (chair/wall)</li>
                </ul>
              </div>
            ) : (
              <div style={{ marginTop: 22, padding: 14, borderRadius: 12, background: '#f7fbff', border: '1px solid #dbe7f1', color: '#52677c' }}>
                No specific management exercises are recommended at this risk level. Monitor symptoms and re-screen if concerns persist.
              </div>
            )}

            <p style={{ marginTop: 18, color: '#6d7f90', fontSize: 12 }}>
              This tool is designed to assess potential early signs of Parkinson’s disease based on voice and physical responses. It is not a diagnostic tool. While management exercises are provided to support your well-being, please consider booking a screening with your healthcare professional if you have any concerns.
            </p>
          </section>

          <aside style={{ display: 'grid', gap: 16 }}>
            <div style={sideCard}>
              <h3 style={sideH}>Voice exam summary</h3>
              <div style={metricRow}><span>Audio risk</span><strong>{(data?.audioRisk ?? 0).toFixed(1)}%</strong></div>
              <div style={metricRow}><span>Status</span><span>{data?.audio ? 'Completed' : 'Demo default'}</span></div>
            </div>
            <div style={sideCard}>
              <h3 style={sideH}>Motor exam summary</h3>
              <div style={metricRow}><span>Motor risk</span><strong>{(data?.motorRisk ?? 0).toFixed(1)}%</strong></div>
              <div style={metricRow}><span>Form score</span><strong>{data?.motor?.formScore ?? 'N/A'}</strong></div>
            </div>
            <div style={sideCard}>
              <h3 style={sideH}>Next actions</h3>
              <div style={{ color: '#52677c', fontSize: 14, lineHeight: 1.6 }}>
                {showEscalation ? 'Discuss results with a clinician and complete an in-person screening.' : 'Monitor symptoms and repeat screening if concerns persist.'}
              </div>
              <div style={{ marginTop: 12 }}><Link href={demoMode ? `/?demo=${demoMode}` : "/"} style={{ color: '#0f4db8', textDecoration: 'none', fontWeight: 600 }}>← Start a new screening</Link></div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const ctaLink: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  border: '1px solid #cbd8e6',
  background: '#fff',
  color: '#15324d',
  borderRadius: 12,
  padding: '12px 14px',
  fontWeight: 700,
};
const sideCard: React.CSSProperties = { background: '#fff', border: '1px solid #dbe7f1', borderRadius: 18, padding: 16, boxShadow: '0 6px 24px rgba(13,38,76,0.06)' };
const sideH: React.CSSProperties = { margin: '0 0 10px', color: '#15324d', fontSize: '1rem' };
const metricRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#52677c', fontSize: 14 };
