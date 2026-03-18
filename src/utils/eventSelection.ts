/**
 * Temporary storage for selected event when navigating from SelectEventScreen
 * This is a simple workaround for passing data between screens
 */

let selectedEvent: { id: number; name: string } | null = null;

export const setSelectedEvent = (event: { id: number; name: string } | null) => {
  selectedEvent = event;
};

export const getSelectedEvent = (): { id: number; name: string } | null => {
  const event = selectedEvent;
  // Clear after reading to avoid re-triggering
  selectedEvent = null;
  return event;
};
