import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class LlmService {
  private readonly client: GoogleGenAI;
  private readonly defaultModel = 'gemini-2.0-flash';

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: model ?? this.defaultModel,
      contents: prompt,
    });

    return response.text ?? '';
  }

  async generateJson<T = unknown>(const response    model: model    contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text ?? '{}') as T;
  }
}
