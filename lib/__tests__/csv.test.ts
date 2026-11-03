import { describe, expect, it } from 'vitest';
import { escapeCsvCell } from '../csv';

describe('escapeCsvCell', () => {
  it.each(['=1+1', '+SUM(A1:A2)', '-1+2', '@SUM(A1)', '  =1+1', '\t=1+1', '\r=1+1'])(
    'neutralizes formula-like values beginning with %s',
    (value) => {
      expect(escapeCsvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`);
    },
  );

  it('quotes values and escapes embedded quotes', () => {
    expect(escapeCsvCell('A "quote", and text')).toBe('"A ""quote"", and text"');
  });

  it('leaves ordinary values unchanged', () => {
    expect(escapeCsvCell('Nerd Gauge')).toBe('"Nerd Gauge"');
  });
});
