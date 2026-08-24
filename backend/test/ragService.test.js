const test = require('node:test');
const assert = require('node:assert/strict');

const { answerNamedQuestion, answerQuestion, answerEntityFieldQuestion, answerStructuredQuestion, retrieveDocuments } = require('../src/services/ragService');

test('returns a friendly guidance message for a greeting', () => {
  const answer = answerQuestion('Hi');

  assert.match(answer.toLowerCase(), /hi|ask me about|people|teams|leadership|events/);
});

test('answers the D&A grand total from backend pricing data', () => {
  const answer = answerQuestion("what's the grand total for D&A?");

  assert.match(answer, /grand total.*47/i);
  assert.match(answer, /expiry: 24/i);
  assert.match(answer, /attrition: 5/i);
  assert.match(answer, /extension: 18/i);
});

test('lists every backend user for a requested location', () => {
  const answer = answerQuestion('can you list all the users who are in Noida location');

  assert.match(answer, /^12 users are in noida:/i);
  assert.match(answer, /Ashish Gupta/);
  assert.match(answer, /Ritika Bhat/);
});

test('finds a person when the requested name contains typos', () => {
  const answer = answerQuestion('tell me about harshit apandey');

  assert.match(answer, /Harshita Pandey/);
});

test('finds a person by a partial name before semantic retrieval', () => {
  const answer = answerNamedQuestion('tell me about shubham');

  assert.match(answer, /Shubham Khanna/);
});

test('counts users by location without requiring the word location', () => {
  const answer = answerStructuredQuestion('how many users are in Noida');

  assert.equal(answer, '12 users are in noida.');
});

test('answers a person attribute question from the user record', () => {
  const answer = answerEntityFieldQuestion("what's the career level of harshita?");

  assert.match(answer, /Harshita Pandey's career level is 9/i);
});

test('retrieves the correct entity for a field question without a phrase-specific handler', () => {
  const matches = retrieveDocuments("what's the career level of harshita?");

  assert.equal(matches[0].doc.raw.name, 'Harshita Pandey');
});

test('filters users by status instead of treating status words as locations', () => {
  const answer = answerQuestion('which users are inactive');

  assert.equal(answer, 'No users have status Inactive.');
});

test('answers dashboard headcount and full month aliases deterministically', () => {
  assert.equal(answerQuestion('what is the total headcount'), 'The current headcount is 543.');
  assert.equal(answerQuestion('what is the utilization in June'), 'Utilization in Jun is 87%.');
});

test('lists every program belonging to a franchise', () => {
  const answer = answerQuestion('which programs belong to D&A');

  assert.match(answer, /^7 programs belong to/);
  assert.match(answer, /Single Pane of Glass/);
  assert.match(answer, /Leapfrog/);
});

test('does not report historical events as upcoming', () => {
  assert.equal(answerQuestion('when is the next event'), 'No upcoming events were found.');
});

test('lists leadership team records instead of returning top retrieval matches', () => {
  const answer = answerQuestion('show me all leadership team members');

  assert.match(answer, /^4 leadership members in Leadership Team:/);
  assert.match(answer, /Ujjwal Jyoti/);
  assert.match(answer, /Sharon Lewis/);
});

test('answers pricing fields using human-readable field names', () => {
  assert.equal(answerQuestion('what is the expiry future ending for D&A'), 'D&A+ future ending is 12 in the expiry table.');
});

test('lists the business domains from the app overview', () => {
  const answer = answerQuestion('what all domains are there');

  assert.match(answer, /Retail Banking/i);
  assert.match(answer, /Wealth/i);
  assert.match(answer, /Commercial and Institutional Banking/i);
});

test('explains how Accenture helps in retail banking', () => {
  const answer = answerQuestion('how accenture helps in retail banking');

  assert.match(answer, /Retail Banking/i);
  assert.match(answer, /CASA|mortgages|credit cards|loans/i);
});

test('answers event status, project membership, recognition, and capability queries', () => {
  assert.match(answerQuestion('which events are completed'), /^2 completed events:/);
  assert.match(answerQuestion('which users work on Single Pane of Glass'), /^1 users work on Single Pane of Glass:/);
  assert.match(answerQuestion('what is the recognition for Rajesh Jindal'), /Client Recognized/);
  assert.match(answerQuestion('which franchises are under D&A'), /6 franchises/);
});
