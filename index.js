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

const leankit_client = function (base_url, base64Auth) {
  const self = this;
  selfbase_url = base_url;
  self.base64Auth = base64Auth;

  async function createCard(boardId, laneId, typeId, title, customId, pr_url) {
    try {
      const config = {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": "bearer " + self.base64Auth
        }
      }
      const payload = {
        boardId: boardId.toString(),
        laneId: laneId.toString(),
        typeId: typeId.toString(),
        title: title.toString(),
        customId: customId.toString(),
        externalLink: {
          label: "GitHub PR",
          url: pr_url
        }
      }
      const result = await axios.post(base_url + "/card", payload, config);
      if (result.data.id) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          result: result
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error
      }
    }
  }
  return {
    createCard: createCard
  };
}

async function run() {
  console.log("Running action");
  console.log(payload);
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    const users = core.getInput("users").split(",").map(element => element.trim());
    if (payload.action !== 'opened') {
      console.log(`pr was ${payload.action} so not running`);
      return;
    }
    if (payload.pull_request && users.includes(payload.pull_request.user.login)) {
      const fbc = new fogbuz_client(core.getInput("fogbugz_api_url"), core.getInput("fogbugz_token"));
      const project = core.getInput("fogbugz_project");
      const subproject = core.getInput("fogbugz_subproject");
      const title = !!subproject ? subpoject + " - " + payload.pull_request.title : payload.pull_request.title;
      const text = payload.pull_request.body;
      const category = core.getInput("fogbugz_category");

      console.log(`Creating FB case for ${title}`);
      const fbt_result = await fbc.createCase(title, project, text, category);
      console.log(`fbt_result: ${JSON.stringify(fbt_result)}`);
      if (fbt_result.success) {
        core.setOutput("fogbugz_id", fbt_result.case.ixBug);
        const lkc = new leankit_client(core.getInput("leankit_api_url"), core.getInput("leankit_auth"));
        const boardId = core.getInput("board_id");
        const laneId = core.getInput("lane_id");
        const typeId = core.getInput("leankit_type_id");
        console.log(`Creating LK card for ${fbt_result.case.ixBug}`);
        const lkc_result = await lkc.createCard(boardId, laneId, typeId, title, fbt_result.case.ixBug, payload.pull_request.html_url);
        console.log(`lkc_result: ${JSON.stringify(lkc_result)}`);
        if (lkc_result.success) {
          console.log(`Leankit card created`);
        } else {
          core.setFailed(lkc_result);
        }
      } else {
        core.setFailed(fbt_result);
      }
    }
  } catch (error) {
    core.setFailed(error);
  }
}

run();
