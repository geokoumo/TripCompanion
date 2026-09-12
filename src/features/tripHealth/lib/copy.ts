/**
 * The one place Trip Health's English copy lives. computeTripHealth.ts
 * (and the domain layer it's built on) only ever produces keys + params —
 * never a sentence — so every warning's actual wording is authored here,
 * once, in clear language rather than technical/validation jargon (never
 * "MISSING_REQUIRED_DATA", always "Trip information is incomplete").
 */
const COPY: Record<string, string> = {
  'tripHealth.title.missingTripInfo': 'Trip information is incomplete',
  'tripHealth.description.missingTripInfo': "This trip is missing its {{field}}. Add it to finish setting up the trip.",
  'tripHealth.action.completeTripInfo': 'Complete trip info',

  'tripHealth.title.missingActivityInfo': 'Activity is missing information',
  'tripHealth.description.missingActivityInfo': '"{{activity}}" is missing its {{field}}.',

  'tripHealth.title.activityDateOutOfRange': 'Activity is outside the trip dates',
  'tripHealth.description.activityDateOutOfRange':
    '"{{activity}}" is scheduled for {{date}}, outside this trip\'s {{rangeStart}} – {{rangeEnd}} dates.',
  'tripHealth.description.activityInvalidDateValue': '"{{activity}}" has a date that isn\'t valid. Set it to a real calendar date within the trip.',

  'tripHealth.title.activityInvalidTime': 'Activity has an invalid time',
  'tripHealth.description.activityInvalidTime': '"{{activity}}" doesn\'t have a valid time set.',

  'tripHealth.title.activityInvalidDuration': 'Activity has an invalid duration',
  'tripHealth.description.activityInvalidDuration':
    '"{{activity}}" has a duration that doesn\'t make sense. Set it to a positive number of minutes.',

  'tripHealth.title.activityInvalidPrice': 'Activity price needs a currency',
  'tripHealth.description.activityInvalidPrice': '"{{activity}}"\'s price or currency doesn\'t look right. Check the amount and currency code.',

  'tripHealth.title.activityInvalidLocation': 'Activity location is blank',
  'tripHealth.description.activityInvalidLocation': '"{{activity}}" has a location field that\'s set but empty. Fill it in or clear it.',

  'tripHealth.action.reviewItinerary': 'Review itinerary',

  'tripHealth.title.activityConflict': 'Overlapping activities',
  'tripHealth.description.activityConflict': '"{{activity}}" overlaps with "{{conflicting}}" on {{date}}.',

  'tripHealth.title.stayOverlap': 'Overlapping stays',
  'tripHealth.description.stayOverlap': '{{stay}} checkout overlaps with {{conflicting}} check-in on {{date}}.',
  'tripHealth.action.updateStayDates': 'Update stay dates',

  'tripHealth.title.missingBoardingPass': 'Missing boarding pass',
  'tripHealth.description.missingBoardingPass':
    '{{flight}} departs {{date}}, but no boarding pass is attached to the saved trip. Upload the PDF to complete the document set.',
  'tripHealth.action.uploadBoardingPass': 'Upload boarding pass',

  'tripHealth.title.missingStayDocument': 'Missing hotel confirmation',
  'tripHealth.description.missingStayDocument': 'No confirmation document is attached for {{stay}}. Upload it so it\'s ready when you need it.',
  'tripHealth.action.addDocument': 'Add document',

  'tripHealth.title.missingExchangeRate': 'Missing exchange rate',
  'tripHealth.description.missingExchangeRate':
    '{{count}} {{currency}} {{expenseWord}} missing a saved exchange rate. Add a fixed rate so budget totals are calculated from saved trip data only.',
  'tripHealth.action.addExchangeRate': 'Add exchange rate',

  'tripHealth.passed.allClear': 'All checks passed.',
  'tripHealth.passed.tripInfo': 'Trip information is complete.',
  'tripHealth.passed.activityIntegrity': 'Every activity has valid, complete data.',
  'tripHealth.passed.activityConflicts': 'No timed activity conflicts.',
  'tripHealth.passed.stayOverlaps': 'No overlapping stays.',
  'tripHealth.passed.boardingPasses': 'Boarding passes are attached for flights departing soon.',
  'tripHealth.passed.stayDocuments': 'Confirmation documents are attached for your stays.',
  'tripHealth.passed.exchangeRates': 'All foreign-currency expenses have a saved exchange rate.',
};

/** Fills a copy key's `{{placeholders}}` from `params`. Never throws on an unknown key — falls back to the key itself so a typo surfaces visibly instead of crashing the screen. */
export function resolveCopy(key: string, params: Record<string, string> = {}): string {
  const template = COPY[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => params[name] ?? match);
}
