pragma solidity ^0.4.24;

import "./ISuperfluidToken.sol";

contract ISuperToken is ISuperfluidToken {
    function selfMint(
        address account,
        uint256 amount,
        bytes userData
    ) external;

    function upgrade(uint256 amount) external;
}
