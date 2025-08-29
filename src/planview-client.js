const axios = require('axios')

class PlanviewClient {
  constructor (baseUrl, base64Auth) {
    this.baseUrl = baseUrl
    this.base64Auth = base64Auth
    this.config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `bearer ${base64Auth}`
      }
    }
    this.cardUrl = `${baseUrl}/card`
  }

  #getCreateCardPayload (boardId, laneId, typeId, title, customId, prUrl) {
    return {
      boardId: boardId.toString(),
      laneId: laneId.toString(),
      typeId: typeId.toString(),
      title: title.toString(),
      customId: customId.toString(),
      externalLink: {
        label: 'GitHub PR',
        url: prUrl
      }
    }
  }

  #parseResponse (result) {
    if (result.status === 201 && !!result.data.id) {
      return {
        success: true,
        data: result.data
      }
    } else {
      return {
        success: false,
        data: result.data
      }
    }
  }

  #parseException (e) {
    return {
      success: false,
      error: e
    }
  }

  async createCard (boardId, laneId, typeId, title, customId, prUrl) {
    try {
      const payload = this.#getCreateCardPayload(boardId, laneId, typeId, title, customId, prUrl)
      const response = await axios.post(this.cardUrl, payload, this.config)
      return this.#parseResponse(response)
    } catch (e) {
      return this.#parseException(e)
    }
  }
}

module.exports = PlanviewClient
