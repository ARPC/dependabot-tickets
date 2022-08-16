const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

const fogbuz_client = function (base_url, token) {
  const self = this;
  self.base_url = base_url;
  self.token = token;

  async function createCase(title, project, text, category) {
    try {
      const config = {
        headers: {
          "Accept": "application/json",
        }
      }
      const payload = {
        token: self.token,
        cmd: "new",
        sTitle: title,
        sProject: project,
        sCategory: category,
        sEvent: text,
        fRichText: 1
      }
      const result = await axios.post(base_url, payload, config);
      if (result.status === 200 && result.data.errors.length === 0) {
        return {
          success: true,
          case: result.data.data.case
        };
      } else {
        return {
          success: false,
          errors: result.data.errors,
          warnings: result.data.warnings
        }
      }
    } catch (err) {
      return {
        success: false,
        error: err
      }
    }
  }
  return {
    createCase: createCase
  };
}

async function run() {
  console.log("Running action");
  console.log(github.context.payload);
  try {
    if (payload.pull_request && users.includes(payload.pull_request.user.login)) {
      const fbc = new fogbuz_client(core.getInput("api_url"), core.getInput("token"));
      const project = core.getInput("project");
      const title = core.getInput("title");
      const text = core.getInput("text");
      const category = core.getInput("category");

      console.log(`Creating FB case for ${title}`);
      const fbt_result = await fbc.createCase(title, project, text, category);
      console.log(`fbt_result: ${JSON.stringify(fbt_result)}`);
      if (fbt_result.success) {
        core.setOutput("case_number", fbt_result.case.ixBug);
      } else {
        core.setFailed(fbt_result);
      }
    }
  } catch (error) {
    core.setFailed(error);
  }
}

run();
