/**
 * Nano Converter Usage Examples
 * 
 * Demonstrates how to use the NanoConverter utilities for safe, precise
 * Nano (XNO) conversions without floating-point errors.
 */

const { NanoConverter } = require('../utils/nano-converter');

console.log('='.repeat(80));
console.log('NANO CONVERTER USAGE EXAMPLES');
console.log('='.repeat(80));

// Example 1: Converting XNO to Raw (for transactions)
console.log('\n📤 Example 1: Converting XNO to Raw Units');
console.log('-'.repeat(80));
const xnoAmount = "0.1";
const rawAmount = NanoConverter.xnoToRaw(xnoAmount);
console.log(`User wants to send: ${xnoAmount} XNO`);
console.log(`Raw units for blockchain: ${rawAmount}`);
console.log(`✅ Use this value in sendTransaction's amountRaw parameter`);

// Example 2: Converting Raw to XNO (for display)
console.log('\n📥 Example 2: Converting Raw Units to XNO');
console.log('-'.repeat(80));
const rawBalance = "1234567890123456789012345678900";
const xnoBalance = NanoConverter.rawToXNO(rawBalance);
const formattedBalance = NanoConverter.formatXNO(xnoBalance, 6);
console.log(`Raw balance from blockchain: ${rawBalance}`);
console.log(`XNO amount: ${xnoBalance}`);
console.log(`Formatted for display: ${formattedBalance} XNO`);

// Example 3: Address Validation
console.log('\n🔒 Example 3: Validating Nano Addresses');
console.log('-'.repeat(80));
const validAddress = "nano_3h3m6kfckrxpc4t33jn36eu8smfpukwuq1zq4hy35dh4a7drs6ormhwhkncn";
const invalidAddress = "invalid_address_format";
console.log(`Valid address: ${validAddress}`);
console.log(`Is valid? ${NanoConverter.isValidNanoAddress(validAddress) ? '✅ YES' : '❌ NO'}`);
console.log(`\nInvalid address: ${invalidAddress}`);
console.log(`Is valid? ${NanoConverter.isValidNanoAddress(invalidAddress) ? '✅ YES' : '❌ NO'}`);

// Example 4: Formatting for Display
console.log('\n🎨 Example 4: Formatting XNO Amounts for Display');
console.log('-'.repeat(80));
const amounts = ["0.123456789", "1.5", "1000000.123456"];
const decimals = [2, 4, 6];
amounts.forEach((amount, index) => {
    const formatted = NanoConverter.formatXNO(amount, decimals[index]);
    console.log(`${amount} XNO formatted to ${decimals[index]} decimals: ${formatted} XNO`);
});

// Example 5: Round-Trip Conversion (Testing Precision)
console.log('\n🔄 Example 5: Round-Trip Conversion Test');
console.log('-'.repeat(80));
const testAmount = "0.000001";
const toRaw = NanoConverter.xnoToRaw(testAmount);
const backToXNO = NanoConverter.rawToXNO(toRaw);
console.log(`Original XNO: ${testAmount}`);
console.log(`Converted to raw: ${toRaw}`);
console.log(`Converted back to XNO: ${backToXNO}`);
console.log(`Precision preserved? ${testAmount === backToXNO ? '✅ YES' : '❌ NO'}`);

// Example 6: Common Conversion Examples
console.log('\n📊 Example 6: Common XNO to Raw Conversions');
console.log('-'.repeat(80));
const conversionExamples = NanoConverter.getConversionExamples();
Object.entries(conversionExamples).forEach(([xno, raw]) => {
    console.log(`${xno.padEnd(20)} => ${raw}`);
});

// Example 7: Getting Help Information
console.log('\n📚 Example 7: Conversion Help');
console.log('-'.repeat(80));
const help = NanoConverter.getConversionHelp();
console.log(`Description: ${help.description}`);
console.log(`Formula: ${help.formula}`);
console.log(`Reverse Formula: ${help.reverseFormula}`);
console.log(`Decimal Places: ${help.decimalPlaces}`);
console.log('\nCommon Mistakes:');
help.commonMistakes.forEach((mistake, index) => {
    console.log(`  ${index + 1}. ${mistake}`);
});

// Example 8: Complete Transaction Workflow
console.log('\n💸 Example 8: Complete Transaction Workflow');
console.log('-'.repeat(80));
const userInput = "0.5";
const senderAddress = "nano_3sender123456789012345678901234567890123456789012345678ab";
const recipientAddress = "nano_3receiver123456789012345678901234567890123456789012345cd";

console.log(`Step 1: User wants to send ${userInput} XNO`);

console.log(`\nStep 2: Validate addresses`);
const senderValid = NanoConverter.isValidNanoAddress(senderAddress);
const recipientValid = NanoConverter.isValidNanoAddress(recipientAddress);
console.log(`  Sender address valid: ${senderValid ? '✅' : '❌'}`);
console.log(`  Recipient address valid: ${recipientValid ? '✅' : '❌'}`);

if (senderValid && recipientValid) {
    console.log(`\nStep 3: Convert to raw units`);
    const transactionAmount = NanoConverter.xnoToRaw(userInput);
    console.log(`  Amount in raw: ${transactionAmount}`);
    
    console.log(`\nStep 4: Send transaction (via MCP)`);
    console.log(`  {`);
    console.log(`    "method": "sendTransaction",`);
    console.log(`    "params": {`);
    console.log(`      "fromAddress": "${senderAddress}",`);
    console.log(`      "toAddress": "${recipientAddress}",`);
    console.log(`      "amountRaw": "${transactionAmount}",`);
    console.log(`      "privateKey": "..."`)
    console.log(`    }`);
    console.log(`  }`);
    
    console.log(`\nStep 5: Display confirmation`);
    const displayAmount = NanoConverter.formatXNO(userInput, 6);
    console.log(`  "Sent ${displayAmount} XNO to ${recipientAddress.slice(0, 15)}..."`);
}

// Example 9: Demonstrating Precision Loss with Floating-Point
console.log('\n⚠️  Example 9: Why We Use String-Based BigInt (Avoiding Floating-Point Errors)');
console.log('-'.repeat(80));
const testXNO = 0.1;
console.log(`Using JavaScript Number (WRONG):`);
console.log(`  0.1 * 10^30 = ${testXNO * 1e30}`);
console.log(`  Notice the floating-point error!`);
console.log(`\nUsing NanoConverter (CORRECT):`);
console.log(`  xnoToRaw("0.1") = ${NanoConverter.xnoToRaw("0.1")}`);
console.log(`  Exact precision maintained!`);

// Example 10: Balance Formatting
console.log('\n💰 Example 10: Formatting Balance Objects');
console.log('-'.repeat(80));
const accountRaw = "2500000000000000000000000000000";
const balanceInfo = NanoConverter.formatBalance(accountRaw);
console.log(`Raw balance: ${balanceInfo.raw}`);
console.log(`XNO balance: ${balanceInfo.xno}`);
console.log(`Formatted: ${balanceInfo.formatted}`);
console.log(`Display string: ${balanceInfo.display}`);

console.log('\n' + '='.repeat(80));
console.log('✅ All examples completed successfully!');
console.log('='.repeat(80));
console.log('\n💡 TIP: Call the MCP method "nanoConverterHelp" for interactive guidance!');
console.log('   Example: {"jsonrpc":"2.0","method":"nanoConverterHelp","params":{},"id":1}\n');

