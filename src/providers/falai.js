import axios from 'axios';
import config from '../config/index.js';

const BASE = 'https://queue.fal.run';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_MS = 300_000;

class FalAiProvider {
  constructor() {
    this.headers = {
      Authorization: `Key ${config.video.falAi.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  get model() {
    return config.video.falAi.model;
  }

  get name() {
    return 'falai';
  }

  async generate(prompt, onProgress) {
    const { data: submitted } = await axios.post(
      `${BASE}/${this.model}`,
      { prompt },
      { headers: this.headers }
    );

    const { status_url: statusUrl, response_url: responseUrl } = submitted;
    const deadline = Date.now() + MAX_POLL_MS;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const { data: status } = await axios.get(statusUrl, { headers: this.headers });

      if (status.status === 'COMPLETED') {
        const { data: result } = await axios.get(responseUrl, { headers: this.headers });
        const url = result?.video?.url ?? result?.video_url;
        if (!url) throw new Error('No video URL in Fal.ai response');
        return { url };
      }

      if (status.status === 'FAILED') {
        throw new Error(status.error ?? 'Fal.ai video generation failed');
      }

      const elapsed =
        status.queue_position != null
          ? `Queue position: ${status.queue_position}`
          : 'Processing…';
      await onProgress(elapsed);
    }

    throw new Error('Video generation timed out after 5 minutes');
  }
}

export default new FalAiProvider();
