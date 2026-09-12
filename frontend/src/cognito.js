import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "ap-south-1_HkdXUIqh9",
  ClientId: "5h0ieefpauho0n5miumltgcb0c"
};

export const userPool = new CognitoUserPool(poolData);

export function register(email, password) {
  return new Promise((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      [],
      null,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      }
    );
  });
}

export function confirmRegistration(email, code) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

export function login(email, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    user.authenticateUser(authDetails, {
      onSuccess: result => {
        resolve(result);
      },

      onFailure: err => {
        reject(err);
      }
    });
  });
}