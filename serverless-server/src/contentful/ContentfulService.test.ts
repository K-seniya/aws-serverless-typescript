import * as ContentfulServiceModule from './ContentfulService';

const getMockedContentTypes = () => {
  return {
    items: [{
      displayField: "first",
      fields: [{name: "fieldFirst"}],
      name: "test",
      sys: {id: "123"}
    }]
  }
};

const getMockedEntries = () => {
  return {
    items: [{
      fields: {
        name: "fieldFirst",
        owner: "LabXXX",
        id: "78KR10",
        image: {
          fields: {
            file: {url: "www.labXXX.com"},
            title: "image"
          }
        },
      },
      sys: {id: "123"}
    }]
  }
};

jest.mock('contentful', () => {
  return {
    createClient: jest.fn(() => ({
      getContentTypes: getMockedContentTypes,
      getEntries: getMockedEntries
    }))
  };
});

const service = new ContentfulServiceModule.ContentfulService();

test('should return products', async () => {
  // GIVEN
  const resultProduct: any = {
    displayField: "first",
    fieldNames: "fieldFirst",
    id: "123",
    name: "test"
  };

  // WHEN
  const products = await service.getProducts();

  // THEN
  expect(products).toEqual([resultProduct]);
});


test('should return entry', async () => {
  // GIVEN
  const resultEntry: any = {
    sysId: "123",
    id: "78KR10",
    title: "image",
    name: "fieldFirst",
    owner: "LabXXX",
    image: "www.labXXX.com"
  };

  // WHEN
  const entry = await service.getEntry("123");

  // THEN
  expect(entry).toEqual([resultEntry]);
});
