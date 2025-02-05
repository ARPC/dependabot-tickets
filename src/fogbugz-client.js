const axios = require('axios')

class FogBugzClient {
  constructor (baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
    this.config = {
      headers: {
        Accept: 'application/json'
      }
    }
  }

  #getCreateCasePayload (title, project, text, category) {
    return {
      token: this.token,
      cmd: 'new',
      sTitle: title,
      sProject: project,
      sCategory: category,
      sEvent: text,
      fRichText: 1
    }
  }

  #parseResponse (result) {
    if (result.status === 200 && result.data.errors.length === 0) {
      return {
        success: true,
        case: result.data.data.case
      }
    } else {
      return {
        client: 'FogBugz',
        status: result.status,
        success: false,
        errors: result.data.errors,
        warnings: result.data.warnings
      }
    }
  }

  #parseException (e) {
    return {
      client: 'FogBugz',
      success: false,
      errors: [e.message]
    }
  }

  async createCase (title, project, text, category) {
    try {
      const payload = this.#getCreateCasePayload(title, project, text, category)
      const response = await axios.post(this.baseUrl, payload, this.config)
      return this.#parseResponse(response)
    } catch (e) {
      return this.#parseException(e)
    }
  }
}

module.exports = FogBugzClient
