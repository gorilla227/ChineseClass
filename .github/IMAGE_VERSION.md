# Image Versions

Manually edit and commit `VERSION_MAJOR` to change the image's major version.
The file contains one non-negative integer, initially `1`. The workflow never
edits or commits this file.

Published image versions follow `v<major>.<minor>.<attempt>`:

- The first non-PR run for a new major version uses minor version `0`.
- Later runs use `github.run_number` minus that major version's starting run number.
- Re-running a workflow keeps the minor version and increments `github.run_attempt`.
- For example: `v1.0.1`, `v1.1.1`, `v1.1.2`; changing the file to `2` starts `v2.0.1`.

The workflow stores each starting run number in an annotated Git tag named
`image-version-base/v<major>`. Do not delete or edit these tags. The workflow needs
`contents: write` to create them, but does not change repository files. Publishing
runs share a concurrency group to prevent competing baseline creation.

PR runs build without publishing or creating baseline tags. They use an existing
baseline when available; otherwise their preview minor version is `0`. Since the
counter uses GitHub's workflow run number, PR, failed, or cancelled runs can leave
gaps in later published minor versions. Increment the major version rather than
reusing an old value: an old major retains its original baseline.

The same version appears in the GHCR image tag, Actions run summary, and site badge.