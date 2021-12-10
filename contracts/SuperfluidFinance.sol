pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/apps-agent/contracts/Agent.sol";

import "./interfaces/ISuperfluid.sol";
import "./interfaces/IConstantFlowAgreementV1.sol";

contract SuperfluidFinance is AragonApp {
    /**
    Hardcoded constants to save gas
        bytes32 public constant MANAGE_SUPERTOKENS_ROLE = keccak256("MANAGE_SUPERTOKENS_ROLE");
        bytes32 public constant MANAGE_STREAMS_ROLE = keccak256("MANAGE_STREAMS_ROLE");
        bytes32 public constant SET_AGENT_ROLE = keccak256("SET_AGENT_ROLE");
    */
    bytes32 public constant MANAGE_SUPERTOKENS_ROLE = 0xc3785b41f0ebb77bd89636ecae52c950cee1cd359f0a1e5fababbcb5a0bfcb97;
    bytes32 public constant MANAGE_STREAMS_ROLE = 0x56c3496db27efc6d83ab1a24218f016191aab8835d442bc0fa8502f327132cbe;
    bytes32 public constant SET_AGENT_ROLE = 0xf57d195c0663dd0e8a2210bb519e2b7de35301795015198efff16e9a2be238c8;

    string private constant ERROR_AGENT_NOT_CONTRACT = "SUPERFLUID_FINANCE_AGENT_NOT_CONTRACT";
    string private constant ERROR_HOST_NOT_CONTRACT = "SUPERFLUID_FINANCE_HOST_NOT_CONTRACT";
    string private constant ERROR_CFA_NOT_CONTRACT = "SUPERFLUID_FINANCE_CFA_NOT_CONTRACT";
    string private constant ERROR_SUPERTOKEN_NOT_CONTRACT = "SUPERFLUID_FINANCE_SUPERTOKEN_NOT_CONTRACT";
    string private constant ERROR_TOKEN_NOT_ACCEPTED = "SUPERFLUID_FINANCE_TOKEN_NOT_ACCEPTED";
    string private constant ERROR_CREATE_FLOW_CALL_FAILED = "SUPERFLUID_FINANCE_CREATE_FLOW_CALL_FAILED";
    string private constant ERROR_UPDATE_FLOW_CALL_FAILED = "SUPERFLUID_FINANCE_UPDATE_FLOW_CALL_FAILED";
    string private constant ERROR_DELETE_FLOW_CALL_FAILED = "SUPERFLUID_FINANCE_DELETE_FLOW_CALL_FAILED";

    // Superfluid data
    ISuperfluid private host;
    IConstantFlowAgreementV1 private cfa; // Constant Flow Agreement
    mapping(address => bool) private acceptedTokens;

    Agent public agent;

    event NewAgentSet(address agent);

    modifier isAcceptedToken(address _token) {
        require(acceptedTokens[_token], ERROR_TOKEN_NOT_ACCEPTED);
        _;
    }

    function initialize(
        Agent _agent,
        ISuperfluid _host,
        IConstantFlowAgreementV1 _cfa,
        address[] _acceptedTokens
    ) external onlyInit {
        require(isContract(address(_agent)), ERROR_AGENT_NOT_CONTRACT);
        require(isContract(address(_host)), ERROR_HOST_NOT_CONTRACT);
        require(isContract(address(_cfa)), ERROR_CFA_NOT_CONTRACT);

        for (uint256 i = 0; i < _acceptedTokens.length; i++) {
            address _acceptedToken = _acceptedTokens[i];
            require(isContract(_acceptedToken), ERROR_SUPERTOKEN_NOT_CONTRACT);

            acceptedTokens[_acceptedToken] = true;
        }

        agent = _agent;
        host = _host;
        cfa = _cfa;

        initialized();
    }

    function createFlow(
        address _token,
        address _receiver,
        int96 _flowRate
    ) external auth(MANAGE_STREAMS_ROLE) isAcceptedToken(_token) {
        bytes memory encodedAgreementCall = abi.encodeWithSelector(
            cfa.createFlow.selector,
            _token,
            _receiver,
            _flowRate,
            new bytes(0)
        );

        agent.safeExecute(
            host,
            abi.encodeWithSelector(host.callAgreement.selector, address(cfa), encodedAgreementCall, new bytes(0))
        );
    }

    function setAgent(Agent _agent) external auth(SET_AGENT_ROLE) {
        require(isContract(address(_agent)), ERROR_AGENT_NOT_CONTRACT);

        agent = _agent;

        emit NewAgentSet(address(_agent));
    }
}
