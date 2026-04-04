# Pitcrew

This starter full stack project has been generated using AlgoKit. See below for default getting started instructions.

## Setup

### Initial setup
1. Clone this repository to your local machine.
2. Ensure [Docker](https://www.docker.com/) is installed and operational. Then, install `AlgoKit` following this [guide](https://github.com/algorandfoundation/algokit-cli#install).
3. Install dependencies using one of the following approaches:
   - Recommended monorepo bootstrap: run `algokit project bootstrap all` in the project root.
   - Manual install by project:
     - Frontend: `cd projects/Pitcrew-frontend && npm install`
     - Backend: `cd projects/Pitcrew-backend && npm install`
     - Contracts (Python): from project root run `python -m venv .venv`, then `.venv\\Scripts\\activate`, then `pip install -r requirements.txt`
4. In the case of a smart contract project, execute `algokit generate env-file -a target_network localnet` from the `Pitcrew-contracts` directory to create a `.env.localnet` file with default configuration for `localnet`.
5. To build your project, execute `algokit project run build`. This compiles your project and prepares it for running.
6. For project-specific instructions, refer to the READMEs of the child projects:
   - Smart Contracts: [Pitcrew-contracts](projects/Pitcrew-contracts/README.md)
   - Backend Application: [Pitcrew-backend](projects/Pitcrew-backend/README.md)
   - Frontend Application: [Pitcrew-frontend](projects/Pitcrew-frontend/README.md)

> This project is structured as a monorepo, refer to the [documentation](https://github.com/algorandfoundation/algokit-cli/blob/main/docs/features/project/run.md) to learn more about custom command orchestration via `algokit project run`.

### Subsequently

1. If you update to the latest source code and there are new dependencies, you will need to run `algokit project bootstrap all` again.
2. Follow step 3 above.

## Tools

This project makes use of Python and React to build Algorand smart contracts and to provide a base project configuration to develop frontends for your Algorand dApps and interactions with smart contracts. The following tools are in use:

- Algorand, AlgoKit, and AlgoKit Utils
- Python dependencies including Poetry, Black, Ruff or Flake8, mypy, pytest, and pip-audit
- React and related dependencies including AlgoKit Utils, Tailwind CSS, daisyUI, use-wallet, npm, jest, playwright, Prettier, ESLint, and Github Actions workflows for build validation

### VS Code

It has also been configured to have a productive dev experience out of the box in [VS Code](https://code.visualstudio.com/), see the [backend .vscode](./backend/.vscode) and [frontend .vscode](./frontend/.vscode) folders for more details.

## Integrating with smart contracts and application clients

Refer to the [Pitcrew-contracts](projects/Pitcrew-contracts/README.md) folder for overview of working with smart contracts, [projects/Pitcrew-frontend](projects/Pitcrew-frontend/README.md) for overview of the React project and the [projects/Pitcrew-frontend/contracts](projects/Pitcrew-frontend/src/contracts/README.md) folder for README on adding new smart contracts from backend as application clients on your frontend. The templates provided in these folders will help you get started.
When you compile and generate smart contract artifacts, your frontend component will automatically generate typescript application clients from smart contract artifacts and move them to `frontend/src/contracts` folder, see [`generate:app-clients` in package.json](projects/Pitcrew-frontend/package.json). Afterwards, you are free to import and use them in your frontend application.

The frontend starter also provides an example of interactions with your IntentClient in [`AppCalls.tsx`](projects/Pitcrew-frontend/src/components/AppCalls.tsx) component by default.

## Next Steps

You can take this project and customize it to build your own decentralized applications on Algorand. Make sure to understand how to use AlgoKit and how to write smart contracts for Algorand before you start.
