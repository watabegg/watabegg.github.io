export function differenceInMonths(start: Date, end: Date): number {
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const startDay = start.getDate();

  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  const endDay = end.getDate();

  let months = (endYear - startYear) * 12 + (endMonth - startMonth);

  if (months < 0) {
    return 1;
  }

  // Include the current month if end day is on or after start day.
  if (endDay >= startDay) {
    months += 1;
  }

  return months === 0 ? 1 : months;
}

export function calculateAge(birthDate: Date, referenceDate = new Date()): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export function formatYearMonth(date: Date): string {
  const formatter = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
  });

  return formatter.format(date).replace('年', '/').replace('月', '');
}
