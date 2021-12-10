pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-agent/contracts/Agent.sol";

import "./interfaces/IConstantFlowAgreementV1.sol";
import "./interfaces/ISuperfluid.sol";
import "./interfaces/ISuperToken.sol";

contract SuperfluidFinance is AragonApp {
    /**
    Hardcoded constants to save gas
        bytes32 public constant MANAGE_STREAMS_ROLE = keccak256("MANAGE_STREAMS_ROLE");
        bytes32 public constant SET_AGENT_ROLE = keccak256("SET_AGENT_ROLE");
    */
    bytes32 public constant MANAGE_STREAMS_ROLE = 0x56c3496db27efc6d83ab1a24218f016191aab8835d442bc0fa8502f327132cbe;
    bytes32 public constant SET_AGENT_ROLE = 0xf57d195c0663dd0e8a2210bb519e2b7de35301795015198efff16e9a2be238c8;

    string private constant ERROR_AGENT_NOT_CONTRACT = "SUPERFLUID_FINANCE_AGENT_NOT_CONTRACT";
    string private constant ERROR_HOST_NOT_CONTRACT = "SUPERFLUID_FINANCE_HOST_NOT_CONTRACT";
    string private constant ERROR_CFA_NOT_CONTRACT = "SUPERFLUID_FINANCE_CFA_NOT_CONTRACT";
    string private constant ERROR_SUPERTOKEN_NOT_CONTRACT = "SUPERFLUID_FINANCE_SUPERTOKEN_NOT_CONTRACT";
    string private constant ERROR_INVALID_SUPERTOKEN = "SUPERFLUID_FINANCE_INVALID_SUPERTOKEN";

    // Superfluid data
    ISuperfluid private host;
    IConstantFlowAgreementV1 private cfa; // Constant Flow Agreement

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

    function deleteFlow(ISuperToken _token, address _receiver)
        external
        auth(MANAGE_STREAMS_ROLE)
        isValidSuperToken(_token)
    {
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
