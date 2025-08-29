/* eslint-env jest */
const core = require('@actions/core')
const github = require('@actions/github')

const FogBugzClient = require('../src/fogbugz-client')
jest.mock('../src/fogbugz-client', () => jest.fn())
const createCase = jest.fn()

const PlanviewClient = require('../src/planview-client')
jest.mock('../src/planview-client', () => jest.fn())
const createCard = jest.fn()

const dependabotPr = require('./dependabot-pr-sample.json')
const regularPr = require('./regular-pr-sample.json')
const syncPr = require('./sync-pr-sample.json')
const notAPr = require('./not-a-pr-sample.json')
const main = require('../src/main')

const debugMock = jest.spyOn(core, 'debug').mockImplementation()
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
const getBooleanInputMock = jest.spyOn(core, 'getBooleanInput').mockImplementation(() => false)
const setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

const invalidFogBugzResponse = { success: false, error: 'hi' }
const validFogBugzResponse = { success: true, case: { ixBug: 123 } }

const invalidPlanviewResponse = { success: false, result: 'hi' }
const validPlanviewResponse = { success: true, data: { id: 42 } }

describe('action', () => {
  let debugMessages = []

  beforeEach(() => {
    jest.clearAllMocks()

    debugMessages = []
    debugMock.mockImplementation(msg => {
      debugMessages.push(msg)
    })

    // Ensure boolean input defaults to false unless a test overrides it
    getBooleanInputMock.mockReturnValue(false)

    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'fogbugz_api_url':
          return 'https://my.fb.com/api'
        case 'fogbugz_token':
          return 'myfbtoken'
        case 'fogbugz_project':
          return 'My Project'
        case 'fogbugz_subproject':
          return 'My Subproject'
        case 'fogbugz_category':
          return 'My Category'
        case 'ignore_fb_error':
          return 'false'
        case 'planview_api_url':
          return 'https://my.pv.com/io'
        case 'planview_auth':
          return 'myplanviewauth'
        case 'planview_board_id':
          return 123456
        case 'planview_lane_id':
          return 654321
        case 'planview_type_id':
          return 987654
        case 'users':
          return 'dependabot[bot]'
        default:
          return ''
      }
    })

    FogBugzClient.mockImplementation((_baseUrl, _token) => {
      return { createCase }
    })

    PlanviewClient.mockImplementation((_baseUrl, _auth) => {
      return { createCard }
    })
  })

  it('ignores non-opened PRs', async () => {
    github.context.payload = syncPr

    await main.run()

    expect(debugMessages.length).toBe(3)
    expect(debugMessages).toContain('Running action')
    expect(debugMessages).toContain(syncPr)
    expect(debugMessages).toContain('pr was synchronize so not running')
  })

  it('runs for reopened PRs', async () => {
    const reopened = JSON.parse(JSON.stringify(dependabotPr))
    reopened.action = 'reopened'
    github.context.payload = reopened

    await main.run()

    expect(debugMessages).toContain('Running action')
    expect(debugMessages).toContain(reopened)
    expect(FogBugzClient).toHaveBeenCalled()
  })

  it("ignores actions that aren't prs", async () => {
    github.context.payload = notAPr

    await main.run()

    expect(debugMessages.length).toBe(3)
    expect(debugMessages).toContain('Running action')
    expect(debugMessages).toContain(notAPr)
    expect(debugMessages).toContain('not a pr so not running')
  })

  it('ignores PRs not opened by dependabot', async () => {
    github.context.payload = regularPr

    await main.run()

    expect(debugMessages.length).toBe(3)
    expect(debugMessages).toContain('Running action')
    expect(debugMessages).toContain(regularPr)
    expect(debugMessages).toContain('pr was not opened by Dependabot so not running')
  })

  it('creates the FogBugz client', async () => {
    github.context.payload = dependabotPr

    await main.run()

    expect(FogBugzClient).toHaveBeenCalledWith('https://my.fb.com/api', 'myfbtoken')
  })

  it('tries to create the FogBugz case', async () => {
    github.context.payload = dependabotPr
    createCase.mockReturnValue('myresult')

    await main.run()

    expect(createCase).toHaveBeenCalledWith(
      'My Subproject - Dependabot PR title',
      'My Project',
      'Dependabot PR body',
      'My Category'
    )
    expect(debugMessages).toContain('Creating FB case for My Subproject - Dependabot PR title')
    expect(debugMessages).toContain('fbt_result: "myresult"')
  })

  it("fails if the FogBugz case isn't created", async () => {
    github.context.payload = dependabotPr
    createCase.mockReturnValue(invalidFogBugzResponse)

    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(invalidFogBugzResponse)
    expect(debugMessages).toContain(`fbt_result: ${JSON.stringify(invalidFogBugzResponse)}`)
  })

  it('adds the FogBugz id to the output if the FogBugz case is created', async () => {
    github.context.payload = dependabotPr
    createCase.mockReturnValue(validFogBugzResponse)

    await main.run()

    expect(FogBugzClient).toHaveBeenCalledWith('https://my.fb.com/api', 'myfbtoken')
    expect(setOutputMock).toHaveBeenCalledWith('fogbugz_id', 123)
  })

  it('creates the Planview client if the FogBugz case is created', async () => {
    github.context.payload = dependabotPr

    await main.run()

    expect(PlanviewClient).toHaveBeenCalledWith('https://my.pv.com/io', 'myplanviewauth')
    expect(debugMessages).toContain('Creating Planview card for 123')
  })

  it('creates the Planview client if the FogBugz error is ignored', async () => {
    github.context.payload = dependabotPr
    createCase.mockReturnValue(invalidFogBugzResponse)
    getBooleanInputMock.mockReturnValue(true)

    await main.run()

    expect(PlanviewClient).toHaveBeenCalledWith('https://my.pv.com/io', 'myplanviewauth')
    expect(debugMessages).toContain(`Ignoring FB error: ${invalidFogBugzResponse.error}`)
    expect(debugMessages).toContain('Creating Planview card for 0')
  })

  it('tries to create the Planview card', async () => {
    github.context.payload = dependabotPr
    createCase.mockReturnValue(validFogBugzResponse)
    createCard.mockReturnValue('myresult')

    await main.run()

    expect(createCard).toHaveBeenCalledWith(
      123456,
      654321,
      987654,
      'My Subproject - Dependabot PR title',
      123,
      'https://github.com/MyOrg/my_repo/pull/123'
    )
    expect(debugMessages).toContain('pvc_result: "myresult"')
  })

  it("fails if the card can't be created", async () => {
    github.context.payload = dependabotPr
    createCard.mockReturnValue(invalidPlanviewResponse)

    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(invalidPlanviewResponse)
    expect(debugMessages).toContain(`pvc_result: ${JSON.stringify(invalidPlanviewResponse)}`)
  })

  it('succeeds if the card can be created', async () => {
    github.context.payload = dependabotPr
    createCard.mockReturnValue(validPlanviewResponse)

    await main.run()

    expect(setOutputMock).toHaveBeenCalledWith('planview_id', 42)
  })

  it('handles and unecpected exception', async () => {
    const error = new Error('just no')
    getInputMock.mockImplementation(_name => {
      throw error
    })

    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(error)
  })

  it('just uses the PR title if there is no subproject', async () => {
    github.context.payload = dependabotPr
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'fogbugz_api_url':
          return 'https://my.fb.com/api'
        case 'fogbugz_token':
          return 'myfbtoken'
        case 'fogbugz_project':
          return 'My Project'
        case 'fogbugz_category':
          return 'My Category'
        case 'ignore_fb_error':
          return 'false'
        case 'planview_api_url':
          return 'https://my.pv.com/io'
        case 'planview_auth':
          return 'myplanviewauth'
        case 'planview_board_id':
          return 123456
        case 'planview_lane_id':
          return 654321
        case 'planview_type_id':
          return 987654
        case 'users':
          return 'dependabot[bot]'
        default:
          return ''
      }
    })

    await main.run()

    expect(createCase).toHaveBeenCalledWith(
      'Dependabot PR title',
      'My Project',
      'Dependabot PR body',
      'My Category'
    )
  })
})
