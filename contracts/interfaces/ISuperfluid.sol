pragma solidity ^0.4.24;

contract ISuperfluid {
    function callAgreement(
        address agreementClass,
        bytes callData,
        bytes userData
    )
        external
        returns (
            //cleanCtx
            bytes memory returnedData
        );
}
