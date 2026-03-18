import { format, isToday, isYesterday, differenceInDays, isSameYear } from 'date-fns';

/**
 * Format a publication date according to the following criteria:
 * - "Today" for today's posts
 * - "Yesterday" for yesterday's posts
 * - "X days ago" for posts up to 7 days
 * - "M-D" (ex: "5-12") for posts from the current year
 * - "YYYY-M-D" (ex: "2024-11-7") for posts from previous years
 */
export const formatPostDate = (date: Date | string): string => {
  const postDate = typeof date === 'string' ? new Date(date) : date;

  if (isToday(postDate)) {
    return 'Today';
  }

  if (isYesterday(postDate)) {
    return 'Yesterday';
  }

  const daysDifference = differenceInDays(new Date(), postDate);
  if (daysDifference > 0 && daysDifference <= 7) {
    return `${daysDifference} days ago`;
  }

  if (isSameYear(postDate, new Date())) {
    return format(postDate, 'M-d');
  }

  return format(postDate, 'yyyy-M-d');
};

export const isPostFromToday = (date: Date | string): boolean => {
  const postDate = typeof date === 'string' ? new Date(date) : date;
  return isToday(postDate);
};

export default {
  formatPostDate,
  isPostFromToday
};
