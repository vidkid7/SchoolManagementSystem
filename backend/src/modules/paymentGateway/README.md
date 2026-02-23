# Payment Gateway Module

This module handles integration with Nepal payment gateways (eSewa, Khalti, IME Pay) for online fee payments.

## Features

- **eSewa Integration**: Complete integration with eSewa payment gateway
- **Signature Generation**: HMAC-SHA256 signature generation for secure transactions
- **Signature Verification**: Verify payment callbacks to prevent tampering
- **Transaction Tracking**: Track all gateway transactions with status
- **Automatic Expiry**: Transactions expire after 30 minutes
- **Payment Processing**: Automatic payment record creation on successful transaction
- **Test & Production Modes**: Support for both test and production environments

## Architecture

### Models

- **PaymentGatewayTransaction**: Tracks payment gateway transactions
  - Stores transaction UUID, amount, status, signatures
  - Links to invoice and student
  - Tracks expiry time and completion status

### Services

- **esewaService**: Handles eSewa payment gateway operations
  - `initiatePayment()`: Create transaction and generate payment form data
  - `generateSignature()`: Generate HMAC-SHA256 signature
  - `verifySignature()`: Verify callback signature
  - `handleCallback()`: Process successful payment callback
  - `handleFailure()`: Process failed payment callback

### Repository

- **paymentGatewayRepository**: Database operations for gateway transactions
  - CRUD operations for transactions
  - Find by UUID, invoice, student
  - Mark expired transactions
  - Statistics by gateway

## eSewa Integration

### Payment Flow

1. **Initiation**:
   - User selects eSewa payment method
   - System creates pending transaction record
   - Generates signature using HMAC-SHA256
   - Returns form data for eSewa redirect

2. **Payment**:
   - User is redirected to eSewa
   - User completes payment on eSewa
   - eSewa redirects back to success/failure URL

3. **Callback**:
   - System receives callback from eSewa
   - Verifies signature to prevent tampering
   - Validates amount and transaction status
   - Creates payment record if successful
   - Updates invoice balance

### Signature Generation

eSewa uses HMAC-SHA256 for signature generation:

```typescript
// Message format
const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

// Generate signature
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(message);
const signature = hmac.digest('base64');
```

### Signature Verification

On callback, the system verifies the signature:

```typescript
// Extract signed fields from callback
const signedFieldNames = callbackData.signed_field_names.split(',');

// Build message from signed fields
const messageParts = signedFieldNames.map(field => `${field}=${callbackData[field]}`);
const message = messageParts.join(',');

// Generate expected signature
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(message);
const expectedSignature = hmac.digest('base64');

// Compare signatures
return expectedSignature === callbackData.signature;
```

## Configuration

### Environment Variables

```env
# eSewa Test Mode (default)
ESEWA_MODE=test
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_SUCCESS_URL=http://localhost:3000/api/v1/payment/esewa/callback
ESEWA_FAILURE_URL=http://localhost:3000/api/v1/payment/esewa/failure

# eSewa Production Mode
ESEWA_MODE=production
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_secret_key
ESEWA_PRODUCT_CODE=your_product_code
ESEWA_PAYMENT_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_SUCCESS_URL=https://yourdomain.com/api/v1/payment/esewa/callback
ESEWA_FAILURE_URL=https://yourdomain.com/api/v1/payment/esewa/failure
```

## Usage Example

### Initiate Payment

```typescript
import esewaService from '@modules/paymentGateway/esewa.service';

const paymentData = {
  invoiceId: 1,
  studentId: 1,
  amount: 5000,
  taxAmount: 0,
  serviceCharge: 0
};

const result = await esewaService.initiatePayment(paymentData, userId);

// result contains:
// - transaction: PaymentGatewayTransaction record
// - paymentUrl: eSewa payment URL
// - formData: Form data to submit to eSewa
```

### Handle Callback

```typescript
import esewaService from '@modules/paymentGateway/esewa.service';

const callbackData = {
  transaction_uuid: 'uuid-from-esewa',
  transaction_code: 'ESEWA-TXN-123',
  total_amount: '5000',
  status: 'COMPLETE',
  signed_field_names: 'total_amount,transaction_uuid,product_code',
  product_code: 'EPAYTEST',
  signature: 'signature-from-esewa'
};

const result = await esewaService.handleCallback(callbackData, userId);

// result contains:
// - success: boolean
// - message: string
// - paymentId: number (if successful)
```

## Security Features

1. **Signature Verification**: All callbacks are verified using HMAC-SHA256
2. **Amount Validation**: Ensures received amount matches expected amount
3. **Transaction Expiry**: Transactions expire after 30 minutes
4. **Status Validation**: Only COMPLETE status is accepted
5. **Duplicate Prevention**: Prevents processing same transaction twice
6. **Tamper Detection**: Rejects callbacks with invalid signatures

## Testing

### Unit Tests

```bash
npm test -- esewa.service.test.ts
```

Tests cover:
- Signature generation and verification
- Payment initiation
- Callback handling
- Error scenarios
- Security validations

### Integration Tests

```bash
npm test -- paymentGateway.repository.test.ts
```

Tests cover:
- Database operations
- Transaction lifecycle
- Expiry handling
- Statistics generation

## Database Schema

### payment_gateway_transactions

| Column | Type | Description |
|--------|------|-------------|
| transaction_id | INT | Primary key |
| transaction_uuid | VARCHAR(100) | Unique transaction UUID |
| gateway | ENUM | Payment gateway (esewa, khalti, ime_pay) |
| invoice_id | INT | Link to invoice |
| student_id | INT | Link to student |
| amount | DECIMAL(10,2) | Transaction amount |
| product_code | VARCHAR(50) | Gateway product code |
| status | ENUM | pending, success, failed, expired |
| initiated_at | DATETIME | When transaction was initiated |
| completed_at | DATETIME | When transaction completed |
| gateway_response | JSON | Raw gateway response |
| signature | TEXT | Transaction signature |
| verification_data | JSON | Data for verification |
| failure_reason | TEXT | Reason for failure |
| payment_id | INT | Link to payment (after success) |
| expires_at | DATETIME | Transaction expiry time |

## Error Handling

The service handles various error scenarios:

1. **Invoice Not Found**: Returns error if invoice doesn't exist
2. **Insufficient Balance**: Validates payment amount against invoice balance
3. **Invalid Signature**: Rejects callbacks with invalid signatures
4. **Amount Mismatch**: Rejects if received amount differs from expected
5. **Transaction Expired**: Rejects expired transactions
6. **Already Processed**: Prevents duplicate processing
7. **Payment Failed**: Handles failed payment status from gateway

## Future Enhancements

1. **Khalti Integration**: Add Khalti payment gateway support
2. **IME Pay Integration**: Add IME Pay support
3. **Refund Support**: Handle refunds through gateway
4. **Webhook Support**: Add webhook support for async notifications
5. **Payment Links**: Generate payment links for sharing
6. **QR Code Payments**: Support QR code based payments
7. **Recurring Payments**: Support for recurring/subscription payments

## References

- [eSewa API Documentation](https://developer.esewa.com.np/)
- [eSewa Integration Guide](https://developer.esewa.com.np/pages/Epay)
- [HMAC-SHA256 Specification](https://tools.ietf.org/html/rfc2104)

## Support

For issues or questions:
- Check the test files for usage examples
- Review the service code for implementation details
- Contact the development team for assistance
