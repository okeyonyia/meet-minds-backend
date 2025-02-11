import { Test, TestingModule } from '@nestjs/testing';
import { EventParticipationController } from './event-participation.controller';

describe('EventParticipationController', () => {
  let controller: EventParticipationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventParticipationController],
    }).compile();

    controller = module.get<EventParticipationController>(EventParticipationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
