import { Test, TestingModule } from '@nestjs/testing';
import { EventParticipationService } from './event-participation.service';

describe('EventParticipationService', () => {
  let service: EventParticipationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventParticipationService],
    }).compile();

    service = module.get<EventParticipationService>(EventParticipationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
