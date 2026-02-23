/**
 * ECA Event Model Tests
 * 
 * Tests for ECA event model functionality
 * 
 * Requirements: 11.5, 11.6, 11.10
 */

import { ECAEvent } from '../ECAEvent.model';

describe('ECAEvent Model', () => {
  describe('getParticipantCount', () => {
    it('should return 0 when no participants', () => {
      const event = ECAEvent.build({
        ecaId: 1,
        name: 'Debate Competition',
        type: 'competition',
        eventDate: new Date(),
      });

      expect(event.getParticipantCount()).toBe(0);
    });

    it('should return correct count of participants', () => {
      const event = ECAEvent.build({
        ecaId: 1,
        name: 'Debate Competition',
        type: 'competition',
        eventDate: new Date(),
        participants: [1, 2, 3, 4, 5],
      });

      expect(event.getParticipantCount()).toBe(5);
    });
  });

  describe('toJSON', () => {
    it('should include all event attributes', () => {
      const eventDate = new Date('2024-03-15');
      const event = ECAEvent.build({
        eventId: 1,
        ecaId: 1,
        name: 'Debate Competition',
        nameNp: 'वाद-विवाद प्रतियोगिता',
        type: 'competition',
        description: 'Inter-school debate',
        eventDate,
        eventDateBS: '2080-12-02',
        venue: 'School Auditorium',
        participants: [1, 2, 3],
        organizer: 'Debate Club',
        status: 'scheduled',
        photos: ['photo1.jpg'],
        videos: ['video1.mp4'],
        remarks: 'Important event',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const json = event.toJSON() as any;

      expect(json.eventId).toBe(1);
      expect(json.ecaId).toBe(1);
      expect(json.name).toBe('Debate Competition');
      expect(json.type).toBe('competition');
      expect(json.participantCount).toBe(3);
      expect(json.status).toBe('scheduled');
    });
  });

  describe('event types', () => {
    it('should support all event types', () => {
      const types: Array<'competition' | 'performance' | 'exhibition' | 'workshop' | 'other'> = [
        'competition',
        'performance',
        'exhibition',
        'workshop',
        'other',
      ];

      types.forEach((type) => {
        const event = ECAEvent.build({
          ecaId: 1,
          name: `${type} Event`,
          type,
          eventDate: new Date(),
        });

        expect(event.type).toBe(type);
      });
    });
  });
});
