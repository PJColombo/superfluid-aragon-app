pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-agent/contracts/Agent.sol";

import "./interfaces/IConstantFlowAgreementV1.sol";
import "./interfaces/ISuperfluid.sol";
import "./interfaces/ISuperToken.sol";

contract FlowFinance is AragonApp {
    /**
    Hardcoded constants to save gas
        bytes32 public constant MANAGE_STREAMS_ROLE = keccak256("MANAGE_STREAMS_ROLE");
        bytes32 public constant SET_AGENT_ROLE = keccak256("SET_AGENT_ROLE");
    */
    bytes32 public constant MANAGE_STREAMS_ROLE = 0x56c3496db27efc6d83ab1a24218f016191aab8835d442bc0fa8502f327132cbe;
    bytes32 public constant SET_AGENT_ROLE = 0xf57d195c0663dd0e8a2210bb519e2b7de35301795015198efff16e9a2be238c8;

    string private constant ERROR_AGENT_NOT_CONTRACT = "FLOW_FINANCE_AGENT_NOT_CONTRACT";
    string private constant ERROR_HOST_NOT_CONTRACT = "FLOW_FINANCE_HOST_NOT_CONTRACT";
    string private constant ERROR_CFA_NOT_CONTRACT = "FLOW_FINANCE_CFA_NOT_CONTRACT";
    string private constant ERROR_SUPERTOKEN_NOT_CONTRACT = "FLOW_FINANCE_SUPERTOKEN_NOT_CONTRACT";
    string private constant ERROR_INVALID_SUPERTOKEN = "FLOW_FINANCE_INVALID_SUPERTOKEN";
    string private constant ERROR_DEPOSIT_AMOUNT_ZERO = "FLOW_FINANCE_DEPOSIT_AMOUNT_ZERO";
    string private constant ERROR_WITHDRAW_AMOUNT_ZERO = "FLOW_FINANCE_WITHDRAW_AMOUNT_ZERO";
    string private constant ERROR_SUPERTOKEN_APPROVE_FAILED = "FLOW_FINANCE_SUPERTOKEN_APPROVE_FAILED";
    string private constant ERROR_SUPERTOKEN_TRANSFER_FROM_REVERTED = "FLOW_FINANCE_SUPERTOKEN_TRANSFER_FROM_REVERT";
    string private constant ERROR_SENDER_CAN_NOT_DELETE_FLOW = "FLOW_FINANCE_SENDER_CAN_NOT_DELETE_FLOW";

    // Superfluid data
    ISuperfluid public host;
    IConstantFlowAgreementV1 public cfa; // Constant Flow Agreement

    Agent public agent;

    event NewAgentSet(Agent agent);

    modifier isValidSuperToken(ISuperToken _token) {
        require(isContract(address(_token)), ERROR_SUPERTOKEN_NOT_CONTRACT);

        (bool success, ) = staticInvoke(address(_token), abi.encodeWithSelector(_token.getHost.selector));
        require(success, ERROR_INVALID_SUPERTOKEN);
        _;
    }

    function initialize(
        Agent _agent,
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa
    ) external onlyInit {
        require(isContract(address(_agent)), ERROR_AGENT_NOT_CONTRACT);
        require(isContract(address(_host)), ERROR_HOST_NOT_CONTRACT);
        require(isContract(address(_cfa)), ERROR_CFA_NOT_CONTRACT);

        agent = _agent;
        host = _host;
        cfa = _cfa;

        initialized();
    }

    /**
     * @notice Deposit `@tokenAmount(_token, _amount)`.
     * @param _token Address of deposited super token
     * @param _amount Amount of tokens sent
     * @param _isExternalDeposit Flag that indicates wether the assets are already in the app
     */
    function deposit(
        ISuperToken _token,
        uint256 _amount,
        bool _isExternalDeposit
    ) external isInitialized isValidSuperToken(_token) {
        require(_amount > 0, ERROR_DEPOSIT_AMOUNT_ZERO);

        // External deposit will be false when the assets were already in the Finance app
        // and just need to be transferred to the Agent
        if (_isExternalDeposit) {
            // This assumes the sender has approved the tokens for Finance
            require(_token.transferFrom(msg.sender, address(this), _amount), ERROR_SUPERTOKEN_TRANSFER_FROM_REVERTED);
        }
        // Approve the tokens for the Agent (it does the actual transferring)
        require(_token.approve(agent, _amount), ERROR_SUPERTOKEN_APPROVE_FAILED);
        // Finally, initiate the deposit
        agent.deposit(_token, _amount);
    }

    /**
     * @notice Withdraw `@tokenAmount(_token, _amount)` to `_receiver`.
     * @param _token Address of withdrawed super token
     * @param _receiver Receiver of the withdrawed amount
     * @param _amount Amount of tokens received
     */
    function withdraw(
        ISuperToken _token,
        address _receiver,
        uint256 _amount
    ) external auth(MANAGE_STREAMS_ROLE) isValidSuperToken(_token) {
        require(_amount > 0, ERROR_WITHDRAW_AMOUNT_ZERO);

        agent.transfer(_token, _receiver, _amount);
    }

    /**
     * @notice Create a new `_token.symbol(): string` flow with a rate of `@tokenAmount(_token, _flowRate, false)` tokens per second to `_receiver`.
     * @param _token Address of super token
     * @param _receiver Receiver of the flow
     * @param _flowRate Flow's rate of tokens per second
     */
    function createFlow(
        ISuperToken _token,
        address _receiver,
        int96 _flowRate
    ) external auth(MANAGE_STREAMS_ROLE) isValidSuperToken(_token) {
        bytes memory encodedAgreementCall = abi.encodeWithSelector(
            cfa.createFlow.selector,
            _token,
            _receiver,
            _flowRate,
            new bytes(0)
        );

        callAgreement(encodedAgreementCall);
    }

    /**
     * @notice Update `_token.symbol(): string` flow to `_receiver`  with a new rate of `@tokenAmount(_token, _flowRate, false)` tokens per second.
     * @param _token Address of super token
     * @param _receiver Receiver of the flow
     * @param _flowRate Flow's rate of tokens per second
     */
    function updateFlow(
        ISuperToken _token,
        address _receiver,
        int96 _flowRate
    ) external auth(MANAGE_STREAMS_ROLE) isValidSuperToken(_token) {
        bytes memory encodedAgreementCall = abi.encodeWithSelector(
            cfa.updateFlow.selector,
            _token,
            _receiver,
            _flowRate,
            new bytes(0)
        );

        callAgreement(encodedAgreementCall);
    }

    /**
     * @notice Delete `_token.symbol(): string` flow to `_receiver`.
     * @param _token Address of super token
     * @param _receiver Receiver of the flow
     */
    function deleteFlow(ISuperToken _token, address _receiver) external isInitialized isValidSuperToken(_token) {
        bool senderHasPermission = canPerform(msg.sender, MANAGE_STREAMS_ROLE, new uint256[](0));
        (uint256 timestamp, , , ) = cfa.getFlow(_token, agent, msg.sender);

        // Sender is allow to delete the flows he's part of.
        require(timestamp != 0 || senderHasPermission, ERROR_SENDER_CAN_NOT_DELETE_FLOW);
        bytes memory encodedAgreementCall = abi.encodeWithSelector(
            cfa.deleteFlow.selector,
            _token,
            agent,
            _receiver,
            new bytes(0)
        );

        callAgreement(encodedAgreementCall);
    }

    function setAgent(Agent _agent) external auth(SET_AGENT_ROLE) {
        require(isContract(address(_agent)), ERROR_AGENT_NOT_CONTRACT);
        agent = _agent;

        emit NewAgentSet(_agent);
    }

    function callAgreement(bytes encodedAgreementCall) internal {
        agent.safeExecute(
            host,
            abi.encodeWithSelector(host.callAgreement.selector, cfa, encodedAgreementCall, new bytes(0))
        );
    }

    function staticInvoke(address _addr, bytes memory _calldata) internal view returns (bool, uint256) {
        bool success;
        uint256 ret;
        assembly {
            let ptr := mload(0x40) // free memory pointer

            success := staticcall(
                gas, // forward all gas
                _addr, // address
                add(_calldata, 0x20), // calldata start
                mload(_calldata), // calldata length
                ptr, // write output over free memory
                0x20 // uint256 return
            )

            if gt(success, 0) {
                ret := mload(ptr)
            }
        }
        return (success, ret);
    }
}
