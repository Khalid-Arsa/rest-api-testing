import mongoose from "mongoose";
import supertest from "supertest";
import createServer from "../utils/server";
import * as UserService from "../service/user.service"
import * as SessionService from "../service/session.service"
import { createUserSessionHandler } from "../controller/session.controller";

const app = createServer()

const userId = new mongoose.Types.ObjectId().toString();

const userPayload = {
  _id: userId,
  email: "jane.doe@example.com",
  name: "Jane Doe",
};

const userInput = {
  email: "anyemail@example.com",
  name: "Jane Doe",
  password: "Password123",
  passwordConfirmation: "Password123",
};

const sessionPayload = {
  _id: new mongoose.Types.ObjectId().toString(),
  user: userId,
  valid: true,
  userAgent: "PostmanRuntime/7.28.4",
  createdAt: new Date("2021-09-30T13:31:07.674Z"),
  updatedAt: new Date("2021-09-30T13:31:07.674Z"),
  __v: 0,
};

describe("User", () => {
  // User registration
  describe("User registration", () => {
    // The username and password get validation
    describe("Given the username and password are valid", () => {
      it("should return the user payload", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          // @ts-ignore
          .mockReturnValueOnce(userPayload);

        const response = await supertest(app)
          .post(`/api/users`)
          .send(userInput)

        const { data, success } = response.body

        expect(success).toBe(true);
        expect(typeof data === 'object').toBe(true)
        expect(createUserServiceMock).toHaveBeenCalledWith(userInput)
      })
    })

    // verify that the password must match
    describe("Given the password do not match", () => {
      it("should return a 400", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          // @ts-ignore
          .mockReturnValueOnce(userPayload);

        const { statusCode } = await supertest(app)
          .post(`/api/users`)
          .send({ ...userInput, passwordConfirmation: "doesnotmatch" });

        expect(statusCode).toBe(400)
        expect(createUserServiceMock).not.toHaveBeenCalled()

      })
    })

    // verify that the handler handles any errors
    describe("Given the user service throws", () => {
      it("should return a 409 error", async () => {
        const createUserServiceMock = jest
          .spyOn(UserService, "createUser")
          .mockRejectedValueOnce("Oh no! :(");

        const { statusCode } = await supertest(app)
          .post(`/api/users`)
          .send(userInput);

        expect(statusCode).toBe(409);
        expect(createUserServiceMock).toHaveBeenCalled();
      })
    })
  })

  // Creating a user session
  describe("Create user session", () => {
    // a user can login with a valid email and password
    describe("Given the username and password are valid", () => {
      it("should return a signed accessToken and refresh token", async () => {
        jest
        .spyOn(UserService, "validatePassword")
        // @ts-ignore
        .mockReturnValue(userPayload)

        jest
        .spyOn(SessionService, "createSession")
        // @ts-ignore
        .mockReturnValue(sessionPayload)

        const req = {
          get() {
            return "a user agent"
          },
          body: {
            email: "test@example.com",
            password: "Password123",
          }
        }

        const send = jest.fn();

        const res = {
          send
        }

        // @ts-ignore
        await createUserSessionHandler(req, res)

        expect(send).toHaveBeenCalledWith({
          accessToken: expect.any(String), 
          refreshToken: expect.any(String),
        })
      })
    })
  })
})