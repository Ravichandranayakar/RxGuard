package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type PrescriptionContract struct {
	contractapi.Contract
}

type DispenseEvent struct {
	TxID           string    `json:"tx_id"`
	DispenserID    string    `json:"dispenser_id"`
	PharmacyOrg    string    `json:"pharmacy_org"`
	Quantity       int       `json:"quantity"`
	RemainingAfter int       `json:"remaining_after"`
	Timestamp      time.Time `json:"timestamp"`
}

type PrescriptionRecord struct {
	DocType           string          `json:"doc_type"`
	PrescriptionID    string          `json:"prescription_id"`
	PayloadHash       string          `json:"payload_hash"`
	IssuerOrgID       string          `json:"issuer_org_id"`
	PrescriberID      string          `json:"prescriber_id"`
	PrescriberKeyID   string          `json:"prescriber_key_id"`
	Status            string          `json:"status"` // ISSUED, PARTIALLY_DISPENSED, FULLY_DISPENSED, REVOKED, EXPIRED
	TotalQuantity     int             `json:"total_quantity"`
	RemainingQuantity int             `json:"remaining_quantity"`
	IssuedAt          time.Time       `json:"issued_at"`
	ExpiresAt         time.Time       `json:"expires_at"`
	Revoked           bool            `json:"revoked"`
	RevocationReason  string          `json:"revocation_reason"`
	DispenseEvents    []DispenseEvent `json:"dispense_events"`
}

type IssuerKeyRecord struct {
	DocType      string    `json:"doc_type"`
	KeyID        string    `json:"key_id"`
	OrgID        string    `json:"org_id"`
	PrescriberID string    `json:"prescriber_id"`
	PublicKeyPEM string    `json:"public_key_pem"`
	Status       string    `json:"status"` // ACTIVE, REVOKED
	RegisteredAt time.Time `json:"registered_at"`
}

func (c *PrescriptionContract) CreatePrescription(
	ctx contractapi.TransactionContextInterface,
	prescriptionID string,
	payloadHash string,
	issuerOrgID string,
	prescriberID string,
	prescriberKeyID string,
	totalQuantity int,
	expiresAtISO string,
) error {
	exists, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists != nil {
		return fmt.Errorf("the prescription %s already exists", prescriptionID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	issuedAt := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC()

	expTime, err := time.Parse(time.RFC3339, expiresAtISO)
	if err != nil {
		return fmt.Errorf("invalid expiration timestamp format: %v", err)
	}

	record := PrescriptionRecord{
		DocType:           "prescription_record",
		PrescriptionID:    prescriptionID,
		PayloadHash:       payloadHash,
		IssuerOrgID:       issuerOrgID,
		PrescriberID:      prescriberID,
		PrescriberKeyID:   prescriberKeyID,
		Status:            "ISSUED",
		TotalQuantity:     totalQuantity,
		RemainingQuantity: totalQuantity,
		IssuedAt:          issuedAt,
		ExpiresAt:         expTime,
		Revoked:           false,
		RevocationReason:  "",
		DispenseEvents:    []DispenseEvent{},
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(prescriptionID, recordJSON)
}

func (c *PrescriptionContract) ReadPrescription(
	ctx contractapi.TransactionContextInterface,
	prescriptionID string,
) (*PrescriptionRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("prescription %s does not exist", prescriptionID)
	}

	var record PrescriptionRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

func (c *PrescriptionContract) RecordDispense(
	ctx contractapi.TransactionContextInterface,
	prescriptionID string,
	quantity int,
	pharmacyOrg string,
	dispenserID string,
) (*PrescriptionRecord, error) {
	record, err := c.ReadPrescription(ctx, prescriptionID)
	if err != nil {
		return nil, err
	}

	if record.Revoked {
		return nil, fmt.Errorf("prescription %s is revoked and cannot be dispensed", prescriptionID)
	}

	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return nil, err
	}
	now := time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)).UTC()

	if now.After(record.ExpiresAt) {
		record.Status = "EXPIRED"
		recJSON, _ := json.Marshal(record)
		_ = ctx.GetStub().PutState(prescriptionID, recJSON)
		return nil, fmt.Errorf("prescription %s has expired on %s", prescriptionID, record.ExpiresAt.Format(time.RFC3339))
	}

	if record.RemainingQuantity < quantity {
		return nil, fmt.Errorf("insufficient quantity available: remaining %d, requested %d", record.RemainingQuantity, quantity)
	}

	newRemaining := record.RemainingQuantity - quantity
	record.RemainingQuantity = newRemaining
	if newRemaining == 0 {
		record.Status = "FULLY_DISPENSED"
	} else {
		record.Status = "PARTIALLY_DISPENSED"
	}

	event := DispenseEvent{
		TxID:           ctx.GetStub().GetTxID(),
		DispenserID:    dispenserID,
		PharmacyOrg:    pharmacyOrg,
		Quantity:       quantity,
		RemainingAfter: newRemaining,
		Timestamp:      now,
	}
	record.DispenseEvents = append(record.DispenseEvents, event)

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}

	err = ctx.GetStub().PutState(prescriptionID, recordJSON)
	if err != nil {
		return nil, err
	}

	return record, nil
}

func (c *PrescriptionContract) RevokePrescription(
	ctx contractapi.TransactionContextInterface,
	prescriptionID string,
	reason string,
	revokingOrg string,
) error {
	record, err := c.ReadPrescription(ctx, prescriptionID)
	if err != nil {
		return err
	}

	if record.IssuerOrgID != revokingOrg {
		return fmt.Errorf("unauthorized: only issuing organization %s may revoke, caller is %s", record.IssuerOrgID, revokingOrg)
	}

	record.Revoked = true
	record.Status = "REVOKED"
	record.RevocationReason = reason

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(prescriptionID, recordJSON)
}
