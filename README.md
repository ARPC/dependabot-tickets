# Dependabot Tickets

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

This action creates a FogBugz and AgilePlace Planview ticket for Dependabot pull requests.

## Example usage

```yaml
on: [pull_request]

jobs:
  check-dependabot-pull-requests:
    runs-on: ubuntu-latest
    name: Check for Dependabot Pull Requests
    steps:
      - name: Step 1
        id: step_1
        uses: ARPC/dependabot-tickets@v0.2.0
        with:
          fogbugz_api_url: 'https://my.fogbuz.instantce/api'
          fogbugz_token: ${{ secrets.FOGBUGZ_API_TOKEN }}
          fogbugz_project: My Project
          fogbugz_category: 'My Category'
          planview_api_url: 'https://mysite.leankit.com/io'
          planview_auth: ${{ secrets.LEANKIT_AUTH }}
          planview_board_id: 1000000001
          planview_lane_id: 1000000002
          planview_type_id: 1000000003
          users: dependabot
```

## Development

- npm install
- npm test
