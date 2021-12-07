pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";

contract SuperfluidFinance is AragonApp {

    function initialize() external onlyInit {
        initialized();
    }
}
