import {DynamoDB} from "aws-sdk";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const IS_OFFLINE = process.env.IS_OFFLINE;

function createDataBase() {
  return IS_OFFLINE === 'true' ?
    new DynamoDB.DocumentClient({
      endpoint: 'http://localhost:8000',
      region: 'localhost'
    }) : new DynamoDB.DocumentClient();
}

const dynamoDb = createDataBase();
console.log("is offline: " + IS_OFFLINE + " database is " + JSON.stringify(dynamoDb));

export function createProduct(event, _, callback) {
  console.log("inside creation: " + JSON.stringify(event));
  const item: Item = {
    name: event.body.name,
    productId: event.body.productId
  };
  const params = {
    Item: item,
    TableName: PRODUCTS_TABLE
  };
  console.log(" start saving to db " + JSON.stringify(params));
  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      onError(callback, 'Could not create product', event.pathParameters.proxy);
    }
    console.log(" prepare callback");
    onSuccess(callback, item);
  });
};

export function getProduct(event, _, callback) {
  const id = event.pathParameters.proxy;
  const params = {
    Key: {
      productId: id,
    },
    TableName: PRODUCTS_TABLE
    //
  };
  console.log("Get product from db started");
  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      return onError(callback, "Could not get record", id);
    }
    if (result.Item) {
      const response: Item = {
        name: result.Item.name,
        productId: result.Item.productId
      };
      onSuccess(callback, response);
    } else {
      const response: Item = {productId: id, name: "NOT FOUND"};
      onSuccess(callback, response);
    }
  });
}

function onSuccess(callback: any, item: Item) {
  console.log("successfully got " + item.productId);
  const response: Response = {
    body: JSON.stringify({
      name: item.name,
      productId: item.productId
    }),
    headers: {
      // 'Access-Control-Allow-Origin': "*",
      // 'Access-Control-Allow-Methods': '*',
      // 'Access-Control-Allow-Credentials': true,
    },
    statusCode: 200
  };
  return callback(null, response);
}

function onError(callback: any, message: any, productId: string) {
  console.log("error: v.1:  " + productId);
  const response: Response = {
    body: JSON.stringify({error: message}),
    headers: {
      // 'Access-Control-Allow-Origin': "*",
      // 'Access-Control-Allow-Methods': '*',
      // 'Access-Control-Allow-Credentials': true,
    },
    statusCode: 400
  };
  return callback(null, response);
}

interface Response {
  statusCode: number,
  headers: any,
  body: string
}

interface Item {
  productId: string,
  name: string
}
