import ElevenLabsWidget from "@/components/ElevenLabsWidget";
import RecorderPanel from "@/components/RecorderPanel";

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Audio", "Motor", "Dashboard"];
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                fontWeight: 700,
                background: done ? "#0f4db8" : active ? "#e8f1ff" : "#fff",
                color: done ? "#fff" : active ? "#0f4db8" : "#7a8da1",
                border: `1px solid ${active || done ? "#0f4db8" : "#dbe7f1"}`,
              }}
            >
              {idx}
            </div>
            <span
              style={{
                color: active ? "#15324d" : "#6f8397",
                fontWeight: active ? 700 : 500,
                fontSize: 12,
              }}
            >
              {label}
            </span>
            {idx < 3 && <div style={{ width: 18, height: 2, background: "#dbe7f1", borderRadius: 99 }} />}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <main style={styles.main}>
      <div style={styles.grid} aria-hidden />

      <section style={styles.hero}>
        <div style={styles.leftCol}>
          <div style={styles.infoCard}>
            <h1 style={styles.title}>Clues in Conversation</h1>
            <p style={styles.tagline}>Multimodal Parkinson's risk screening</p>
            <p style={styles.subtitle}>Step 1 of 3 - Vocal screening exam</p>

            <div style={{ ...styles.progressCard, marginTop: 14 }}>
              <div style={{ color: "#5d7389", fontSize: 12, marginBottom: 6 }}>Progress</div>
              <StepProgress step={1} />
            </div>

            <h2 style={{ margin: "16px 0 0", color: "#15324d", fontSize: "1.5rem" }}>Vocal exam</h2>
            <p style={{ margin: "10px 0 0", color: "#52677c", lineHeight: 1.6 }}>
              Speak with the voice agent for a short conversation, record a sample, then continue to the motor/physio exam.
              For demo flow, progression is not blocked by backend audio processing.
            </p>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: "0 0 8px", color: "#15324d", fontSize: "1.05rem" }}>How it works</h3>
              <ol style={{ margin: "0 0 0 18px", color: "#52677c", lineHeight: 1.7 }}>
                <li>Complete the voice exam</li>
                <li>Move to the guided motor/physio exam</li>
                <li>Receive a combined risk dashboard with next steps</li>
              </ol>
            </div>
          </div>
        </div>

        <div style={styles.centerCol}>
          <div style={styles.widgetShell}>
            <div style={styles.widgetFrame}>
              <ElevenLabsWidget agentId="agent_PLACEHOLDER" />
            </div>
          </div>
        </div>

        <div style={styles.rightCol} aria-hidden />
      </section>

      <RecorderPanel />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#f6fbff",
    position: "relative",
    padding: "18px 24px 150px",
    overflowX: "hidden",
  },
  grid: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    backgroundImage:
      "linear-gradient(rgba(15,77,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,77,184,0.04) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
  },
  title: { margin: 0, color: "#0e2f4d", fontSize: "2.2rem", lineHeight: 1.1 },
  tagline: { margin: "8px 0 0", color: "#264b6c", fontSize: "1.05rem", fontWeight: 600 },
  subtitle: { margin: "6px 0 14px", color: "#5d7389" },
  progressCard: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid #dbe7f1",
    borderRadius: 14,
    padding: "10px 12px",
    boxShadow: "0 6px 20px rgba(13,38,76,0.06)",
  },
  hero: {
    position: "relative",
    zIndex: 1,
    maxWidth: 1400,
    margin: "20px auto 0",
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) minmax(360px, 520px) minmax(280px, 360px)",
    gap: 20,
    justifyContent: "space-between",
    alignItems: "start",
  },
  leftCol: { minWidth: 0 },
  centerCol: { display: "flex", justifyContent: "center", alignItems: "flex-start" },
  rightCol: {},
  infoCard: {
    background: "#fff",
    border: "1px solid #dbe7f1",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 6px 24px rgba(13,38,76,0.06)",
  },
  widgetShell: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    border: "1px solid #dbe7f1",
    borderRadius: 18,
    padding: 12,
    boxShadow: "0 6px 24px rgba(13,38,76,0.06)",
  },
  widgetFrame: {
    width: "100%",
    minHeight: 420,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflow: "hidden",
    borderRadius: 14,
  },
};
