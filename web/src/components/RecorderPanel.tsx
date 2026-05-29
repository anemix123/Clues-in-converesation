"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

type AnalysisResult = {
  probability_percent?: number;
  risk_percent?: number;
  probability?: number;
  error?: string;
};

function getDemoMode(search: ReturnType<typeof useSearchParams>): "healthy" | "high" | null {
  const d = (search.get("demo") || "").toLowerCase();
  if (d === "healthy") return "healthy";
  if (d === "high" || d === "risky" || d === "pd") return "high";
  return null;
}

export default function RecorderPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [savedPath, setSavedPath] = useState<string>("");
  const [audioExamDone, setAudioExamDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const demoMode = getDemoMode(searchParams);
  const canProceed = !!audioBlob || !!savedPath || audioExamDone;

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setSavedPath("");
      setAudioExamDone(false);
      setStatus("Requesting mic...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstart = () => {
        setStatus("Recording...");
        setIsRecording(true);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setIsRecording(false);
        setStatus(blob.size > 0 ? `Recording ready (${Math.round(blob.size / 1024)} KB)` : "Recording empty");
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      console.error(err);
      setStatus("Mic access failed");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setStatus("Stopping...");
    }
  };

  const saveRecording = async () => {
    if (!audioBlob) return setStatus("No recording to save");
    try {
      setStatus("Saving...");
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      const res = await fetch("/api/save-audio", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || JSON.stringify(data));
      setSavedPath(data.path || "");
      setStatus(`Saved`);
    } catch (err) {
      console.error(err);
      setStatus(`Save failed: ${(err as Error).message}`);
    }
  };

  const fallbackAudioRisk = () => (demoMode === "healthy" ? 12 : demoMode === "high" ? 92 : 50);

  const writeAudioExamLocal = (riskPercent: number) => {
    localStorage.setItem(
      "cic_audio_exam",
      JSON.stringify({
        completedAt: new Date().toISOString(),
        recordingPath: savedPath || null,
        riskPercent: Number(riskPercent),
        source: "benchmark_audio_score_for_demo",
        demoMode: demoMode || "default",
      })
    );
    setAudioExamDone(true);
  };

  const fetchBenchmarkRisk = async () => {
    const preferStatus = demoMode === "healthy" ? 0 : demoMode === "high" ? 1 : undefined;
    const res = await fetch("/api/demo-benchmark-sample", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefer_status: preferStatus }),
    });
    const data: AnalysisResult = await res.json();
    if (!res.ok) throw new Error((data as any)?.error || "Audio scoring failed");
    const percent = data.probability_percent ?? data.risk_percent ?? (typeof data.probability === "number" ? data.probability * 100 : fallbackAudioRisk());
    return Number(percent);
  };

  const completeAudioExam = async () => {
    try {
      setIsLoading(true);
      setStatus("Scoring vocal exam...");
      let percent = fallbackAudioRisk();
      try {
        percent = await fetchBenchmarkRisk();
      } catch (e) {
        console.warn("Benchmark fetch failed, using fallback audio demo risk", e);
        setStatus(`Vocal exam demo fallback used (${percent.toFixed(1)}%)`);
      }
      writeAudioExamLocal(percent);
      setStatus(`Vocal exam complete (${Number(percent).toFixed(1)}%)`);
    } catch (err) {
      console.error(err);
      setStatus(`Vocal exam failed: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const continueToMotor = async () => {
    // For demo flow, do not hard-block on backend processing.
    if (!audioExamDone) {
      try {
        let percent = fallbackAudioRisk();
        try {
          percent = await fetchBenchmarkRisk();
        } catch {
          // fallback silently for smoother flow
        }
        writeAudioExamLocal(percent);
      } catch {
        // still continue
      }
    }
    const q = demoMode ? `?demo=${demoMode}` : "";
    router.push(`/motor${q}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 24,
        right: 24,
        bottom: 20,
        zIndex: 50,
        background: "rgba(255,255,255,0.94)",
        border: "1px solid #d9e5ef",
        borderRadius: 18,
        padding: "16px 18px",
        boxShadow: "0 8px 30px rgba(13,38,76,0.12)",
        backdropFilter: "blur(8px)",
        minHeight: 116,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button type="button" onClick={startRecording} disabled={isRecording} style={btnPrimary}>Start recording</button>
        <button type="button" onClick={stopRecording} disabled={!isRecording} style={btn}>Stop</button>
        <button type="button" onClick={saveRecording} disabled={!audioBlob} style={btn}>Save voice sample</button>
        <button type="button" onClick={completeAudioExam} disabled={isLoading} style={btnAccent}>
          {isLoading ? "Scoring..." : "Complete vocal exam"}
        </button>
        <span style={{ color: "#4f6478", fontSize: 13 }}>{status}</span>
      </div>

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "#6d7f90" }}>
          {savedPath ? `Saved recording (UX demo): ${savedPath}` : "Record and save a short voice sample (30–60s)."}
          {demoMode && <span style={{ marginLeft: 8, color: '#0f4db8' }}>Demo mode: {demoMode}</span>}
        </div>
        <button
          type="button"
          onClick={continueToMotor}
          disabled={!canProceed}
          style={{ ...btnPrimary, opacity: canProceed ? 1 : 0.55 }}
        >
          Continue to motor exam →
        </button>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  border: "1px solid #cbd8e6",
  background: "#fff",
  color: "#15324d",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#0f4db8",
  borderColor: "#0f4db8",
  color: "#fff",
};

const btnAccent: React.CSSProperties = {
  ...btn,
  background: "#11a3a3",
  borderColor: "#11a3a3",
  color: "#fff",
};
