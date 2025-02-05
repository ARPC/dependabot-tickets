const axios = require('axios')
const PlanviewClient = require('../src/planview-client')

const postMock = jest.spyOn(axios, 'post').mockImplementation()

describe('createCase', () => {
  const planviewClient = new PlanviewClient('https://example.com', 'somebase64Auth')
  const validResponse = {
    status: 201,
    data: {
      id: 1234
    }
  }
  const boardId = 123
  const laneId = 234
  const typeId = 456
  const title = 'My Title'
  const customId = 999
  const prUrl = 'https://github.com/some_pr_url'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('posts to the Planview API', async () => {
    postMock.mockImplementation((_url, _payload, _config) => {
      return validResponse
    })

    await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(postMock).toHaveBeenCalledWith(
      'https://example.com/card',
      expect.anything(),
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'bearer somebase64Auth'
        }
      })
    )
  })

  it('posts the correct payload', async () => {
    postMock.mockImplementation((_url, _payload, _config) => {
      return validResponse
    })

    await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(postMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        boardId: '123',
        laneId: '234',
        typeId: '456',
        title: 'My Title',
        customId: '999',
        externalLink: {
          label: 'GitHub PR',
          url: 'https://github.com/some_pr_url'
        }
      }),
      expect.anything()
    )
  })

  it('returns the case number if case is created', async () => {
    postMock.mockImplementation((_url, _payload, _config) => {
      return validResponse
    })

    const result = await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(result.success).toEqual(true)
    expect(result.data).toEqual(validResponse.data)
  })

  it('returns an error if the card is not created', async () => {
    const invalidResponse = {
      status: 201,
      data: {}
    }
    postMock.mockImplementation((_url, _payload, _config) => {
      return invalidResponse
    })

    const result = await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(result.success).toEqual(false)
    expect(result.data).toBe(invalidResponse.data)
  })

  it('returns an error if the response is not 201', async () => {
    const invalidResponse = {
      status: 500,
      data: {}
    }
    postMock.mockImplementation((_url, _payload, _config) => {
      return invalidResponse
    })

    const result = await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(result.success).toEqual(false)
    expect(result.data).toBe(invalidResponse.data)
  })

  it('returns an error if there is an eunexpected error', async () => {
    const error = new Error('just no')
    postMock.mockImplementation((_url, _payload, _config) => {
      throw error
    })

    const result = await planviewClient.createCard(boardId, laneId, typeId, title, customId, prUrl)

    expect(result.success).toEqual(false)
    expect(result.error).toBe(error)
  })
})
