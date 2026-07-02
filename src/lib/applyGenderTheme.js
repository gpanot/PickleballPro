/** Female → warm light logbook theme; male → dark sporty theme. */
export function getThemeModeForGender(gender) {
  if (gender === 'male') return 'dark';
  if (gender === 'female') return 'light';
  return 'light';
}
