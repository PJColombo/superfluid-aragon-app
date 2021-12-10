pragma solidity ^0.4.24;

contract ISuperfluidToken {
    function getHost() external view returns (address host);

    function realtimeBalanceOf(address account, uint256 timestamp)
        public
        view
        returns (
            int256 availableBalance,
            uint256 deposit,
            uint256 owedDeposit
        );
}
