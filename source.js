const {DateTime, FixedOffsetZone} = require('luxon');

module.exports = parseDataTimeSource;

/**
 *
 * @param {object} dates
 * @param {string} targetKey
 * @return {string}
 */
function parseDataTimeSource({src: dates, options: targetKey}) {
  const targetDateTimeString = dates[targetKey];
  if (!targetDateTimeString) {
    throw new Error(`Src key ${targetKey} not found`);
  }
  const dateTime = parseDataTimeString(targetDateTimeString);
  if (!dateTime) {
    throw new Error(`Cannot parse "${targetDateTimeString}"`);
  }
  return dateTime.toISO();
}

/**
 *
 * @param {string} dateTimeStr
 * @return {DateTime|undefined}
 */
function parseDataTimeString(dateTimeStr) {
  const date = extractDateFromString(dateTimeStr);
  if (!date) {
    return;
  }
  const time = extractTimeFromString(dateTimeStr);
  const zone = extractTimeZoneFromString(dateTimeStr);
  const dateTime = DateTime.fromObject({...date, ...time}, {zone});
  if (dateTime.isValid) {
    return dateTime;
  }
}

/**
 *
 * @param {string} str
 * @return  {{year:number;month:number;day:number}|undefined}
 */
function extractDateFromString(str) {
  const separatorRegExp = /[.\-\/\s]/;
  const dayRegexp = /[^\d.\-\/\s]?(?<day>\d{1,2})[^\d.\-\/\s]?/;
  const monthRegexp = /(?<month>(\d{2})|(\p{Alpha}{3,}))\.?/u;
  const yearRegexp = /(?<year>\d{4})/;
  const regexps = [
    createDateCompositeRegexp(dayRegexp, separatorRegExp, monthRegexp, separatorRegExp, yearRegexp),
    createDateCompositeRegexp(yearRegexp, separatorRegExp, monthRegexp, separatorRegExp, dayRegexp),
  ];

  const regexp = regexps.find(regexp => regexp.test(str));
  if (!regexp) {
    return;
  }
  const groups = str.match(regexp)?.groups;
  if (!groups) {
    return;
  }
  const {day, month, year} = groups;
  return {
    year: Number(year),
    month: parseMonth(month),
    day: Number(day),
  };
}

/**
 *
 * @param {RegExp[]} srcRegexps
 * @return {RegExp}
 */
function createDateCompositeRegexp(...srcRegexps) {
  return new RegExp(
    srcRegexps.map(regexp => regexp.source).join(''),
    'ui'
  );
}

/**
 * @param {string} month
 * @return {number}
 */
function parseMonth(month) {
  return /^\d+$/.test(month) ? Number(month) : parseMonthByName(month);
}

/**
 *
 * @param {string} name
 * @return {number}
 */
function parseMonthByName(name) {
  const names = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октябрь',
    'ноября',
    'декабря',
  ];
  const shortNames = names.map(name => name.slice(0, 3));
  const index = findIndex(name, names) ?? findIndex(name, shortNames);
  if (index !== undefined) {
    return index + 1;
  }
  throw new Error(`Unknown month "${name}"`);
}

/**
 *
 * @param {string} item
 * @param {string[]} list
 * @return {number|undefined}
 */
function findIndex(item, list) {
  const index = list.indexOf(item);
  if (index !== -1) {
    return index;
  }
}

/**
 *
 * @param {string} str
 * @return  {{hours:number;minutes:number;seconds:number;milliseconds:number}}
 */
function extractTimeFromString(str) {
  const result = str.match(/[T\s](?<hours>\d{2}):(?<minutes>\d{2})(:(?<seconds>\d{2})(\.(?<millis>\d{3}))?)?/);
  if (!result) {
    return {hours: 0, minutes: 0, milliseconds: 0, seconds: 0};
  }
  const groups = result.groups;
  return {
    hours: Number(groups.hours),
    minutes: Number(groups.minutes),
    seconds: groups.seconds ? Number(groups.seconds) : 0,
    milliseconds: groups.millis ? Number(groups.millis) : 0,
  };
}

/**
 *
 * @param {string} str
 * @return {FixedOffsetZone}
 */
function extractTimeZoneFromString(str) {
  const match = str.match(/([+-]\d{2}:\d{2})/);
  return match ? FixedOffsetZone.parseSpecifier(`UTC${match[1]}`) : FixedOffsetZone.utcInstance;
}