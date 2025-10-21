// Client-side SSE handler for streaming analysis
export class AnalysisStream {
  private eventSource: EventSource | null = null;
  private onStatus?: (data: { message: string; progress: number }) => void;
  private onComplete?: (data: any) => void;
  private onError?: (error: string) => void;

  constructor(
    onStatus?: (data: { message: string; progress: number }) => void,
    onComplete?: (data: any) => void,
    onError?: (error: string) => void
  ) {
    this.onStatus = onStatus;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async startAnalysis(file: File, context?: any) {
    const formData = new FormData();
    formData.append('file', file);
    if (context) {
      formData.append('context', JSON.stringify(context));
    }

    try {
      const response = await fetch('/api/v1/analyze/stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  this.onStatus?.(data);
                  break;
                case 'complete':
                  this.onComplete?.(data.data);
                  break;
                case 'error':
                  this.onError?.(data.message);
                  break;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      this.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  close() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
