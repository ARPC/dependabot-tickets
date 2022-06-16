#Fogbugz Case Creator

This action creates a Manuscript case.

## Example usage

```yaml
on:
  pull_request:
    types: [opened]

jobs:
  create_fogbuz_case:
    runs-on: ubuntu-latest
    if: ${{ github.actor == 'dependabot[bot]' }}
    name: Create Fogbugz Case
    steps:
      - name: Create Case
        id: create_case
        uses: ARPC/fogbugz-case-creator@v0.1.0
        with:
          api_url: https://my.fogbuz.instantce/api
          token: ${{ secrets.FOGBUGZ_API_TOKEN }}
          project: My Project
          category: My Category
          title: My Title
          text: Some descrption
```

## Outputs
The action will return the case number (`case_number`) that was created which can be used in subsequent steps.
