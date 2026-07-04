import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { post_id } = await req.json();
    if (!post_id) {
      return NextResponse.json(
        { success: false, error: "Missing post_id in request body" },
        { status: 400 }
      );
    }

    const scriptPath = path.join(process.cwd(), "scripts", "restore_post_media.py");
    const pythonEnvPath = path.join(process.cwd(), "..", ".venv", "bin", "python");

    return new Promise<NextResponse>((resolve) => {
      execFile(pythonEnvPath, [scriptPath, post_id], (error, stdout, stderr) => {
        if (error) {
          console.error("execFile error:", error, stderr);
          return resolve(
            NextResponse.json(
              { success: false, error: `Script execution failed: ${error.message || stderr}` },
              { status: 500 }
            )
          );
        }

        try {
          const result = JSON.parse(stdout.trim());
          if (!result.success) {
            return resolve(
              NextResponse.json(
                { success: false, error: result.error || "Failed to restore media." },
                { status: 500 }
              )
            );
          }
          return resolve(NextResponse.json(result));
        } catch (parseError) {
          console.error("JSON parse error:", parseError, stdout);
          // Sometimes python-dotenv prints warnings at start. Look for final line containing JSON.
          const lines = stdout.trim().split("\n");
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const resJson = JSON.parse(lines[i]);
              if (resJson && typeof resJson.success === "boolean") {
                return resolve(NextResponse.json(resJson));
              }
            } catch (err) {}
          }
          
          return resolve(
            NextResponse.json(
              { success: false, error: `Invalid script output format: ${stdout}` },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    console.error("Restore media route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
