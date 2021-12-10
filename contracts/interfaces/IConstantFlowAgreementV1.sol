pragma solidity ^0.4.24;

import "./ISuperfluidToken.sol";

contract IConstantFlowAgreementV1 {
    event FlowUpdated(
        ISuperfluidToken indexed token,
        address indexed sender,
        address indexed receiver,
        int96 flowRate,
        int256 totalSenderFlowRate,
        int256 totalReceiverFlowRate,
        bytes userData
    );

    function createFlow(
        ISuperfluidToken token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function updateFlow(
        ISuperfluidToken token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function deleteFlow(
        ISuperfluidToken token,
        address sender,
        address receiver,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function getFlow(
        ISuperfluidToken token,
        address sender,
        address receiver
    )
        external
        view
        returns (
            uint256 timestamp,
            int96 flowRate,
            uint256 deposit,
            uint256 owedDeposit
        );
}
