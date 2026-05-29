"use client";

// Extend JSX to allow the custom ElevenLabs element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "agent-id": string },
        HTMLElement
      >;
    }
  }
}

export default function ElevenLabsWidget({ agentId }: { agentId: string }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 360,
        height: 520,
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid #dbe7f1",
        background: "#fff",
        position: "relative",
        margin: "0 auto",
      }}
    >
      <elevenlabs-convai
        agent-id={agentId}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          background: "#fff",
          position: "relative",
          inset: "auto",
          margin: 0,
          zIndex: 1,
        }}
      />
    </div>
  );
}
