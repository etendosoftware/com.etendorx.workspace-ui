import { Metadata } from '../api/metadata';

describe('Metadata module', () => {
  it('initializes correctly', async () => {
    expect(await Metadata.initialize()).toBeTruthy();
  });
});
