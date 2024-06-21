const core = require("@actions/core");
const github = require("@actions/github");
const FogBugzClient = require("./fogbugz-client");
const PlanviewClient = require("./planview-client");

async function run() {
  core.debug("Running action");
  core.debug(github.context.payload);
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    const users = core
      .getInput("users")
      .split(",")
      .map(element => element.trim());
    if (payload.action !== "opened") {
      core.debug(`pr was ${payload.action} so not running`);
      return;
    }
    if (!payload.pull_request) {
      core.debug(`not a pr so not running`);
      return;
    }
    if (!users.includes(payload.pull_request.user.login)) {
      core.debug(`pr was not opened by Dependabot so not running`);
      return;
    }
    const fbc = new FogBugzClient(core.getInput("fogbugz_api_url"), core.getInput("fogbugz_token"));
    const project = core.getInput("fogbugz_project");
    const subproject = core.getInput("fogbugz_subproject");
    const title = subproject
      ? `${subproject} - ${payload.pull_request.title}`
      : payload.pull_request.title;
    const text = payload.pull_request.body;
    const category = core.getInput("fogbugz_category");
    core.debug(`Creating FB case for ${title}`);
    const fbt_result = await fbc.createCase(title, project, text, category);
    core.debug(`fbt_result: ${JSON.stringify(fbt_result)}`);
    if (fbt_result.success) {
      core.setOutput("fogbugz_id", fbt_result.case.ixBug);
      const pvc = new PlanviewClient(
        core.getInput("planview_api_url"),
        core.getInput("planview_auth")
      );
      const boardId = core.getInput("planview_board_id");
      const laneId = core.getInput("planview_lane_id");
      const typeId = core.getInput("planview_type_id");
      core.debug(`Creating Planview card for ${fbt_result.case.ixBug}`);
      const pvc_result = await pvc.createCard(
        boardId,
        laneId,
        typeId,
        title,
        fbt_result.case.ixBug,
        payload.pull_request.html_url
      );
      core.debug(`pvc_result: ${JSON.stringify(pvc_result)}`);
      pvc_result.success
        ? core.setOutput("planview_id", pvc_result.data.id)
        : core.setFailed(pvc_result);
    } else {
      core.setFailed(fbt_result);
    }
  } catch (error) {
    core.setFailed(error);
  }
}

module.exports = { run };
