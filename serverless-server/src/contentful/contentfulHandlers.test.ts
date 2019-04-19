import {getContentfulEntries, getContentfulProducts} from "./contentfulHandler";
import * as ContentfulServiceModule from './ContentfulService';

const customError = new Error('Custom error')

class MockContentfullService {
  public getProducts() {
    return "myProducts";
  }

  public getEntry() {
    return "myEntries";
  }
}

class MockContentfullErrorService {
  public getEntry() {
    throw customError;
  }
}

test('get products from contentful', (done) => {
  // GIVEN
  (ContentfulServiceModule as any).ContentfulService = MockContentfullService;
  const mockCallback = jest.fn(() => 'result');

  // WHEN
  getContentfulProducts(null, null, mockCallback)

  // THEN
    .then(() => {
      // @ts-ignore
      expect(mockCallback.mock.calls[0][0]).toBeNull();
      // @ts-ignore
      expect(mockCallback.mock.calls[0][1].body).toEqual('"myProducts"');
      done();
    })
});

test('return error when could not get items from contentful', async () => {
  // GIVEN
  (ContentfulServiceModule as any).ContentfulService = MockContentfullErrorService;
  const mockCallback = jest.fn(() => 'result');
  const event: any = {pathParameters: {id: "123"}};

  // WHEN
  await getContentfulEntries(event, null, mockCallback);

  // THEN
  // @ts-ignore
  expect(mockCallback.mock.calls[0][1].error).toBe(customError);
});


