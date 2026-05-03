export interface JobStatus {
  job_id:          string;
  status:          string;
  progress:        number;
  current_step:    string;
  file_name:       string;
  target_language: string;
  voice_mode:      string;
  output_url:      string | null;
  error:           string | null;
}

export async function startDubbingJob(
  file:           File,
  targetLanguage: string,
  voiceMode:      string,
): Promise<string> {
  const form = new FormData();
  form.append("file",            file);
  form.append("target_language", targetLanguage);
  form.append("voice_mode",      voiceMode);

  const res = await fetch("/api/dub", {
    method: "POST",
    body:   form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }

  const data = await res.json();
  return data.job_id;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`/api/jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}

export async function pollJobUntilDone(
  jobId:     string,
  onUpdate:  (status: JobStatus) => void,
  intervalMs = 2000,
): Promise<JobStatus> {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        onUpdate(status);
        if (status.status === "complete" || status.status === "failed") {
          clearInterval(timer);
          status.status === "complete"
            ? resolve(status)
            : reject(new Error(status.error ?? "Job failed"));
        }
      } catch (e) {
        clearInterval(timer);
        reject(e);
      }
    }, intervalMs);
  });
}

export function getDownloadUrl(jobId: string): string {
  return `http://localhost:8000/api/download/${jobId}`;
}
