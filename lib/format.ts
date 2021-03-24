import { format, parseJSON } from 'date-fns';

/**
 * Format date (JSON string type) to date (Date type)
 * @param date - date of JSON string type
 * @return Date
 */
export const parseJsonStrToDate = (date: string) => {
  return parseJSON(date);
};

/**
 * Format date (JSON string type) to yyyy-MM-dd
 * @param date - date of JSON string type
 * @return yyyy-MM-dd
 */
export const formatDashDate = (date: string) => {
  if (date === '') return format(new Date(), 'yyyy-MM-dd');
  return format(parseJsonStrToDate(date), 'yyyy-MM-dd');
};

/**
 * Convert letter beginning with lowercase to beginning with uppercase
 * @param letter - letter is converted to beginning with lowercase
 * @return capitalizeLetter
 */
export const capitalizeLetter = (letter: string) => {
  if (letter === '') return '';
  return letter.replace(/^./, letter[0].toUpperCase());
};
