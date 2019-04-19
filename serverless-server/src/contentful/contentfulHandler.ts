import {ContentfulService} from './ContentfulService';

export async function getContentfulProducts(event, _, callback) {
  console.log("event", event);
  const contentful = new ContentfulService();

  const result = await contentful.getProducts();
  return callback(null, {
    body: JSON.stringify(result),
    headers: {},
    statusCode: 200
  });

}

export async function getContentfulEntries(event, _, callback) {
  const id = event.pathParameters.id;
  const contentful = new ContentfulService();
  try {
    const result = await contentful.getEntry(id);
    const response: Response = {
      body: JSON.stringify(result),
      headers: {},
      statusCode: 200
    };
    return callback(null, response);
  } catch (err) {
    console.log('Error: ' + JSON.stringify(err));
    const response: Response = {
      body: JSON.stringify(err),
      error: err,
      headers: {},
      statusCode: 400
    };
    return callback(null, response);

  }
}

interface Response {
  statusCode: number,
  headers: any,
  body: string,
  error?: string
}

