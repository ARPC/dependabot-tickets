const axios = require("axios");

const FogBugzClient = function (baseUrl, token) {
  const config = {
    headers: {
      "Accept": "application/json",
    }
  }

  const getCreateCasePayload = (title, project, text, category) => {
    return {
      token: token,
      cmd: "new",
      sTitle: title,
      sProject: project,
      sCategory: category,
      sEvent: text,
      fRichText: 1
    };
  };

  const parseResponse = (result) => {
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
  };

  const parseException = (e) => {
    return {
      success: false,
      errors: [e.message]
    };
  };

  const createCase = async (title, project, text, category) => {
    try {
      const payload = getCreateCasePayload(title, project, text, category);
      const response = await axios.post(baseUrl, payload, config);
      return parseResponse(response);
    } catch (e) {
      return parseException(e);
    }
  }
  return {
    createCase: createCase
  };
};

module.exports = FogBugzClient;
