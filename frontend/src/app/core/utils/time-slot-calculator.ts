// time-slot-calculator.ts

import { WorkingHours, OccupiedSlot } from '../models';

export interface AvailableTimeSlot {
  time: string; // "HH:mm" formátum pl. "09:00"
  available: boolean;
  endTime?: string; // Ennek a slotnak a vége (service duration alapján)
}

export class TimeSlotCalculator {
  /**
   * Elérhető időpontok generálása
   *
   * @param workingHours - Munkaórák (startTime, endTime, isAvailable)
   * @param occupiedSlots - Foglalt időpontok
   * @param serviceDuration - Szolgáltatás időtartama percben
   * @param slotInterval - Időpontok közötti intervallum percben (alapértelmezett: 15)
   * @returns Elérhető időpontok listája
   */
  static generateAvailableSlots(
    workingHours: WorkingHours,
    occupiedSlots: OccupiedSlot[],
    serviceDuration: number,
    slotInterval: number = 15
  ): AvailableTimeSlot[] {
    // Ha a staff nem elérhető ezen a napon
    if (!workingHours.isAvailable) {
      return [];
    }

    const slots: AvailableTimeSlot[] = [];

    // Working hours parse
    const dayStart = this.timeToMinutes(workingHours.startTime);
    const dayEnd = this.timeToMinutes(workingHours.endTime);

    // Végigmegyünk az időpontokon slot interval lépésekkel
    for (let currentTime = dayStart; currentTime < dayEnd; currentTime += slotInterval) {
      const slotStartTime = this.minutesToTime(currentTime);
      const slotEndTime = this.minutesToTime(currentTime + serviceDuration);

      // Ellenőrizzük hogy a service duration belefér-e a working hours-ba
      if (currentTime + serviceDuration > dayEnd) {
        break; // Már nem fér be több időpont
      }

      // Ellenőrizzük hogy ez a slot szabad-e
      const isAvailable = this.isSlotAvailable(currentTime, serviceDuration, occupiedSlots);

      slots.push({
        time: slotStartTime,
        available: isAvailable,
        endTime: slotEndTime,
      });
    }

    return slots;
  }

  /**
   * Ellenőrzi hogy egy adott időpont szabad-e
   */
  private static isSlotAvailable(
    slotStartMinutes: number,
    durationMinutes: number,
    occupiedSlots: OccupiedSlot[]
  ): boolean {
    const slotEndMinutes = slotStartMinutes + durationMinutes;

    // Végigmegyünk az összes foglalt időponton
    for (const occupied of occupiedSlots) {
      const occupiedStart = this.timeToMinutes(occupied.startTime);
      const occupiedEnd = this.timeToMinutes(occupied.endTime);

      // Átfedés ellenőrzés
      // Akkor ütközik, ha:
      // 1. Az új slot kezdete a foglalt slot közepébe esik
      // 2. Az új slot vége a foglalt slot közepébe esik
      // 3. Az új slot teljesen magába foglalja a foglalt slotot

      const startsInside = slotStartMinutes >= occupiedStart && slotStartMinutes < occupiedEnd;
      const endsInside = slotEndMinutes > occupiedStart && slotEndMinutes <= occupiedEnd;
      const coversOccupied = slotStartMinutes <= occupiedStart && slotEndMinutes >= occupiedEnd;

      if (startsInside || endsInside || coversOccupied) {
        return false; // Ütközik egy foglalt időponttal
      }
    }

    return true; // Nincs ütközés, szabad a slot
  }

  /**
   * Időpont string konvertálása percekké (00:00-tól számítva)
   * pl. "09:30" -> 570 perc
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Percek konvertálása időpont stringgé
   * pl. 570 -> "09:30"
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Szolgáltatások összes időtartamának kiszámítása
   * (Ha több szolgáltatás van a kosárban)
   * Fogad string és number duration-t is
   */
  static calculateTotalDuration(services: { duration: number | string }[]): number {
    return services.reduce((total, service) => {
      const duration =
        typeof service.duration === 'string'
          ? this.parseDuration(service.duration)
          : service.duration;
      return total + duration;
    }, 0);
  }

  /**
   * Duration string konvertálása number-ré
   * pl. "45 perc" -> 45
   */
  private static parseDuration(durationStr: string): number {
    const match = durationStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Dátum formázás YYYY-MM-DD formátumra (backend számára)
   */
  static formatDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Ellenőrzi hogy egy dátum tiltott-e
   */
  static isDateUnavailable(date: Date, unavailableDates: { date: string }[]): boolean {
    const dateStr = this.formatDateForBackend(date);
    return unavailableDates.some((d) => d.date === dateStr);
  }
}
