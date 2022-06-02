# Dependabot Tickets

This action creates a Manuscript and LeanKit ticket for Dependabot pull requests.

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
        uses: ARPC/dependabot-tickets@v0.1.0
        with:
          fogbugz_api_url: "https://my.fogbuz.instantce/api"
          fogbugz_token: ${{ secrets.FOGBUGZ_API_TOKEN }}
          fogbugz_project: My Project
          fogbugz_category: "My Category"
          leankit_api_url: "https://mysite.leankit.com/io"
          leankit_auth: ${{ secrets.LEANKIT_AUTH }}
          board_id: 1000000001
          lane_id: 1000000002
          leankit_type_id: 1000000003
          users: dependabot
```
