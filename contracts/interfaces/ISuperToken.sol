pragma solidity ^0.4.24;

contract ISuperToken {
    function selfMint(
        address account,
        uint256 amount,
        bytes userData
    ) external;

    function realtimeBalanceOf(address account, uint256 timestamp)
        public
        view
        returns (
            int256 availableBalance,
            uint256 deposit,
            uint256 owedDeposit
        );

    function upgrade(uint256 amount) external;
}
