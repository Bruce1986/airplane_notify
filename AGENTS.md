# Guidelines for Working with AI Assistant Feedback

This repository uses **gemini-code-assist** to provide review suggestions. The assistant may also help in verifying adherence to our unit testing standards for new functions.
Please address all suggestions from the AI assistant. If a suggestion is not implemented, provide a brief justification in the pull request discussion (e.g., as a comment on the pull request itself, or a comment directly on the line of code in question).

Before opening a pull request, run `npm run build` in the `web/` workspace and fix any reported issues. Documenting this requirement here keeps the reminder lightweight without burning extra compute in CI; if we later promote the check into a GitHub workflow, update this note accordingly.

Contributors must also follow the workflow and naming rules documented in
[`project-handbook.md`](project-handbook.md) when developing features and creating pull requests.

All new functions must include corresponding unit tests. If unit testing is not feasible for a particular function, a clear explanation should be provided (e.g., as a comment on the pull request itself, or a comment directly on the line of code in question).
