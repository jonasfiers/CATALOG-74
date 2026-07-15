const driver = require('./neo4j');

const today = () => new Date().toISOString().slice(0, 10);

async function getRateForDate(from, to, date = today()) {
  if (from === to) return 1;

  const { records } = await driver.executeQuery(
    `MATCH (r:DailyRate {date: $date, from: $from, to: $to}) RETURN r.rate AS rate`,
    { date, from, to }
  );
  if (records.length > 0) return Number(records[0].get('rate'));

  return fetchAndStore(from, to, date);
}

async function fetchAndStore(from, to, date) {
  const res = await fetch(`https://api.frankfurter.app/${date}?from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Rate API error: ${res.status}`);
  const data = await res.json();
  const rate = data.rates[to];
  if (rate == null) throw new Error(`No rate found for ${from}→${to}`);

  await driver.executeQuery(
    `MERGE (r:DailyRate {date: $date, from: $from, to: $to}) SET r.rate = $rate`,
    { date, from, to, rate }
  );

  return rate;
}

module.exports = { getRateForDate };