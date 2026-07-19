// Chainable Supabase mock — each builder method returns `this` so chains work.
// Tests override `_result` before calling the terminal method.

const builder = {
  _result: { data: null, error: null },
  from() { return this; },
  select() { return this; },
  insert() { return this; },
  update() { return this; },
  delete() { return this; },
  eq() { return this; },
  is() { return this; },
  or() { return this; },
  order() { return this; },
  limit() { return this; },
  maybeSingle() { return Promise.resolve(this._result); },
  single() { return Promise.resolve(this._result); },
  then(resolve) { return Promise.resolve(this._result).then(resolve); },
};

// Allow tests to set what the next call returns
const supabase = {
  _builder: builder,
  setResult(result) { builder._result = result; },
  from(table) { return { ...builder, _table: table }; },
};

module.exports = { supabase };
