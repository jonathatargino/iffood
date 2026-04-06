import { Injectable, Logger } from '@nestjs/common';
import { Store } from '../../store/store.entity';
import { Review } from '../review.entity';
import { ReviewResume } from './review-resume.entity';
import { ReviewResumeRepository } from './review-resume.repository';
import { LlmService } from '../../../infra/llm/llm.service';

const MIN_REVIEWS_FOR_RESUME = 5;
const RESUME_FRESHNESS_DAYS = 15;
const NOT_ENOUGH_REVIEWS_MESSAGE =
  'Esta loja ainda não possui avaliações o suficiente para um resumo inteligente';

@Injectable()
export class ReviewResumeService {
  private readonly logger = new Logger(ReviewResumeService.name);

  constructor(
    private readonly reviewResumeRepository: ReviewResumeRepository,
    private readonly llmService: LlmService,
  ) {}

  async getOrCreateForStore(store: Store): Promise<string> {
    const reviews = store.reviews;

    if (!reviews || reviews.length < MIN_REVIEWS_FOR_RESUME) {
      return NOT_ENOUGH_REVIEWS_MESSAGE;
    }

    const since = new Date();
    since.setDate(since.getDate() - RESUME_FRESHNESS_DAYS);

    const existing = await this.reviewResumeRepository.findLatestByStoreId(
      store.id,
      since,
    );

    if (existing) {
      return existing.summary;
    }

    return this.generateAndSave(store, reviews);
  }

  private async generateAndSave(
    store: Store,
    reviews: Review[],
  ): Promise<string> {
    try {
      const summary = await this.generateSummary(store.name, reviews);

      const resume = ReviewResume.create({
        summary,
        store: { id: store.id } as Store,
      });

      await this.reviewResumeRepository.save(resume);

      return summary;
    } catch (error) {
      this.logger.error('Failed to generate review resume via LLM', error);
      return NOT_ENOUGH_REVIEWS_MESSAGE;
    }
  }

  private async generateSummary(
    storeName: string,
    reviews: Review[],
  ): Promise<string> {
    const reviewsText = reviews
      .map((r) => {
        const tags = r.tags.length > 0 ? ` | Tags: ${r.tags.join(', ')}` : '';
        const desc = r.description ? ` | "${r.description}"` : '';
        return `- Nota: ${r.rating}/5${tags}${desc}`;
      })
      .join('\n');

    const prompt = `Você é um assistente que gera resumos concisos de avaliações de lojas de comida.
Com base nas avaliações abaixo da loja "${storeName}", gere um resumo curto (máximo 3 frases) em português brasileiro, destacando os pontos positivos e negativos mais mencionados. Seja objetivo e amigável.

Avaliações:
${reviewsText}

Responda apenas com o texto do resumo, sem formatação extra.`;

    return this.llmService.generateText(prompt);
  }
}
