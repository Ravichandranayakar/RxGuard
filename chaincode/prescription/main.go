package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	prescriptionContract := new(PrescriptionContract)

	cc, err := contractapi.NewChaincode(prescriptionContract)
	if err != nil {
		log.Panicf("Error creating RxGuard prescription chaincode: %v", err)
	}

	if err := cc.Start(); err != nil {
		log.Panicf("Error starting prescription chaincode: %v", err)
	}
}
