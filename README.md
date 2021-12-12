# Flow Finance


## Initialization

Flow Finance is an Aragon App that can be used to manage Superfluid constant streams. It is initialized with:
* `_agent` The address of the agent contract that is going to hold the supertokens
* `_host_` The address of the Superfluid host contract
* `_cfa_`  The address of the **constant flow agreement** contract

## Roles

The flow finance app implements the following roles:
* **MANAGE_STREAMS_ROLE**: Necessary to create, update, and delete constant flows.
* **SET_AGENT_ROLE**: Necessary to change the agent if it's needed.

The flow finance app should have the following roles:
* **EXECUTE_ROLE**: It should be able to execute arbitrary code from the agent that holds the supertokens.

## Interface

You can deploy the contracts in hardhat and run the interface by executing `yarn start`.

## Contributing

We welcome community contributions!

Please check out our [open Issues](https://github.com/blossomlabs/flow/issues) to get started.
