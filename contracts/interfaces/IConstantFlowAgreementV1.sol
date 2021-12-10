pragma solidity ^0.4.24;

contract IConstantFlowAgreementV1 {
    event FlowUpdated(
        address indexed token,
        address indexed sender,
        address indexed receiver,
        int96 flowRate,
        int256 totalSenderFlowRate,
        int256 totalReceiverFlowRate,
        bytes userData
    );

    function createFlow(
        address token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function updateFlow(
        address token,
        address receiver,
        int96 flowRate,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function deleteFlow(
        address token,
        address sender,
        address receiver,
        bytes ctx
    ) external returns (bytes memory newCtx);

    function getFlow(
        address token,
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
