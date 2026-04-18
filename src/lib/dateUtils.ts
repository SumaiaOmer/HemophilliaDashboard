export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() + offset * 60 * 1000);
  const day = String(adjusted.getDate()).padStart(2, '0');
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const year = adjusted.getFullYear();
  return `${day}/${month}/${year}`;
};

export const toDateInputValue = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() + offset * 60 * 1000);
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toISOStringFromDateInput = (dateInputValue: string): string => {
  if (!dateInputValue) return '';
  const [year, month, day] = dateInputValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  return date.toISOString();
};
