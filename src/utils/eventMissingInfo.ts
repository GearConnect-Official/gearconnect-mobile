import { Event } from '@/services/eventService';

export interface MissingInfo {
  trackCondition: boolean;
  eventResultsLink: boolean;
  seasonResultsLink: boolean;
  hasMissingInfo: boolean;
  missingCount: number;
}

/**
 * Check which information is missing for a past event
 */
export const checkMissingEventInfo = (event: Event): MissingInfo => {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isPast = eventDate < now;

  if (!isPast) {
    return {
      trackCondition: false,
      eventResultsLink: false,
      seasonResultsLink: false,
      hasMissingInfo: false,
      missingCount: 0,
    };
  }

  const meteo = event.meteo || {};
  const missingTrackCondition = !meteo.trackCondition;
  const missingEventResultsLink = !meteo.eventResultsLink || meteo.eventResultsLink.trim() === '';
  const missingSeasonResultsLink = !meteo.seasonResultsLink || meteo.seasonResultsLink.trim() === '';

  const missingCount =
    (missingTrackCondition ? 1 : 0) +
    (missingEventResultsLink ? 1 : 0) +
    (missingSeasonResultsLink ? 1 : 0);

  return {
    trackCondition: missingTrackCondition,
    eventResultsLink: missingEventResultsLink,
    seasonResultsLink: missingSeasonResultsLink,
    hasMissingInfo: missingCount > 0,
    missingCount,
  };
};

/**
 * Count the number of events with missing information
 */
export const countEventsWithMissingInfo = (events: Event[]): number => {
  return events.filter(event => {
    const missingInfo = checkMissingEventInfo(event);
    return missingInfo.hasMissingInfo;
  }).length;
};
