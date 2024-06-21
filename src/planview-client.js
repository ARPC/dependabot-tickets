const axios = require("axios");

const PlanviewClient = (base_url, base64Auth) => {
  const cardUrl = `${base_url}/card`;
  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `bearer ${base64Auth}`
    }
  };

  const getCreateCardPayload = (boardId, laneId, typeId, title, customId, pr_url) => {
    return {
      boardId: boardId.toString(),
      laneId: laneId.toString(),
      typeId: typeId.toString(),
      title: title.toString(),
      customId: customId.toString(),
      externalLink: {
        label: "GitHub PR",
        url: pr_url
      }
    };
  };

  const parseResponse = result => {
    if (result.status === 200 && !!result.data.id) {
      return {
        success: true,
        data: result.data
      };
    } else {
      return {
        success: false,
        result
      };
    }
  };

  const parseException = e => {
    return {
      success: false,
      error: e
    };
  };

  const createCard = async (boardId, laneId, typeId, title, customId, pr_url) => {
    try {
      const payload = getCreateCardPayload(boardId, laneId, typeId, title, customId, pr_url);
      const response = await axios.post(cardUrl, payload, config);
      return parseResponse(response);
    } catch (e) {
      return parseException(e);
    }
  };

  return { createCard };
};

module.exports = PlanviewClient;
