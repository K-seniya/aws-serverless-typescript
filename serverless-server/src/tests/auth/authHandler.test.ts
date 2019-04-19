import {auth} from "../../auth/authHandler";
import * as jwtModule from "jsonwebtoken";
import { ImportMock } from 'ts-mock-imports';

test ('should authenticate', () => {
  const event: any = {
    authorizationToken: 'krk 6789999'
  };

  const callbackFn = jest.fn();

  // ImportMock.mockClass(jwtModule, 'jwt');

  const fn = () => {
    return {}
  };
  ImportMock.mockFunction(jwtModule, 'verify', fn);


  // jwt.verify.mockReturnValue(null);

  // const tokenVerifier = jest.fn();
  // jest.mock('jsonwebtoken', () => {
  //   return jest.fn().mockImplementation(() => {
  //     return {verify: tokenVerifier};
  //   });
  // });


  // const result =
    auth(event, null, callbackFn);


});
