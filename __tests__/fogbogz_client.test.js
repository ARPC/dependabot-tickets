const axios = require("axios");
const FogBugzClient = require("../src/fogbugz_client");

const postMock = jest.spyOn(axios, "post").mockImplementation();

describe("createCase", () => {
  const fogbugzClient = new FogBugzClient("https://example.com", "sometoken");
  const validResponse = {
    status: 200,
    data: {
      errors: [],
      warnings: [],
      data: {
        case: {
          ixBug: 123
        }
      }
    }
  };
  const title = "My Title";
  const project = "My Project";
  const text = "My Text";
  const category = "My Category";

  beforeEach(() => {
    jest.clearAllMocks()
  });

  it("posts to the FogBugz API", async () => {
    postMock.mockImplementation((_url, _payload, _config) => { return validResponse; });

    await fogbugzClient.createCase(title, project, text, category);

    expect(postMock)
      .toHaveBeenCalledWith(
        "https://example.com",
        expect.anything(),
        expect.objectContaining({
          headers: {
            "Accept": "application/json",
          }
        })
      );
  });

  it("posts the correct payload", async () => {
    postMock.mockImplementation((_url, _payload, _config) => { return validResponse; });

    await fogbugzClient.createCase(title, project, text, category);

    expect(postMock)
      .toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          token: "sometoken",
          cmd: "new",
          sTitle: title,
          sProject: project,
          sCategory: category,
          sEvent: text,
          fRichText: 1
        }),
        expect.anything()
      );
  });

  it("returns the case number if case is created", async () => {
    postMock.mockImplementation((_url, _payload, _config) => { return validResponse; });

    const result = await fogbugzClient.createCase(title, project, text, category);

    expect(result.success).toEqual(true);
    expect(result.case).toEqual(validResponse.data.data.case);
  });

  it("returns an error if the case is not created", async () => {
    const invalidResponse = {
      status: 200,
      data: {
        errors: ["error"],
        warnings: ["warning"],
        data: {}
      }
    }
    postMock.mockImplementation((_url, _payload, _config) => { return invalidResponse; });

    const result = await fogbugzClient.createCase(title, project, text, category);

    expect(result.success).toEqual(false);
    expect(result.errors).toEqual(["error"]);
    expect(result.warnings).toEqual(["warning"]);
  });

  it("returns an error if the response is not 200", async () => {
    validResponse.status = 500;
    postMock.mockImplementation((_url, _payload, _config) => { return validResponse; });

    const result = await fogbugzClient.createCase(title, project, text, category);

    expect(result.success).toEqual(false);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("returns an error if there is an eunexpected error", async () => {
    postMock.mockImplementation((_url, _payload, _config) => { throw new Error("just no"); });

    const result = await fogbugzClient.createCase(title, project, text, category);

    expect(result.success).toEqual(false);
    expect(result.errors).toEqual(["just no"]);
  });
});
