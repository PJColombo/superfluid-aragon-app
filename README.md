# Flow Finance

Flow Finance is an Aragon App that allows an organization to stream their funds by using Superfluid's CFA via an agent app that holds all the DAO's Super Tokens.

The Flow Finance app acts as an interface between the Agent and the Superfluid contracts, using the Agent to perform all the calls to the CFA.

#### 🐲 Project Stage: Local

The Flow Finance app hasn't been published on the APM yet.

## Initialization

It is initialized with:

* `_agent` The address of the agent contract that is going to hold the supertokens
* `_host_` The address of the Superfluid host contract
* `_cfa_`  The address of the **constant flow agreement** contract

## Roles

The flow finance app implements the following roles:
* **MANAGE_STREAMS_ROLE**: Necessary to create, update, and delete constant flows.
* **SET_AGENT_ROLE**: Necessary to change the agent if it's needed.

The flow finance app should have the following roles:
* **SAFE_EXECUTE_ROLE**: It should be able to execute arbitrary code from the agent that holds the supertokens.


## How to run locally

1. Clone this repo:

```sh 
git clone https://github.com/BlossomLabs/flow-finance.git

```

2. Install dependencies:

```sh
yarn

cd app/

yarn
``` 

3. Go to the root folder and run the following command:

```sh
yarn start
```

This will start a local blockchain, deploy the Aragon and Superfluid framework and a DAO containing the installed app and all the permissions set up. It will also mint some test super tokens to the test accounts and it will deposite some in the Agent app.
