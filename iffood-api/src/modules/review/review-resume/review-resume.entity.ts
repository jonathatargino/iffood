import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Store } from '../../store/store.entity';

@Entity({ name: 'review_resumes' })
export class ReviewResume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  summary: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  static create(props: { summary: string; store: Store }): ReviewResume {
    const resume = new ReviewResume();
    resume.summary = props.summary;
    resume.store = props.store;
    return resume;
  }
}
