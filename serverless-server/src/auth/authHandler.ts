import * as jwt from "jsonwebtoken";
import {ApiOptions, AuthPolicy} from "./AuthPolicy";

const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;

export const auth = (event, _, callback) => {
  console.log("inside auth");

  let apiOptions: ApiOptions = {
    region: "us-east-2",
    restApiId: "*",
    stage: "dev"
  };

  const options = {
    audience: AUTH0_CLIENT_ID,
  };

  const authorizationToken: string = event.authorizationToken;
  console.log("event.authorizationToken: " + authorizationToken);
  if (!authorizationToken) {
    return callback('Unauthorized. Empty authorizationToken');

  }
  const tokenParts = authorizationToken.split(' ');
  const tokenValue = tokenParts[1];

  console.log('tokenValue' + tokenValue);


  try {
    jwt.verify(tokenValue, AUTH0_CLIENT_PUBLIC_KEY, options, (verifyError, decoded) => {
      console.log('inside jwt.verify: ' + verifyError);
      if (verifyError) {
        return callback('Unauthorized. JWT verification failed ' +  JSON.stringify(verifyError));
      }
      console.log("start policy generation " + JSON.stringify(decoded));
      const methodArn: string = event.methodArn;
      const tmp: string[] = methodArn.split(':')
      const policy = new AuthPolicy(decoded.sub, tmp[4], apiOptions);
      policy.allowAllMethods();
      const policyString = policy.build();
      console.log("policy " + JSON.stringify(policyString));
      return callback(null, policyString);
    });
  } catch (err) {
    console.log('jwt verification broken', err);
    return callback('Unauthorized. jwt verification broken');
  }
};

