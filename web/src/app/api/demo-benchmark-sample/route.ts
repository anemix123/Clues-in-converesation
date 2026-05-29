import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let preferStatus: number | undefined = undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && (body.prefer_status === 0 || body.prefer_status === 1)) {
      preferStatus = body.prefer_status;
    }
  } catch {}

  const repoRoot = path.resolve(process.cwd(), ".."); // web/ -> project root
  const scriptPath = path.join(repoRoot, "src", "get_benchmark_demo_sample.py");

  return await new Promise((resolve) => {
    const py = spawn("python", [scriptPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...(preferStatus !== undefined ? { DEMO_PREFER_STATUS: String(preferStatus) } : {}),
      },
    });
    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));

    py.on("close", (code) => {
      try {
        const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
        const lastLine = lines[lines.length - 1] || "{}";
        const parsed = JSON.parse(lastLine);
        if (code !== 0 || parsed?.success === false) {
          resolve(
            NextResponse.json(
              {
                error: parsed?.error || "Benchmark sample generation failed",
                stderr,
                stdout,
              },
              { status: 500 }
            )
          );
          return;
        }
        resolve(NextResponse.json(parsed));
      } catch (e) {
        resolve(
          NextResponse.json(
            { error: "Failed to parse Python output", stdout, stderr, details: String(e) },
            { status: 500 }
          )
        );
      }
    });

    py.on("error", (err) => {
      resolve(NextResponse.json({ error: `Python spawn failed: ${String(err)}` }, { status: 500 }));
    });
  });
}
