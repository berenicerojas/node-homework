const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key == "password");
    expect(found).toBeTruthy();
  });

  it("2. The user schema requires that an email be specified.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "Pa$$word20" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "email");
    expect(found).toBeTruthy();
  });

  it("3. The user schema does not accept an invalid email.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob-at-sample.com", password: "Pa$$word20" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "email");
    expect(found).toBeTruthy();
  });

  it("4. The user schema requires a password.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "password");
    expect(found).toBeTruthy();
  });

  it("5. The user schema requires name.", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "name");
    expect(found).toBeTruthy();
  });

  it("6. The name must be valid (3 to 30 characters).", () => {
    const { error } = userSchema.validate(
      { name: "Bo", email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "name");
    expect(found).toBeTruthy();
  });

  it("7. If validation is performed on a valid user object, error comes back falsy.", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false }
    );
    expect(error).toBeFalsy();
  });
}); 

describe("taskSchema validation tests", () => {
  it("8. The task schema requires a title.", () => {
    const { error } = taskSchema.validate(
      { isCompleted: false },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "title");
    expect(found).toBeTruthy();
  });

  it("9. If an isCompleted value is specified, it must be valid.", () => {
    const { error } = taskSchema.validate(
      { title: "Finish homework", isCompleted: "not-a-boolean" },
      { abortEarly: false }
    );
    const found = error && error.details && error.details.find((detail) => detail.context.key === "isCompleted");
    expect(found).toBeTruthy();
  });

  it("10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.", () => {
    const { value } = taskSchema.validate(
      { title: "Finish homework" },
      { abortEarly: false }
    );
    expect(value.isCompleted).toBe(false);
  });

  it("11. If isCompleted in the provided object has the value true, it remains true after validation.", () => {
    const { value } = taskSchema.validate(
      { title: "Finish homework", isCompleted: true },
      { abortEarly: false }
    );
    expect(value.isCompleted).toBe(true);
  });
});

describe("patchTaskSchema validation tests", () => {
  it("12. The patchTaskSchema does not require a title.", () => {
    const { error } = patchTaskSchema.validate(
      { isCompleted: true },
      { abortEarly: false }
    );
    expect(error).toBeFalsy();
  });

  it("13. If no value is provided for isCompleted this remains undefined in the returned value.", () => {
    const { value } = patchTaskSchema.validate(
      { title: "Updated Title Only" },
      { abortEarly: false }
    );
    expect(value.isCompleted).toBeUndefined();
  });
});