# Superfluid Aragon App <a href="#"><img align="right" src=".github/assets/blossom-labs.svg" height="80px" /></a>

Superfluid is an Aragon App that enables an organization to interact with the [Superfluid protocol](https://www.superfluid.finance/home). It allows a DAO to stream their funds by using Superfluid's [Constant Flow Agreement](https://docs.superfluid.finance/superfluid/docs/constant-flow-agreement) via an agent app that holds all the DAO's [Super Tokens](https://docs.superfluid.finance/superfluid/docs/super-tokens).

The Superfluid app acts as an interface between the Agent and the Superfluid protocol contracts, using the Agent to perform all the calls to the CFA.

#### 🐲 Project Stage: Completed

The Superfluid app has been published to the `open.aragonpm.eth` registry on **Polygon**, and **Gnosis** network.

The app's repo ens name is the following: `superfluid.open.aragonpm.eth`.

![](.github/assets/superfluid-aragon-app.gif)

## Demos

Here you can find some demos to play with:

- [Polygon demo](https://polygon.aragon.blossom.software/#/superfluiddemo1/0x5cc834b60a4741a79ad2cd0d28d48a2e9c5e3aad/).
- [Gnosis demo](https://xdai.aragon.blossom.software/#/superfluiddemo/0x7569ca988796bd1511983fd9639360948a59ff49/).

## Initialization

To initialized the app you'll need to set up the following parameters:

* `_agent` The address of the Agent contract that is going to hold the Super Tokens.
* `_host_` The address of the Superfluid host contract.
* `_cfa_`  The address of the **constant flow agreement** contract.

## Roles

The Superfluid app implements the following roles:
* **MANAGE_STREAMS_ROLE**: Necessary to create, update, and delete constant flows.
* **MANAGE_SUPERTOKENS_ROLE**: Necessary to upgrade and downgrade SuperToken amount.
* **SET_AGENT_ROLE**: Necessary to change the agent if it's needed.

The app should have the following roles as well:
* **SAFE_EXECUTE_ROLE**: It should be able to execute arbitrary code from the agent that holds the Super Tokens.
* **TRANSFER_ROLE**: It should be able to transfer Super Tokens hold by the agent.

## EVMcrispr installation script

Use the following script on the [evmcrispr terminal](https://evm-crispr.blossom.software/#/terminal) to install the app on a DAO.

```
connect <dao-address> <path>
install superfluid.open:new agent <host-address> <cfa-address> 
grant superfluid.open:new agent SAFE_EXECUTE_ROLE voting
grant superfluid.open:new agent TRANSFER_ROLE voting
grant voting superfluid.open:new MANAGE_STREAMS_ROLE voting
grant voting superfluid.open:new SET_AGENT_ROLE voting
grant <?fluid-proposals> superfluid.open:new MANAGE_SUPERTOKENS_ROLE voting
```

You can find the Superfluid contract addresses [here](https://docs.superfluid.finance/superfluid/protocol-developers/networks).

## How to run locally

1. Clone this repo:

```sh 
git clone https://github.com/BlossomLabs/superfluid-aragon-app.git

```

2. Install dependencies:

```sh
yarn

cd app/

yarn
``` 

3. Go to the root folder and run the following:

```sh
yarn start
```


This will do the following:

* Start a local ganache blockchain and set up some accounts.
* Deploy the AragonOS framework contracts.
* Deploy the Superfluid framework contracts and a couple of Super Tokens.
* Deploy an Aragon DAO and install on it an Agent app needed by the app.
* Deploy the app, initialize it and set up its permissions as well as the agent ones.
* Mint Super Tokens for the testing accounts.
* Make an initial Super Token's deposit to the Agent.
* Run a local Aragon Client
* Build and deploy the app's front end.

**Note:** To run this project you'll need a Node.js version between v12 and v15.

## How to run tests

The contract tests require running a fork network, so you'll need to set up the following env variables: 

```
HARDHAT_FORK_ID=<chain-id>
HARDHAT_FORK=<archive-node-uri>
HARDHAT_FORK_BLOCK_NUMBER=<blocknumber>
```

Once you created the `.env` file you just need to run: `yarn test`.
