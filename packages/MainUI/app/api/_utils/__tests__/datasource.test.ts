import { encodeDatasourcePayload } from '../../_utils/datasource';

describe('encodeDatasourcePayload', () => {
  it('encodes SmartClient JSON to form-urlencoded and sets CSRF header', () => {
    const payload = {
      dataSource: 'isc_OBViewDataSource_0',
      operationType: 'add',
      componentId: 'isc_OBViewForm_0',
      csrfToken: '100',
      data: { a: 1, b: 'x' },
      oldValues: { c: 2 },
    };

    const { body, headers } = encodeDatasourcePayload(payload);

    expect(headers['Content-Type']).toBeUndefined();
    expect(headers['X-CSRF-Token']).toBe('100');
    expect(body).toContain('dataSource=isc_OBViewDataSource_0');
    expect(body).toContain('operationType=add');
    expect(body).toContain('componentId=isc_OBViewForm_0');
    expect(body).toContain('csrfToken=100');
    // Encoded JSON
    expect(decodeURIComponent(body)).toContain('"a":1');
    expect(decodeURIComponent(body)).toContain('"c":2');
  });

  it('omits optional fields if not present', () => {
    const payload = {
      data: { foo: 'bar' },
    } as any;
    const { body, headers } = encodeDatasourcePayload(payload);
    expect(headers['Content-Type']).toBeUndefined();
    expect(headers['X-CSRF-Token']).toBeUndefined();
    expect(body).toContain('data=');
    expect(body).not.toContain('oldValues=');
  });
});

