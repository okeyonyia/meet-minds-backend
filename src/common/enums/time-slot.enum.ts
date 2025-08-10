export enum TimeSlot {
  MORNING = 'morning',     // 5:00 AM - 11:59 AM
  AFTERNOON = 'afternoon', // 12:00 PM - 5:59 PM
  NIGHT = 'night',         // 6:00 PM - 4:59 AM
}

export const TIME_SLOT_RANGES = {
  [TimeSlot.MORNING]: { start: 5, end: 11.59 },
  [TimeSlot.AFTERNOON]: { start: 12, end: 17.59 },
  [TimeSlot.NIGHT]: { start: 18, end: 4.59 }, // Note: Night wraps around midnight
};

/**
 * Determines the time slot based on a time string (HH:MM format)
 */
export function getTimeSlot(timeString: string): TimeSlot {
  const [hours, minutes] = timeString.split(':').map(Number);
  const timeDecimal = hours + minutes / 60;

  if (timeDecimal >= 5 && timeDecimal < 12) {
    return TimeSlot.MORNING;
  } else if (timeDecimal >= 12 && timeDecimal < 18) {
    return TimeSlot.AFTERNOON;
  } else {
    return TimeSlot.NIGHT;
  }
}

/**
 * Creates a MongoDB query for filtering by time slot
 */
export function createTimeSlotQuery(timeSlot: TimeSlot, timeField: string = 'start_time'): any {
  const range = TIME_SLOT_RANGES[timeSlot];
  
  if (timeSlot === TimeSlot.NIGHT) {
    // Night slot spans across midnight, so we need OR condition
    return {
      $or: [
        // 6:00 PM - 11:59 PM (18:00 - 23:59)
        { 
          $expr: {
            $and: [
              { $gte: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, 18] },
              { $lte: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, 23] }
            ]
          }
        },
        // 12:00 AM - 4:59 AM (00:00 - 04:59)
        {
          $expr: {
            $and: [
              { $gte: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, 0] },
              { $lt: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, 5] }
            ]
          }
        }
      ]
    };
  } else {
    // Morning and afternoon slots
    const startHour = Math.floor(range.start);
    const endHour = Math.floor(range.end);
    
    return {
      $expr: {
        $and: [
          { $gte: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, startHour] },
          { $lt: [{ $toDouble: { $substr: [`$${timeField}`, 0, 2] } }, endHour + 1] }
        ]
      }
    };
  }
}
